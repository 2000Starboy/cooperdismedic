if (typeof global.File === 'undefined') {
  const { Blob } = require('buffer');
  global.Blob = Blob;
  global.File = class File extends Blob {
    constructor(parts, filename, options = {}) {
      super(parts, options);
      this.name = filename;
    }
  };
}

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { matchProduct, normalize, buildIndices } = require('./matcher.js');

// Paths
const EXCEL_PATH = path.resolve(__dirname, '../../ref-des-medicaments-cnops-2014.xlsx');
const AMMPS_DB_PATH = path.resolve(__dirname, 'ammps_database.json');

const OUTPUT_ACTIFS_PATH = path.resolve(__dirname, '../../medicaments_actifs.xlsx');
const OUTPUT_SUPPRIMER_PATH = path.resolve(__dirname, '../../medicaments_a_supprimer.xlsx');
const OUTPUT_VERIFIER_PATH = path.resolve(__dirname, '../../medicaments_a_verifier.xlsx');

async function main() {
  console.log('=== MEDICATION DATABASE CLEANER ===');
  
  // 1. Verify files exist
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`Excel file not found at: ${EXCEL_PATH}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(AMMPS_DB_PATH)) {
    console.error(`AMMPS Database not found at: ${AMMPS_DB_PATH}. Please run scraper.js first.`);
    process.exit(1);
  }

  // 2. Load AMMPS Database
  console.log('Loading AMMPS Database...');
  const ammpsDb = JSON.parse(fs.readFileSync(AMMPS_DB_PATH, 'utf-8'));
  console.log(`Loaded ${ammpsDb.length} AMMPS medication records.`);
  
  console.log('Building AMMPS search indices...');
  const indices = buildIndices(ammpsDb);
  console.log('Search indices built successfully.');

  // 3. Load input Excel file
  console.log(`Reading Excel file: ${path.basename(EXCEL_PATH)}...`);
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const excelData = XLSX.utils.sheet_to_json(worksheet);
  console.log(`Loaded ${excelData.length} records from Excel sheet "${sheetName}".`);

  // 4. Categories arrays
  const actifsList = [];
  const supprimerList = [];
  const verifierList = [];

  // Match statistics
  let stats = {
    exactMatch: 0,
    fuzzyMatch: 0,
    fallbackMatch: 0,
    noMatch: 0,
    ambiguous: 0,
    commercialised: 0,
    retired: 0,
    nonCommercialised: 0,
    specialStatus: 0
  };

  console.log('\nStarting matching process...');
  const startTime = Date.now();

  for (let i = 0; i < excelData.length; i++) {
    const row = excelData[i];
    
    // Log progress every 500 rows
    if (i > 0 && i % 500 === 0) {
      console.log(`Matched ${i}/${excelData.length} rows (${Math.round((i / excelData.length) * 100)}%)...`);
    }

    const matchResult = matchProduct(row, ammpsDb, indices);
    const { match, score, method, isAmbiguous, alternatives } = matchResult;

    // Build base output object matching all original columns
    const baseRow = { ...row };

    // Inject matching metadata for transparency
    const matchMeta = match ? {
      AMMPS_NOM: match.specialty,
      AMMPS_DCI: match.dci,
      AMMPS_DOSAGE: match.dosage,
      AMMPS_FORME: match.form,
      AMMPS_LABO: match.laboratory,
      AMMPS_STATUT_OFFICIEL: match.status,
      MATCH_METHODE: method,
      MATCH_SCORE: Math.round(score * 100) / 100
    } : {};

    if (!match) {
      stats.noMatch++;
      verifierList.push({
        ...baseRow,
        RAISON_SIGNALEMENT: "Aucune correspondance trouvée dans la base officielle de l'AMMPS",
        MATCH_METHODE: 'none',
        MATCH_SCORE: 0
      });
      continue;
    }

    // Stats on match type
    if (method === 'exact_name') stats.exactMatch++;
    else if (method === 'fuzzy_name') stats.fuzzyMatch++;
    else if (method === 'dci_dosage_form_match') stats.fallbackMatch++;

    if (isAmbiguous) {
      stats.ambiguous++;
      const altList = alternatives.map(alt => `${alt.specialty} (${alt.status})`).join(' | ');
      verifierList.push({
        ...baseRow,
        ...matchMeta,
        RAISON_SIGNALEMENT: `Correspondance ambiguë. Meilleur match: ${match.specialty}. Alternatives proches: ${altList}`
      });
      continue;
    }

    // Determine action based on AMMPS status
    const status = match.status;
    const statusNorm = normalize(status);

    if (statusNorm.includes('commercialise') && !statusNorm.includes('non commercialise')) {
      stats.commercialised++;
      actifsList.push({
        ...baseRow,
        ...matchMeta
      });
    } else if (statusNorm.includes('retire') || statusNorm.includes('suspendu')) {
      stats.retired++;
      supprimerList.push({
        ...baseRow,
        ...matchMeta,
        RAISON_SUPPRESSION: `Statut AMMPS officiel : ${status}`
      });
    } else if (statusNorm.includes('non commercialise')) {
      stats.nonCommercialised++;
      supprimerList.push({
        ...baseRow,
        ...matchMeta,
        RAISON_SUPPRESSION: `Statut AMMPS officiel : ${status}`
      });
    } else {
      // Special status (e.g. "AMM Sans Prix", "En cours de fixation de prix")
      stats.specialStatus++;
      verifierList.push({
        ...baseRow,
        ...matchMeta,
        RAISON_SIGNALEMENT: `Statut AMMPS particulier : ${status}`
      });
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`\nMatching completed in ${duration} seconds.`);
  console.log('\n=== MATCHING STATISTICS ===');
  console.log(`Exact Name Matches:     ${stats.exactMatch}`);
  console.log(`Fuzzy Name Matches:     ${stats.fuzzyMatch}`);
  console.log(`DCI/Dosage Matches:     ${stats.fallbackMatch}`);
  console.log(`No Match Found:         ${stats.noMatch}`);
  console.log(`Ambiguous Matches:      ${stats.ambiguous}`);
  console.log('---------------------------');
  console.log(`Commercialised:         ${stats.commercialised} (to keep)`);
  console.log(`Retired / Suspended:    ${stats.retired} (to delete)`);
  console.log(`Non Commercialised:     ${stats.nonCommercialised} (to delete)`);
  console.log(`Special/Ambiguous Status:${stats.specialStatus + stats.ambiguous} (to verify)`);
  console.log(`Untraceable (No Match):  ${stats.noMatch} (to verify)`);
  console.log('---------------------------');
  console.log(`Actifs (actifs.xlsx):       ${actifsList.length}`);
  console.log(`A Supprimer (supprimer.xlsx):${supprimerList.length}`);
  console.log(`A Verifier (verifier.xlsx):  ${verifierList.length}`);
  console.log('Total Processed:        ' + (actifsList.length + supprimerList.length + verifierList.length));

  // 5. Generate Excel Workbooks
  console.log('\nGenerating output files...');

  const writeExcel = (data, outputPath, sheetName) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, outputPath);
    console.log(`Successfully generated: ${path.basename(outputPath)} (${data.length} rows)`);
  };

  writeExcel(actifsList, OUTPUT_ACTIFS_PATH, "Médicaments Actifs");
  writeExcel(supprimerList, OUTPUT_SUPPRIMER_PATH, "Médicaments à Supprimer");
  writeExcel(verifierList, OUTPUT_VERIFIER_PATH, "Médicaments à Vérifier");

  console.log('\nDatabase cleaning operation completed successfully!');
}

main().catch(err => {
  console.error('Fatal Cleaner Error:', err);
  process.exit(1);
});
