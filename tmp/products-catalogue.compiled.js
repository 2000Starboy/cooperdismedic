// ============================================================================
// products-catalogue.ts — Mock pharmaceutical product catalogue
// Cooper Dismedic · No stock data (informational only)
// ============================================================================
export const PRODUCTS = [
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
    // ── Additional Products (Imported from Database) ────────────────────────
    {
        id: 25,
        name: 'PARACÉTAMOL 1000MG',
        dci: 'Paracétamol',
        laboratory: 'Cooper Pharma',
        form: 'Comprimé',
        dosage: '1000 mg',
        therapeuticClass: 'Analgésique – Antipyrétique',
        categories: ['analgesic'],
        description: 'Antalgique et antipyrétique d\'action centrale, utilisé pour la fièvre et les douleurs légères à modérées.',
        indications: 'Douleurs légères à modérées, céphalées, fièvre.',
        posology: '1 comprimé toutes les 4 à 6 heures, selon besoin.',
        contraindications: 'Hypersensibilité au paracétamol, insuffisance hépatique sévère.',
        sideEffects: 'Rares réactions cutanées, troubles digestifs.',
        conservation: 'Conserver à température ambiante, à l\'abri de l\'humidité.',
        pregnancyCategory: 'B',
        isPrescriptionRequired: false,
        ppm: 12.5,
        relatedIds: [26, 27],
    },
    {
        id: 26,
        name: 'IBUPROFÈNE 400MG',
        dci: 'Ibuprofène',
        laboratory: 'Sanofi Maroc',
        form: 'Comprimé',
        dosage: '400 mg',
        therapeuticClass: 'Anti-inflammatoire non stéroïdien (AINS)',
        categories: ['analgesic'],
        description: 'AINS utilisé pour traiter les douleurs et l\'inflammation avec une action rapide.',
        indications: 'Douleurs rhumatismales, céphalées, douleurs dentaires, fièvre.',
        posology: '1 comprimé 3 fois par jour au cours des repas.',
        contraindications: 'Ulcère évolutif, insuffisance rénale grave.',
        sideEffects: 'Nausées, douleurs abdominales, vertiges.',
        conservation: 'Conserver au frais et à l\'abri de l\'humidité.',
        pregnancyCategory: 'C',
        isPrescriptionRequired: false,
        ppm: 22,
        relatedIds: [25, 27],
    },
    {
        id: 27,
        name: 'AMOXICILLINE 500MG',
        dci: 'Amoxicilline',
        laboratory: 'Cooper Pharma',
        form: 'Capsule',
        dosage: '500 mg',
        therapeuticClass: 'Antibiotique β-lactamine',
        categories: ['antibiotic'],
        description: 'Antibiotique à large spectre utilisé pour traiter diverses infections bactériennes.',
        indications: 'Infections ORL, respiratoires, urinaires et cutanées.',
        posology: '1 capsule toutes les 8 heures, selon prescription.',
        contraindications: 'Hypersensibilité aux pénicillines, allergie connue.',
        sideEffects: 'Nausées, diarrhée, rash cutané.',
        conservation: 'Conserver à température ambiante, au sec.',
        pregnancyCategory: 'B',
        isPrescriptionRequired: true,
        ppm: 18.5,
        relatedIds: [25, 28],
    },
    {
        id: 28,
        name: 'OMÉPRAZOLE 20MG',
        dci: 'Oméprazole',
        laboratory: 'Cooper Pharma',
        form: 'Gélule',
        dosage: '20 mg',
        therapeuticClass: 'Inhibiteur de la pompe à protons',
        categories: ['digestive'],
        description: 'Traitement de référence du reflux gastro-œsophagien et des ulcères gastriques.',
        indications: 'RGO, ulcère gastro-duodénal, prévention d\'ulcère sous AINS.',
        posology: '1 gélule par jour avant le petit-déjeuner.',
        contraindications: 'Hypersensibilité aux IPP, interaction avec certains antiviraux.',
        sideEffects: 'Céphalées, nausées, diarrhée légère.',
        conservation: 'À l\'abri de l\'humidité et de la chaleur.',
        pregnancyCategory: 'C',
        isPrescriptionRequired: false,
        ppm: 30,
        relatedIds: [25, 27],
    },
];
// ── Helpers ───────────────────────────────────────────────────────────────────
export function getCurrentSeason() {
    const month = new Date().getMonth() + 1; // 1–12
    if (month >= 3 && month <= 5)
        return 'spring';
    if (month >= 6 && month <= 8)
        return 'summer';
    if (month >= 9 && month <= 11)
        return 'fall';
    return 'winter';
}
/** Get seasonal recommendations for the current season */
export function getSeasonalProducts() {
    const season = getCurrentSeason();
    return PRODUCTS.filter((p) => p.seasons?.includes(season));
}
/** Get baby products */
export function getBabyProducts() {
    return PRODUCTS.filter((p) => p.categories.includes('baby'));
}
/** Get mom/maternity products */
export function getMomProducts() {
    return PRODUCTS.filter((p) => p.categories.includes('mom'));
}
function normalizeDosageValue(dosage) {
    if (!dosage)
        return undefined;
    const m = String(dosage)
        .toLowerCase()
        .replace(',', '.')
        .match(/([\d.]+)\s*(%|mg|g|ml|mcg|ug|l)?/i);
    if (!m)
        return undefined;
    const value = Number(m[1]);
    const unit = (m[2] || '').toLowerCase();
    return { value, unit };
}
function normalizeString(str) {
    return str.toLowerCase().trim();
}
function computeSimilarityScore(product, candidate) {
    if (product.id === candidate.id)
        return -1;
    // Helper tokenization
    function tokenize(value) {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
    }
    function normalizeDci(value) {
        if (!value)
            return '';
        // remove dosage numbers and units, parentheses, punctuation
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\b(\d+[\.,]?\d*\s*(mg|g|ml|mcg|ug|%)?)\b/gi, ' ')
            .replace(/[^a-z\s]/g, ' ')
            .split(/\s+/)
            .filter(Boolean)
            .join(' ')
            .trim();
    }
    // Levenshtein for fuzzy name scoring
    function levenshtein(a, b) {
        const A = a.split('');
        const B = b.split('');
        const m = A.length;
        const n = B.length;
        const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++)
            dp[i][0] = i;
        for (let j = 0; j <= n; j++)
            dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const cost = A[i - 1] === B[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
            }
        }
        return dp[m][n];
    }
    function fuzzyNameScore(a, b) {
        const sa = String(a || '').toLowerCase().trim();
        const sb = String(b || '').toLowerCase().trim();
        if (!sa || !sb)
            return 0;
        const dist = levenshtein(sa, sb);
        const maxLen = Math.max(sa.length, sb.length);
        if (maxLen === 0)
            return 0;
        const ratio = 1 - dist / maxLen;
        if (ratio <= 0)
            return 0;
        return Math.round(Math.min(10, Math.max(0, ratio * 10)));
    }
    const prodDci = normalizeDci(product.dci || product.name || '');
    const candDci = normalizeDci(candidate.dci || candidate.name || '');
    const prodTher = normalizeString(product.therapeuticClass || '');
    const candTher = normalizeString(candidate.therapeuticClass || '');
    const prodLab = normalizeString(product.laboratory || '');
    const candLab = normalizeString(candidate.laboratory || '');
    const prodForm = normalizeString(product.form || '');
    const candForm = normalizeString(candidate.form || '');
    function dciTokens(value) {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/(\d+[\.,]?\d*\s*(mg|g|ml|mcg|ug|%)?)/gi, ' ')
            .replace(/[|\/,&]/g, ' ')
            .replace(/[^a-z\s]/g, ' ')
            .split(/\s+/)
            .filter((token) => token && token.length > 1);
    }
    function dciOverlapScore(a, b) {
        if (!a || !b)
            return 0;
        if (a === b)
            return 50;
        const aTokens = new Set(dciTokens(a));
        const bTokens = new Set(dciTokens(b));
        const shared = [...aTokens].filter((token) => bTokens.has(token));
        if (shared.length === 0)
            return 0;
        if (a.includes(b) || b.includes(a))
            return 40;
        if (shared.length >= 3)
            return 35;
        if (shared.length === 2)
            return 25;
        return 15;
    }
    function isImportedAuto(p) {
        return String(p.therapeuticClass || '').toLowerCase().includes('produit import');
    }
    let score = 0;
    // DCI exact or partial match
    score += dciOverlapScore(prodDci, candDci);
    if ((isImportedAuto(product) || isImportedAuto(candidate)) && score > 0)
        score += 10;
    // Therapeutic class
    if (prodTher && candTher && (prodTher === candTher || prodTher.includes(candTher) || candTher.includes(prodTher)))
        score += 30;
    // Laboratory
    if (prodLab && candLab && prodLab === candLab)
        score += 10;
    // Form
    if (prodForm && candForm && prodForm === candForm)
        score += 5;
    // Dosage (unit-aware)
    const pd = normalizeDosageValue(product.dosage);
    const cd = normalizeDosageValue(candidate.dosage);
    if (pd && cd && pd.unit && cd.unit && pd.unit === cd.unit && pd.value === cd.value)
        score += 5;
    // Fuzzy name up to 10
    score += fuzzyNameScore(product.name || '', candidate.name || '');
    // Tags / categories overlap — ignore numeric and unit tokens
    function isUnitOrNumber(t) {
        return /^\d+$/.test(t) || /^(%|mg|g|ml|mcg|ug|l)$/.test(t);
    }
    const prodTags = new Set([
        ...(product.categories || []).map((c) => normalizeString(c)),
        ...tokenize(product.name || '').filter((t) => !isUnitOrNumber(t)),
        ...tokenize(product.dci || '').filter((t) => !isUnitOrNumber(t)),
        ...tokenize(product.therapeuticClass || '').filter((t) => !isUnitOrNumber(t)),
    ]);
    const candTags = new Set([
        ...(candidate.categories || []).map((c) => normalizeString(c)),
        ...tokenize(candidate.name || '').filter((t) => !isUnitOrNumber(t)),
        ...tokenize(candidate.dci || '').filter((t) => !isUnitOrNumber(t)),
        ...tokenize(candidate.therapeuticClass || '').filter((t) => !isUnitOrNumber(t)),
    ]);
    let common = 0;
    for (const t of candTags)
        if (prodTags.has(t))
            common++;
    score += Math.min(10, common * 2);
    // Fallback keyword overlap when DCI or therapeutic class missing
    if (!prodDci || !candDci || !prodTher || !candTher) {
        const prodKeywords = new Set([...tokenize(product.name || ''), ...tokenize(product.indications || ''), ...tokenize(product.therapeuticClass || '')]);
        const candKeywords = new Set([...tokenize(candidate.name || ''), ...tokenize(candidate.indications || ''), ...tokenize(candidate.therapeuticClass || '')]);
        let shared = 0;
        for (const k of candKeywords)
            if (prodKeywords.has(k))
                shared++;
        if (shared >= 3)
            score += 40;
        else if (shared === 2)
            score += 20;
        else if (shared === 1)
            score += 10;
    }
    // small boost if already linked
    if (product.relatedIds?.includes(candidate.id) || candidate.relatedIds?.includes(product.id))
        score += 5;
    if (score < 0)
        score = 0;
    return score;
}
/** Get related products for a given product using the provided product catalogue. */
export function getRelatedProducts(product, limit = 4, products = PRODUCTS) {
    const pool = products.filter(Boolean);
    // Helper to detect placeholder imports (article-like entries)
    function isPlaceholder(p) {
        const tc = String(p.therapeuticClass || '').toLowerCase();
        const dci = normalizeString(p.dci || '');
        const hasRealDci = dci && dci !== 'à préciser' && dci !== 'a preciser';
        if (tc.includes('produit import')) {
            return !hasRealDci;
        }
        return (dci === 'à préciser' ||
            dci === 'a preciser');
    }
    // Filter out low-quality placeholder products from candidate pool
    const candidates = pool.filter((c) => !isPlaceholder(c));
    // If the current product is a placeholder (likely an article), attempt a molecule/class-based lookup
    const currentIsPlaceholder = isPlaceholder(product);
    if (currentIsPlaceholder) {
        const normalizeArticleText = (value) => String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        const articleText = [product.name, product.description, product.indications, product.posology]
            .filter(Boolean)
            .map(normalizeArticleText)
            .join(' ');
        const articlePatterns = [
            {
                pattern: /\bsild[eé]nafil\b/i,
                dciKeywords: ['sildenafil'],
                therapeuticClassKeywords: ['pde5', 'phosphodiesterase'],
            },
            {
                pattern: /\btadalafil\b/i,
                dciKeywords: ['tadalafil'],
                therapeuticClassKeywords: ['pde5', 'phosphodiesterase'],
            },
            {
                pattern: /\bvardenafil\b/i,
                dciKeywords: ['vardenafil'],
                therapeuticClassKeywords: ['pde5', 'phosphodiesterase'],
            },
            {
                pattern: /\bavanafil\b/i,
                dciKeywords: ['avanafil'],
                therapeuticClassKeywords: ['pde5', 'phosphodiesterase'],
            },
            {
                pattern: /\bpde5\b|\bphosphodiesterase\b/i,
                dciKeywords: [],
                therapeuticClassKeywords: ['pde5', 'phosphodiesterase', 'inhibiteur de la pde5'],
            },
        ];
        const matchedPatterns = articlePatterns.filter((entry) => entry.pattern.test(articleText));
        const directMoleculeKeywords = matchedPatterns.flatMap((entry) => entry.dciKeywords);
        const directCandidates = candidates.filter((c) => {
            const hay = [c.dci, c.name].map(normalizeArticleText).join(' ');
            return directMoleculeKeywords.some((keyword) => hay.includes(keyword));
        });
        if (directCandidates.length > 0) {
            return directCandidates.slice(0, limit);
        }
        const classKeywords = matchedPatterns.flatMap((entry) => entry.therapeuticClassKeywords);
        if (classKeywords.length > 0) {
            const classMatches = candidates.filter((c) => {
                const tc = normalizeArticleText(String(c.therapeuticClass || ''));
                const hay = [c.dci, c.name, c.therapeuticClass].map(normalizeArticleText).join(' ');
                return classKeywords.some((keyword) => tc.includes(keyword) || hay.includes(keyword));
            });
            if (classMatches.length > 0) {
                return classMatches.slice(0, limit);
            }
        }
        // fallback: simple token overlap (but ignore short stopwords)
        const stopwords = new Set(['et', 'la', 'le', 'les', 'de', 'des', 'a', 'à', 'pour', 'sur', 'du', 'une', 'un', 'l', 'rsquo']);
        const tokens = articleText
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]+/g, ' ')
            .split(/\s+/)
            .filter((t) => t && !stopwords.has(t))
            .slice(0, 12);
        const scored = candidates
            .map((c) => {
            const hay = [c.therapeuticClass, c.dci, c.name].join(' ').toLowerCase();
            const matchCount = tokens.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0);
            const dciExact = tokens.some((t) => normalizeString(c.dci || '').includes(t)) ? 4 : 0;
            return { candidate: c, score: matchCount + dciExact };
        })
            .filter((s) => s.score > 0)
            .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name))
            .map((s) => s.candidate)
            .slice(0, limit);
        return scored;
    }
    // Otherwise use the standard similarity scoring on filtered candidates
    // Pre-filter candidates by strong signals to avoid noisy unrelated matches.
    function tokenizeLocal(value) {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
    }
    function normalizeDciLocal(value) {
        if (!value)
            return '';
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\b(\d+[\.,]?\d*\s*(mg|g|ml|mcg|ug|%)?)\b/gi, ' ')
            .replace(/[^a-z\s]/g, ' ')
            .split(/\s+/)
            .filter(Boolean)
            .join(' ')
            .trim();
    }
    const prodDciNorm = normalizeDciLocal(product.dci || product.name || '');
    const prodTherNorm = normalizeString(product.therapeuticClass || '');
    const strongCandidates = candidates.filter((c) => {
        const cDci = normalizeDciLocal(c.dci || c.name || '');
        const cTher = normalizeString(c.therapeuticClass || '');
        if (cDci && prodDciNorm && cDci === prodDciNorm)
            return true;
        if (cTher && prodTherNorm && cTher === prodTherNorm)
            return true;
        const ptoks = tokenizeLocal(product.name || product.dci || '').filter((t) => t.length > 2).slice(0, 12);
        const ctoks = tokenizeLocal(c.name || c.dci || '').filter((t) => t.length > 2).slice(0, 12);
        const common = ptoks.filter((t) => ctoks.includes(t)).length;
        if (common >= 2)
            return true;
        return false;
    });
    const poolToScore = strongCandidates.length > 0 ? strongCandidates : candidates;
    const scored = poolToScore
        .map((candidate) => ({ candidate, score: computeSimilarityScore(product, candidate) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name));
    // Require a minimum confidence threshold to avoid showing unrelated products when the catalogue lacks true matches.
    const MIN_SCORE = 30;
    const highConfidence = scored.filter((s) => s.score >= MIN_SCORE);
    const finalList = (highConfidence.length > 0 ? highConfidence : scored).map((s) => s.candidate).slice(0, limit);
    return finalList;
}
/** Search products by name, DCI, or laboratory */
export function searchProducts(query) {
    const q = query.toLowerCase().trim();
    if (!q)
        return PRODUCTS;
    return PRODUCTS.filter((p) => p.name.toLowerCase().includes(q) ||
        p.dci.toLowerCase().includes(q) ||
        p.laboratory.toLowerCase().includes(q) ||
        p.therapeuticClass.toLowerCase().includes(q));
}
/** Get all unique categories */
export const CATEGORY_LABELS = {
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
export const SEASON_LABELS = {
    spring: 'Printemps',
    summer: 'Été',
    fall: 'Automne',
    winter: 'Hiver',
};
export const SEASON_EMOJI = {
    spring: '🌸',
    summer: '☀️',
    fall: '🍂',
    winter: '❄️',
};
