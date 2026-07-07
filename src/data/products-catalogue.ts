// ============================================================================
// products-catalogue.ts — Mock pharmaceutical product catalogue
// Cooper Dismedic · No stock data (informational only)
// ============================================================================

export type ProductCategory =
  | 'analgesic'
  | 'antibiotic'
  | 'cardiovascular'
  | 'seasonal'
  | 'baby'
  | 'mom'
  | 'digestive'
  | 'dermatology'
  | 'respiratory'
  | 'vitamins';

export type ProductSeason = 'spring' | 'summer' | 'fall' | 'winter';

export interface Product {
  id: number;
  name: string;
  dci: string;                     // Dénomination Commune Internationale
  laboratory: string;
  form: string;                    // Comprimé, Sirop, Injectable, Crème…
  dosage: string;
  therapeuticClass: string;
  categories: ProductCategory[];
  seasons?: ProductSeason[];       // products recommended for specific seasons
  description: string;
  indications: string;
  posology: string;
  contraindications: string;
  sideEffects: string;
  conservation: string;
  pregnancyCategory: 'A' | 'B' | 'C' | 'D' | 'X' | 'N/A';
  isPrescriptionRequired: boolean;
  ppm?: number;                    // Prix Public Maroc (optional informational)
  relatedIds?: number[];
}

export const PRODUCTS: Product[] = [
  // ── Analgesics / Antipyretics ─────────────────────────────────────────────
  {
    id: 1,
    name: 'PARACÉTAMOL 1000MG',
    dci: 'Paracétamol',
    laboratory: 'Cooper Pharma',
    form: 'Comprimé effervescent',
    dosage: '1000 mg',
    therapeuticClass: 'Analgésique – Antipyrétique',
    categories: ['analgesic'],
    description: 'Antalgique et antipyrétique d\'action centrale. Indiqué dans le traitement symptomatique des douleurs d\'intensité légère à modérée et/ou des états fébriles.',
    indications: 'Douleurs légères à modérées (céphalées, douleurs dentaires, douleurs musculaires), états fébriles.',
    posology: 'Adultes : 1 comprimé 3 à 4 fois par jour. Intervalle minimum de 4 heures. Ne pas dépasser 4 g/jour (4 comprimés).',
    contraindications: 'Hypersensibilité au paracétamol. Insuffisance hépatique sévère. Alcoolisme chronique.',
    sideEffects: 'Rares : réactions cutanées (urticaire), atteinte hépatique en cas de surdosage.',
    conservation: 'Conserver à température ambiante (< 25°C). À l\'abri de l\'humidité.',
    pregnancyCategory: 'B',
    isPrescriptionRequired: false,
    ppm: 12.50,
    relatedIds: [2, 3, 4],
  },
  {
    id: 2,
    name: 'PARACÉTAMOL PÉDIATRIQUE 120MG/5ML',
    dci: 'Paracétamol',
    laboratory: 'Cooper Pharma',
    form: 'Sirop',
    dosage: '120 mg / 5 ml',
    therapeuticClass: 'Analgésique – Antipyrétique pédiatrique',
    categories: ['analgesic', 'baby'],
    description: 'Sirop pédiatrique à base de paracétamol, adapté aux nourrissons et jeunes enfants dès 3 mois. Goût fraise agréable facilitant la prise.',
    indications: 'Fièvre et douleurs légères à modérées chez l\'enfant (3 mois – 12 ans). Dentition, vaccination, otite, rhinopharyngite.',
    posology: '15 mg/kg toutes les 6 heures. Dépasser pas 60 mg/kg/jour. Utiliser la pipette graduée fournie.',
    contraindications: 'Hypersensibilité au paracétamol. Insuffisance hépatique ou rénale sévère. Moins de 3 mois.',
    sideEffects: 'Très rares : réactions allergiques, éruptions cutanées.',
    conservation: 'Conserver à température ambiante. Une fois ouvert, utiliser dans les 30 jours.',
    pregnancyCategory: 'B',
    isPrescriptionRequired: false,
    ppm: 18.00,
    relatedIds: [1, 5, 16],
  },
  {
    id: 3,
    name: 'IBUPROFÈNE 400MG',
    dci: 'Ibuprofène',
    laboratory: 'Sanofi Maroc',
    form: 'Comprimé enrobé',
    dosage: '400 mg',
    therapeuticClass: 'Anti-inflammatoire non stéroïdien (AINS)',
    categories: ['analgesic'],
    description: 'AINS de la famille des propioniques. Propriétés anti-inflammatoires, analgésiques et antipyrétiques.',
    indications: 'Douleurs rhumatismales, douleurs menstruelles (dysménorrhée), céphalées, douleurs dentaires, états fébriles.',
    posology: 'Adultes : 400 mg 3 fois/jour au cours des repas. Ne pas dépasser 1200 mg/jour sans avis médical.',
    contraindications: 'Ulcère gastro-duodénal évolutif, insuffisance rénale sévère, grossesse à partir du 6e mois, hypersensibilité aux AINS.',
    sideEffects: 'Troubles digestifs (nausées, douleurs abdominales), risque ulcérogène, vertiges. Rares : atteintes rénales.',
    conservation: 'À l\'abri de la chaleur et de l\'humidité (< 25°C).',
    pregnancyCategory: 'C',
    isPrescriptionRequired: false,
    ppm: 22.00,
    relatedIds: [1, 4],
  },
  {
    id: 4,
    name: 'ASPIRINE UPSA 500MG',
    dci: 'Acide acétylsalicylique',
    laboratory: 'UPSA',
    form: 'Comprimé effervescent',
    dosage: '500 mg',
    therapeuticClass: 'Analgésique – Antipyrétique – Antiagrégant plaquettaire',
    categories: ['analgesic', 'cardiovascular'],
    description: 'Médicament à base d\'acide acétylsalicylique. À forte dose : antalgique et antipyrétique. À faible dose : antiagrégant plaquettaire en prévention cardiovasculaire.',
    indications: 'Analgésie légère à modérée, fièvre, prévention des accidents cardiovasculaires (à faible dose sur prescription).',
    posology: 'Douleur/fièvre adulte : 500 mg à 1 g toutes les 4-6 h. Max 3 g/jour.',
    contraindications: 'Enfants < 15 ans (risque syndrome de Reye), ulcère gastro-duodénal, hémophilie, grossesse 3e trimestre.',
    sideEffects: 'Troubles digestifs, saignements, réactions allergiques rares.',
    conservation: 'À l\'abri de l\'humidité. Ne pas utiliser comprimés à odeur de vinaigre.',
    pregnancyCategory: 'C',
    isPrescriptionRequired: false,
    ppm: 15.00,
    relatedIds: [1, 3, 9],
  },

  // ── Antibiotics ───────────────────────────────────────────────────────────
  {
    id: 5,
    name: 'AMOXICILLINE 500MG',
    dci: 'Amoxicilline',
    laboratory: 'Cooper Pharma',
    form: 'Gélule',
    dosage: '500 mg',
    therapeuticClass: 'Antibiotique – Pénicilline',
    categories: ['antibiotic'],
    description: 'Antibiotique de la famille des aminopénicillines, à large spectre. Actif sur les bactéries Gram+ et certains Gram-.',
    indications: 'Infections ORL (angine, otite, sinusite), respiratoires, urinaires, cutanées et stomatologiques à bactéries sensibles.',
    posology: 'Adultes : 500 mg à 1 g 3 fois/jour selon sévérité. Durée habituelle 7-10 jours. Toujours compléter le traitement.',
    contraindications: 'Allergie aux pénicillines ou céphalosporines. Mononucléose infectieuse.',
    sideEffects: 'Troubles digestifs, diarrhées, réactions allergiques cutanées (urticaire, rash). Rares : choc anaphylactique.',
    conservation: 'Conserver < 25°C. Suspension préparée : 7 jours au réfrigérateur.',
    pregnancyCategory: 'B',
    isPrescriptionRequired: true,
    ppm: 35.00,
    relatedIds: [6, 7],
  },
  {
    id: 6,
    name: 'AZITHROMYCINE 500MG',
    dci: 'Azithromycine',
    laboratory: 'Maphar',
    form: 'Comprimé pelliculé',
    dosage: '500 mg',
    therapeuticClass: 'Antibiotique – Macrolide',
    categories: ['antibiotic'],
    description: 'Macrolide de longue durée d\'action (demi-vie 68 h). Active sur germes atypiques, Chlamydia, Mycoplasme.',
    indications: 'Infections ORL et respiratoires basses chez l\'adulte, infections génitales à Chlamydia, infections cutanées.',
    posology: 'Adultes : 500 mg en une seule prise/jour pendant 3 jours. Prendre à distance des repas.',
    contraindications: 'Hypersensibilité aux macrolides, insuffisance hépatique sévère, allongement QT.',
    sideEffects: 'Troubles digestifs légers, allongement QT (rare), atteinte hépatique (rare).',
    conservation: 'À l\'abri de l\'humidité et de la chaleur.',
    pregnancyCategory: 'B',
    isPrescriptionRequired: true,
    ppm: 58.00,
    relatedIds: [5, 7],
  },
  {
    id: 7,
    name: 'CIPROFLOXACINE 500MG',
    dci: 'Ciprofloxacine',
    laboratory: 'Bayer Maroc',
    form: 'Comprimé',
    dosage: '500 mg',
    therapeuticClass: 'Antibiotique – Fluoroquinolone',
    categories: ['antibiotic'],
    description: 'Fluoroquinolone à large spectre. Bactéricide par inhibition de l\'ADN gyrase bactérienne.',
    indications: 'Infections urinaires compliquées, infections respiratoires, infections osseuses et articulaires, certaines infections gastro-intestinales.',
    posology: 'Adultes : 500 mg à 750 mg 2 fois/jour selon indication. Durée 7-14 jours.',
    contraindications: 'Antécédents de tendinopathies aux fluoroquinolones, épilepsie non contrôlée, association aux médicaments allongeant le QT.',
    sideEffects: 'Troubles digestifs, tendinopathies (tendon d\'Achille ++), photosensibilisation, vertiges, convulsions rares.',
    conservation: 'À l\'abri de la lumière et < 30°C.',
    pregnancyCategory: 'C',
    isPrescriptionRequired: true,
    ppm: 72.00,
    relatedIds: [5, 6],
  },

  // ── Cardiovascular ────────────────────────────────────────────────────────
  {
    id: 8,
    name: 'AMLODIPINE 5MG',
    dci: 'Amlodipine',
    laboratory: 'Cooper Pharma',
    form: 'Comprimé',
    dosage: '5 mg',
    therapeuticClass: 'Inhibiteur calcique – Antihypertenseur',
    categories: ['cardiovascular'],
    description: 'Inhibiteur calcique de longue durée d\'action. Traitement de l\'hypertension artérielle et de l\'angor stable.',
    indications: 'Hypertension artérielle (HTA), angor stable chronique, angor vasospastique (Prinzmetal).',
    posology: 'HTA/Angor : 5 mg en une prise quotidienne. Peut être augmentée à 10 mg/jour selon réponse. Durée indéterminée.',
    contraindications: 'Hypersensibilité aux dihydropyridines, choc cardiogénique, angor instable, sténose aortique sévère.',
    sideEffects: 'Céphalées, œdèmes des membres inférieurs, flush, palpitations, fatigue.',
    conservation: 'À l\'abri de l\'humidité, < 30°C.',
    pregnancyCategory: 'C',
    isPrescriptionRequired: true,
    ppm: 45.00,
    relatedIds: [9, 10],
  },
  {
    id: 9,
    name: 'ATORVASTATINE 20MG',
    dci: 'Atorvastatine calcique',
    laboratory: 'Pfizer Maroc',
    form: 'Comprimé pelliculé',
    dosage: '20 mg',
    therapeuticClass: 'Hypolipémiant – Inhibiteur de la HMG-CoA réductase (statine)',
    categories: ['cardiovascular'],
    description: 'Statine inhibant la HMG-CoA réductase, enzyme clé de la synthèse du cholestérol hépatique. Réduit LDL-cholestérol de 35-55 %.',
    indications: 'Hypercholestérolémie primaire, prévention des événements cardiovasculaires (infarctus, AVC) chez patients à risque.',
    posology: 'Débuter à 10-20 mg/jour en une prise, le soir de préférence. Adapter selon bilan lipidique. Durée indéterminée.',
    contraindications: 'Myopathie, insuffisance hépatique active, grossesse et allaitement, association avec certains antifongiques.',
    sideEffects: 'Myalgies (douleurs musculaires), rhabdomyolyse rare, élévation transaminases, céphalées, troubles digestifs.',
    conservation: 'À l\'abri de la lumière et de l\'humidité.',
    pregnancyCategory: 'X',
    isPrescriptionRequired: true,
    ppm: 88.00,
    relatedIds: [8, 4],
  },
  {
    id: 10,
    name: 'METFORMINE 1000MG',
    dci: 'Metformine chlorhydrate',
    laboratory: 'Merck Maroc',
    form: 'Comprimé pelliculé',
    dosage: '1000 mg',
    therapeuticClass: 'Antidiabétique oral – Biguanide',
    categories: ['cardiovascular'],
    description: 'Antidiabétique oral de référence dans le diabète de type 2. Améliore la sensibilité à l\'insuline et réduit la production hépatique de glucose.',
    indications: 'Diabète de type 2 (DT2) chez l\'adulte, particulièrement en surpoids. En mono ou polythérapie.',
    posology: 'Initier à 500-850 mg/jour avec repas, augmenter progressivement. Dose maximale : 3000 mg/jour répartis en 2-3 prises.',
    contraindications: 'Insuffisance rénale (DFG < 30 ml/min), insuffisance hépatique, acidocétose, alcoolisme, interventions chirurgicales majeures.',
    sideEffects: 'Troubles gastro-intestinaux (nausées, diarrhées) surtout en début. Acidose lactique (très rare mais grave). Carence en B12 à long terme.',
    conservation: 'À l\'abri de l\'humidité, < 25°C.',
    pregnancyCategory: 'B',
    isPrescriptionRequired: true,
    ppm: 42.00,
    relatedIds: [9, 8],
  },

  // ── Seasonal / Spring (March) ─────────────────────────────────────────────
  {
    id: 11,
    name: 'CÉTIRIZINE 10MG',
    dci: 'Cétirizine dichlorhydrate',
    laboratory: 'Cooper Pharma',
    form: 'Comprimé pelliculé',
    dosage: '10 mg',
    therapeuticClass: 'Antihistaminique H1 – 2e génération',
    categories: ['seasonal', 'respiratory'],
    seasons: ['spring', 'summer'],
    description: 'Antihistaminique H1 de 2e génération, peu sédatif. Durée d\'action 24 heures permettant une prise unique.',
    indications: 'Rhinite allergique saisonnière (pollinose), rhinite allergique perannuelle, urticaire chronique idiopathique.',
    posology: 'Adultes et enfants ≥ 6 ans : 10 mg/jour en une prise. Peut être pris le soir pour minimiser la sédation résiduelle.',
    contraindications: 'Hypersensibilité à la cétirizine ou à la lévocétirizine. Prudence en cas d\'insuffisance rénale sévère.',
    sideEffects: 'Somnolence légère, céphalées, bouche sèche. Effets moins marqués que les antihistaminiques 1re génération.',
    conservation: 'À l\'abri de l\'humidité, < 25°C.',
    pregnancyCategory: 'B',
    isPrescriptionRequired: false,
    ppm: 28.00,
    relatedIds: [12, 13, 14],
  },
  {
    id: 12,
    name: 'LORATADINE 10MG',
    dci: 'Loratadine',
    laboratory: 'Sanofi Maroc',
    form: 'Comprimé',
    dosage: '10 mg',
    therapeuticClass: 'Antihistaminique H1 – Non sédatif',
    categories: ['seasonal', 'respiratory'],
    seasons: ['spring', 'summer'],
    description: 'Antihistaminique H1 non sédatif à longue durée d\'action. Ne franchit pas la barrière hémato-encéphalique.',
    indications: 'Rhinite allergique saisonnière et perannuelle, conjonctivite allergique, urticaire.',
    posology: 'Adultes et enfants ≥ 12 ans : 10 mg/jour en une prise. Enfants 2-12 ans < 30 kg : 5 mg/jour.',
    contraindications: 'Hypersensibilité à la loratadine. Prudence en cas d\'insuffisance hépatique sévère.',
    sideEffects: 'Très bien toléré. Rares : céphalées, sécheresse buccale, fatigue légère.',
    conservation: 'À l\'abri de l\'humidité et de la chaleur.',
    pregnancyCategory: 'B',
    isPrescriptionRequired: false,
    ppm: 25.00,
    relatedIds: [11, 13, 14],
  },
  {
    id: 13,
    name: 'FLUTICASONE SPRAY NASAL',
    dci: 'Propionate de fluticasone',
    laboratory: 'GSK Maroc',
    form: 'Spray nasal',
    dosage: '50 mcg/dose',
    therapeuticClass: 'Corticostéroïde topique nasal',
    categories: ['seasonal', 'respiratory'],
    seasons: ['spring'],
    description: 'Corticoïde nasal topique à action locale. Réduit l\'inflammation nasale et les symptômes de la rhinite allergique.',
    indications: 'Prévention et traitement de la rhinite allergique saisonnière et perannuelle.',
    posology: 'Adultes et enfants ≥ 12 ans : 2 pulvérisations par narine matin et soir. En prévention, débuter avant la saison pollinique.',
    contraindications: 'Hypersensibilité aux corticoïdes. Ne pas utiliser en cas d\'épistaxis fréquents. Infections nasales non traitées.',
    sideEffects: 'Irritation nasale, épistaxis (saignements de nez), céphalées, cataracte/glaucome à long terme (rares).',
    conservation: 'À l\'abri de la chaleur. Ne pas congeler.',
    pregnancyCategory: 'C',
    isPrescriptionRequired: false,
    ppm: 95.00,
    relatedIds: [11, 12, 14],
  },
  {
    id: 14,
    name: 'CROMOGLICATE COLLYRE',
    dci: 'Cromoglicate de sodium',
    laboratory: 'Bausch & Lomb',
    form: 'Collyre en solution',
    dosage: '20 mg/ml',
    therapeuticClass: 'Anti-allergique ophtalmique',
    categories: ['seasonal'],
    seasons: ['spring', 'summer'],
    description: 'Anti-allergique ophtalmique stabilisateur des mastocytes. Prévient la libération d\'histamine au niveau de la conjonctive.',
    indications: 'Conjonctivite allergique saisonnière (pollinose), conjonctivite printanière.',
    posology: '1 à 2 gouttes dans chaque œil 4 fois par jour pendant la saison allergique. Usage préventif recommandé.',
    contraindications: 'Hypersensibilité au cromoglicate. Ne pas utiliser avec lentilles de contact souples.',
    sideEffects: 'Légères picotements ou brûlures transitoires à l\'instillation.',
    conservation: 'À l\'abri de la lumière. Jeter 4 semaines après ouverture.',
    pregnancyCategory: 'B',
    isPrescriptionRequired: false,
    ppm: 55.00,
    relatedIds: [11, 12, 13],
  },
  {
    id: 15,
    name: 'VITAMINE D3 1000 UI',
    dci: 'Colécalciférol (Vitamine D3)',
    laboratory: 'Cooper Pharma',
    form: 'Capsule molle',
    dosage: '1000 UI',
    therapeuticClass: 'Vitamine liposoluble – Modulateur osseux et immunitaire',
    categories: ['vitamins', 'seasonal'],
    seasons: ['fall', 'winter', 'spring'],
    description: 'Vitamine D3 d\'origine naturelle. Essentielle pour l\'absorption calcique, la minéralisation osseuse et la régulation immunitaire.',
    indications: 'Carence en vitamine D, prévention du rachitisme et de l\'ostéoporose, soutien immunitaire saisonnier.',
    posology: 'Adultes : 1000 à 2000 UI/jour. Nourrissons : selon prescription. Prendre au cours d\'un repas gras.',
    contraindications: 'Hypercalcémie, hypercalciurie, sarcoidose, lithiase rénale calcique.',
    sideEffects: 'Surdosage : hypercalcémie (nausées, soif excessive, polyurie). Bien toléré aux doses recommandées.',
    conservation: 'À l\'abri de la lumière et < 25°C.',
    pregnancyCategory: 'A',
    isPrescriptionRequired: false,
    ppm: 32.00,
    relatedIds: [16, 11],
  },

  // ── Baby / Pédiatrie ──────────────────────────────────────────────────────
  {
    id: 16,
    name: 'PROBIOTIQUES NOURRISSON',
    dci: 'Lactobacillus rhamnosus GG',
    laboratory: 'Cooper Pharma',
    form: 'Poudre orale (sachet)',
    dosage: '10⁹ UFC / sachet',
    therapeuticClass: 'Prébiotique – Probiotique pédiatrique',
    categories: ['baby'],
    description: 'Probiotique renfermant des ferments lactiques vivants (Lactobacillus rhamnosus GG) pour l\'équilibre de la flore intestinale du nourrisson.',
    indications: 'Prévention et traitement des diarrhées du nourrisson (notamment liées aux antibiotiques), coliques, renforcement de la flore intestinale.',
    posology: 'Nourrissons et enfants : 1 sachet par jour dilué dans un biberon de lait ou de l\'eau tiède. Ne pas chauffer au-delà de 37°C.',
    contraindications: 'Immunodépression sévère. Ne pas utiliser chez les prématurés.',
    sideEffects: 'Très bien toléré. Légères flatulences en début de traitement.',
    conservation: 'Conserver au réfrigérateur entre 2 et 8°C. Ne pas congeler.',
    pregnancyCategory: 'N/A',
    isPrescriptionRequired: false,
    ppm: 85.00,
    relatedIds: [17, 2],
  },
  {
    id: 17,
    name: 'SOLUTION DE RÉHYDRATATION ORALE',
    dci: 'Chlorure de sodium + Chlorure de potassium + Glucose',
    laboratory: 'Sanofi Maroc',
    form: 'Poudre orale (sachet)',
    dosage: '1 sachet / 200 ml',
    therapeuticClass: 'Solution de réhydratation pédiatrique (OMS)',
    categories: ['baby'],
    description: 'Solution de réhydratation orale conforme à la formule de l\'OMS. Compense les pertes hydriques et électrolytiques lors des diarrhées et vomissements.',
    indications: 'Déshydratation légère à modérée chez l\'enfant (gastro-entérite, diarrhée aiguë, vomissements). Prévention de la déshydratation.',
    posology: 'Diluer 1 sachet dans 200 ml d\'eau bouillie refroidie. Donner en petites quantités fréquentes. 50-100 ml/kg sur 3-4 h.',
    contraindications: 'Déshydratation sévère (hospitalisation requise), vomissements incoercibles, iléus paralytique.',
    sideEffects: 'Rares : vomissements si administrée trop vite.',
    conservation: 'Sachet sec : < 25°C. Solution préparée : à utiliser dans les 24 heures au réfrigérateur.',
    pregnancyCategory: 'N/A',
    isPrescriptionRequired: false,
    ppm: 12.00,
    relatedIds: [16, 2],
  },
  {
    id: 18,
    name: 'MULTIVITAMINES NOURRISSON GOUTTES',
    dci: 'Vitamines A + C + D3',
    laboratory: 'Cooper Pharma',
    form: 'Solution buvable – Gouttes',
    dosage: 'Vitamines A 1333 UI + C 20 mg + D3 200 UI / ml',
    therapeuticClass: 'Complément vitamique pédiatrique',
    categories: ['baby', 'vitamins'],
    description: 'Association vitamique adaptée aux nourrissons. Soutient la croissance, le développement osseux et immunitaire dès les premiers jours de vie.',
    indications: 'Prévention des carences vitaminiques chez le nourrisson allaité ou nourri au lait artificiel.',
    posology: 'Nourrissons : 1 ml/jour. Peut être mélangé au lait ou aux aliments. Utiliser la pipette graduée.',
    contraindications: 'Hypervitaminose A ou D connue. Surdosage à éviter impérativement.',
    sideEffects: 'Bien toléré aux doses recommandées. Surdosage : signes d\'hypervitaminose (anorexie, vomissements).',
    conservation: 'À l\'abri de la lumière. Après ouverture, utiliser dans les 6 mois.',
    pregnancyCategory: 'N/A',
    isPrescriptionRequired: false,
    ppm: 65.00,
    relatedIds: [16, 17, 15],
  },

  // ── Mom / Maternité ───────────────────────────────────────────────────────
  {
    id: 19,
    name: 'ACIDE FOLIQUE 5MG',
    dci: 'Acide folique (Vitamine B9)',
    laboratory: 'Cooper Pharma',
    form: 'Comprimé',
    dosage: '5 mg',
    therapeuticClass: 'Vitamine B9 – Supplément périconceptionnel',
    categories: ['mom', 'vitamins'],
    description: 'Vitamine B9 indispensable à la synthèse des acides nucléiques. Essentielle en période périconceptionnelle pour prévenir les anomalies du tube neural.',
    indications: 'Prévention des anomalies du tube neural (anencéphalie, spina bifida), carence en folates, femmes en âge de procréer.',
    posology: 'Préconceptionnel et 1er trimestre grossesse : 5 mg/jour. Peut débuter 4 semaines avant conception.',
    contraindications: 'Tumeurs malignes (favorise croissance tumorale). Anémie mégaloblastique par carence en B12 non diagnostiquée.',
    sideEffects: 'Très bien toléré. Rares : réactions allergiques cutanées.',
    conservation: 'À l\'abri de la lumière et de l\'humidité.',
    pregnancyCategory: 'A',
    isPrescriptionRequired: false,
    ppm: 8.00,
    relatedIds: [20, 21],
  },
  {
    id: 20,
    name: 'FER + ACIDE FOLIQUE',
    dci: 'Sulfate ferreux + Acide folique',
    laboratory: 'Maphar',
    form: 'Comprimé enrobé',
    dosage: 'Fe²⁺ 80 mg + Acide folique 400 µg',
    therapeuticClass: 'Antianémique – Complément martial',
    categories: ['mom', 'vitamins'],
    description: 'Association de fer et d\'acide folique pour la prévention et le traitement de l\'anémie ferriprive gestationnelle.',
    indications: 'Prévention et traitement de l\'anémie ferriprive pendant la grossesse et l\'allaitement.',
    posology: '1 à 2 comprimés par jour selon bilan martial. Prendre à distance des repas avec un verre de jus d\'orange (facilite absorption).',
    contraindications: 'Surcharge en fer (hémochromatose, hémosidérose), anémie hémolytique, opolycythémie.',
    sideEffects: 'Selles noires (inoffensif), constipation, nausées. Réduire la dose en cas d\'intolérance digestive.',
    conservation: 'À l\'abri de l\'humidité et de la lumière.',
    pregnancyCategory: 'A',
    isPrescriptionRequired: false,
    ppm: 18.00,
    relatedIds: [19, 21],
  },
  {
    id: 21,
    name: 'VITAMINES PRÉNATALES COMPLÈTES',
    dci: 'Multivitamines + Minéraux',
    laboratory: 'Cooper Pharma',
    form: 'Comprimé pelliculé',
    dosage: 'Complexe vitamines + minéraux (formule grossesse)',
    therapeuticClass: 'Complément multivitaminé prénatal',
    categories: ['mom', 'vitamins'],
    description: 'Formule prénatale complète associant vitamines (B9, D3, B12, C, E) et minéraux (fer, calcium, magnésium, zinc, iode) adaptée aux besoins de la grossesse.',
    indications: 'Couverture des besoins nutritionnels augmentés pendant la grossesse et l\'allaitement. Prévention globale des carences.',
    posology: '1 comprimé par jour au cours d\'un repas. Continuer pendant toute la grossesse et l\'allaitement.',
    contraindications: 'Hypervitaminose A, hypercalcémie. Éviter la prise simultanée d\'autres suppléments vitamiques sans avis médical.',
    sideEffects: 'Nausées légères (prendre de préférence le soir). Coloration jaune des urines (riboflavine, inoffensif). Selles légèrement foncées.',
    conservation: 'À l\'abri de la lumière, < 25°C.',
    pregnancyCategory: 'A',
    isPrescriptionRequired: false,
    ppm: 95.00,
    relatedIds: [19, 20],
  },

  // ── Dermatology ───────────────────────────────────────────────────────────
  {
    id: 22,
    name: 'KÉTOCONAZOLE CRÈME 2%',
    dci: 'Kétoconazole',
    laboratory: 'Janssen Cilag',
    form: 'Crème',
    dosage: '2%',
    therapeuticClass: 'Antifongique topique – Imidazolé',
    categories: ['dermatology'],
    description: 'Antifongique à large spectre d\'action topique. Actif sur dermatophytes, levures (Candida, Malassezia) et sur certaines bactéries (Gram +).',
    indications: 'Dermatophyties (teigne, épidermophytie des pieds/aines), candidoses cutanées, pytiriasis versicolor.',
    posology: 'Appliquer une fine couche sur zone atteinte 1 à 2 fois/jour. Durée : 2 à 4 semaines selon localisation. Poursuivre 1 semaine après guérison clinique.',
    contraindications: 'Hypersensibilité au kétoconazole ou aux imidazolés. Éviter le contact avec les muqueuses oculaires.',
    sideEffects: 'Légère irritation locale, sensation de brûlure transitoire. Rares : dermite de contact allergique.',
    conservation: 'À l\'abri de la chaleur. Ne pas congeler.',
    pregnancyCategory: 'C',
    isPrescriptionRequired: false,
    ppm: 42.00,
    relatedIds: [23],
  },
  {
    id: 23,
    name: 'BÉTADINE SOLUTION DERMIQUE 10%',
    dci: 'Povidone iodée',
    laboratory: 'Mundi Pharma',
    form: 'Solution dermique',
    dosage: '10% (100 mg/ml)',
    therapeuticClass: 'Antiseptique local – Iodé',
    categories: ['dermatology'],
    description: 'Antiseptique iodé à large spectre. Bactéricide, fongicide, virucide et sporicide. De référence pour l\'antisepsie cutanée.',
    indications: 'Antisepsie cutanée avant injection/ponction/chirurgie, traitement des petites plaies et éraflures, brûlures superficielles.',
    posology: 'Appliquer sur la zone à traiter à l\'aide d\'une compresse. Laisser sécher. Ne pas occlure sous pansement hermétique.',
    contraindications: 'Allergie à l\'iode, hyperthyroïdie, grossesse à partir du 2e trimestre, allaitement, nouveau-nés prématurés.',
    sideEffects: 'Irritation cutanée locale, réactions allergiques rares. Coloration brun-jaune temporaire de la peau.',
    conservation: 'À l\'abri de la lumière. Ne pas utiliser solution décolorée.',
    pregnancyCategory: 'D',
    isPrescriptionRequired: false,
    ppm: 28.00,
    relatedIds: [22],
  },

  // ── Digestive ─────────────────────────────────────────────────────────────
  {
    id: 24,
    name: 'OMÉPRAZOLE 20MG',
    dci: 'Oméprazole',
    laboratory: 'Cooper Pharma',
    form: 'Gélule gastro-résistante',
    dosage: '20 mg',
    therapeuticClass: 'Inhibiteur de la pompe à protons (IPP)',
    categories: ['digestive'],
    description: 'IPP réduisant la sécrétion acide gastrique de 80-95 %. Traitement de référence des ulcères et du reflux gastro-œsophagien (RGO).',
    indications: 'RGO (pyrosis, régurgitations), ulcère gastro-duodénal, éradication H. pylori (en association), prévention de l\'ulcère sous AINS.',
    posology: 'RGO léger : 20 mg/jour 4 semaines. Ulcère : 20-40 mg/jour 4-8 semaines. Prendre avant le repas du matin.',
    contraindications: 'Hypersensibilité aux IPP. Association contre-indiquée avec certains antiviraux (atazanavir, rilpivirine).',
    sideEffects: 'Céphalées, diarrhées, nausées légères. Long terme : carence en magnésium et B12, ostéoporose.',
    conservation: 'À l\'abri de l\'humidité. Ne pas écraser les granules.',
    pregnancyCategory: 'C',
    isPrescriptionRequired: false,
    ppm: 30.00,
    relatedIds: [3, 4],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Get the current season based on the month */
export function getCurrentSeason(): ProductSeason {
  const month = new Date().getMonth() + 1; // 1–12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

/** Get seasonal recommendations for the current season */
export function getSeasonalProducts(): Product[] {
  const season = getCurrentSeason();
  return PRODUCTS.filter((p) => p.seasons?.includes(season));
}

/** Get baby products */
export function getBabyProducts(): Product[] {
  return PRODUCTS.filter((p) => p.categories.includes('baby'));
}

/** Get mom/maternity products */
export function getMomProducts(): Product[] {
  return PRODUCTS.filter((p) => p.categories.includes('mom'));
}

/** Get related products for a given product */
export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const ids = product.relatedIds ?? [];
  return PRODUCTS.filter((p) => ids.includes(p.id)).slice(0, limit);
}

/** Search products by name, DCI, or laboratory */
export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return PRODUCTS;
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.dci.toLowerCase().includes(q) ||
      p.laboratory.toLowerCase().includes(q) ||
      p.therapeuticClass.toLowerCase().includes(q)
  );
}

/** Get all unique categories */
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  analgesic: 'Analgésiques',
  antibiotic: 'Antibiotiques',
  cardiovascular: 'Cardiovasculaire',
  seasonal: 'Saisonnier',
  baby: 'Pédiatrie',
  mom: 'Maternité',
  digestive: 'Digestif',
  dermatology: 'Dermatologie',
  respiratory: 'Respiratoire',
  vitamins: 'Vitamines',
};

export const SEASON_LABELS: Record<ProductSeason, string> = {
  spring: 'Printemps',
  summer: 'Été',
  fall: 'Automne',
  winter: 'Hiver',
};

export const SEASON_EMOJI: Record<ProductSeason, string> = {
  spring: '🌸',
  summer: '☀️',
  fall: '🍂',
  winter: '❄️',
};
