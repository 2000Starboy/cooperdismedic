const { matchProduct, normalize, stringSimilarity, compareDCI, compareDosage } = require('./matcher.js');

// Mock AMMPS Database
const mockAmmpsDb = [
  {
    specialty: "DOLIPRANE",
    dosage: "1 G",
    form: "COMPRIME SECABLE",
    dci: "PARACETAMOL",
    laboratory: "BOTTU",
    status: "Commercialisé"
  },
  {
    specialty: "DOLIPRANE",
    dosage: "500 MG",
    form: "COMPRIME",
    dci: "PARACETAMOL",
    laboratory: "BOTTU",
    status: "Commercialisé"
  },
  {
    specialty: "CODOLIPRANE",
    dosage: "400 MG / 20 MG",
    form: "COMPRIME SECABLE",
    dci: "PARACETAMOL // CODEINE",
    laboratory: "BOTTU",
    status: "Commercialisé"
  },
  {
    specialty: "MEDIATOR",
    dosage: "150 MG",
    form: "COMPRIME ENROBE",
    dci: "BENFLUOREX",
    laboratory: "SERVIER",
    status: "Retiré du Marché"
  },
  {
    specialty: "ZADRYL",
    dosage: "1 MG / ML",
    form: "SOLUTION BUVABLE",
    dci: "CETIRIZINE",
    laboratory: "PHARMA 5",
    status: "Commercialisé AO"
  }
];

// Test Cases matching Excel fields
const testCases = [
  {
    name: "Exact name match (Doliprane 1g)",
    excel: { NOM: "DOLIPRANE", DCI1: "PARACETAMOL", DOSAGE1: "1", UNITE_DOSAGE1: "G", FORME: "COMPRIME SECABLE" },
    expectedName: "DOLIPRANE",
    expectedStatus: "Commercialisé"
  },
  {
    name: "Dosage unit conversion match (Doliprane 1000mg to 1g)",
    excel: { NOM: "DOLIPRANE", DCI1: "PARACETAMOL", DOSAGE1: "1000", UNITE_DOSAGE1: "MG", FORME: "COMPRIME SECABLE" },
    expectedName: "DOLIPRANE",
    expectedStatus: "Commercialisé"
  },
  {
    name: "Fuzzy name match (Zadryl with spelling variant)",
    excel: { NOM: "ZADRYL 1 MG", DCI1: "CETIRIZINE", DOSAGE1: "1", UNITE_DOSAGE1: "MG", FORME: "SOLUTION BUVABLE" },
    expectedName: "ZADRYL",
    expectedStatus: "Commercialisé AO"
  },
  {
    name: "Retired medication match (Mediator)",
    excel: { NOM: "MEDIATOR", DCI1: "BENFLUOREX", DOSAGE1: "150", UNITE_DOSAGE1: "MG", FORME: "COMPRIME ENROBE" },
    expectedName: "MEDIATOR",
    expectedStatus: "Retiré du Marché"
  },
  {
    name: "Multi-molecule DCI match (Codoliprane)",
    excel: { NOM: "CODOLIPRANE", DCI1: "PARACETAMOL + CODEINE", DOSAGE1: "400", UNITE_DOSAGE1: "MG", FORME: "COMPRIME" },
    expectedName: "CODOLIPRANE",
    expectedStatus: "Commercialisé"
  }
];

console.log("=== RUNNING MATCHER ENGINE TESTS ===\n");
let passed = 0;

for (const tc of testCases) {
  const result = matchProduct(tc.excel, mockAmmpsDb);
  const matchedItem = result.match;
  
  console.log(`Test: ${tc.name}`);
  if (matchedItem) {
    console.log(`  -> Matched: ${matchedItem.specialty} (${matchedItem.status})`);
    console.log(`  -> Score: ${result.score} | Method: ${result.method}`);
    
    if (matchedItem.specialty === tc.expectedName && matchedItem.status === tc.expectedStatus) {
      console.log("  \x1b[32m[PASS]\x1b[0m\n");
      passed++;
    } else {
      console.log(`  \x1b[31m[FAIL]\x1b[0m (Expected: ${tc.expectedName} with status ${tc.expectedStatus})\n`);
    }
  } else {
    console.log("  -> No match found");
    if (tc.expectedName === null) {
      console.log("  \x1b[32m[PASS]\x1b[0m\n");
      passed++;
    } else {
      console.log(`  \x1b[31m[FAIL]\x1b[0m (Expected: ${tc.expectedName})\n`);
    }
  }
}

console.log(`Result: ${passed}/${testCases.length} tests passed.`);
if (passed === testCases.length) {
  console.log("\x1b[32mAll matcher tests passed successfully!\x1b[0m");
} else {
  console.log("\x1b[31mSome matcher tests failed. Please inspect logic.\x1b[0m");
  process.exit(1);
}
