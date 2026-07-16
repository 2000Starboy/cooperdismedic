import { PRODUCTS as fallbackProducts, type Product } from '@/data/products-catalogue';

export async function loadProductsFromApi(): Promise<Product[]> {
  const endpoints = ['/api/products', '/api/products.json'];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) continue;
      const data = await response.json();
      if (Array.isArray(data)) return data as Product[];
    } catch {
      // Keep trying the next endpoint.
    }
  }

  return fallbackProducts;
}

export async function loadCatalogProducts(): Promise<Product[]> {
  const products = await loadProductsFromApi();
  const activeProducts = products.filter(p => p.active !== false);
  const apiIds = new Set(activeProducts.map((p) => p.id));

  const normalizeStr = (str: string) =>
    (str || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const seenKeys = new Set(
    activeProducts.map((product) => `${normalizeStr(product.name)}::${normalizeStr(product.dci)}`)
  );

  const merged = [
    ...activeProducts,
    ...fallbackProducts.filter(
      (product) =>
        product.active !== false &&
        !apiIds.has(product.id) &&
        !seenKeys.has(`${normalizeStr(product.name)}::${normalizeStr(product.dci)}`)
    ),
  ];
  return merged;
}


export const categoryTranslations: Record<string, string> = {
  allergy: 'Allergologie',
  anaesthesia: 'Anesthésie',
  analgesia: 'Analgésie',
  analgesic: 'Analgésiques',
  anesthesia: 'Anesthésie',
  anesthesiology: 'Anesthésiologie',
  angiology: 'Angiologie',
  antibiotic: 'Antibiotiques',
  baby: 'Bébé',
  cardiology: 'Cardiologie',
  cardiovascular: 'Cardiovasculaire',
  dentistry: 'Dentisterie',
  dermatology: 'Dermatologie',
  digestive: 'Digestif',
  emergency: 'Urgences',
  emergency_medicine: 'Médecine d\'urgence',
  endocrinology: 'Endocrinologie',
  gastroenterology: 'Gastroentérologie',
  'general-medicine': 'Médecine générale',
  general_medicine: 'Médecine générale',
  genetics: 'Génétique',
  geriatrics: 'Gériatrie',
  gynaecology: 'Gynécologie',
  gynecology: 'Gynécologie',
  hematology: 'Hématologie',
  hepatology: 'Hépatologie',
  hiv: 'VIH / Sida',
  hygiene: 'Hygiène',
  immunology: 'Immunologie',
  infectiology: 'Infectiologie',
  intensive_care: 'Réanimation',
  metabolism: 'Métabolisme',
  mom: 'Maternité',
  neonatology: 'Néonatologie',
  nephrology: 'Néphrologie',
  neurology: 'Neurologie',
  nuclear_medicine: 'Médecine nucléaire',
  obstetrics: 'Obstétrique',
  oncology: 'Oncologie',
  ophthalmology: 'Ophtalmologie',
  orl: 'O.R.L.',
  orthopedics: 'Orthopédie',
  otolaryngology: 'Otolaryngologie',
  otorhinolaryngology: 'Otorhinolaryngologie',
  pain_management: 'Gestion de la douleur',
  'palliative-care': 'Soins palliatifs',
  palliative_care: 'Soins palliatifs',
  pediatrics: 'Pédiatrie',
  pneumology: 'Pneumologie',
  proctology: 'Proctologie',
  psychiatry: 'Psychiatrie',
  pulmonology: 'Pneumologie',
  radiology: 'Radiologie',
  respiratory: 'Respiratoire',
  rheumatology: 'Rhumatologie',
  seasonal: 'Saisonniers',
  sports_medicine: 'Médecine du sport',
  stomatology: 'Stomatologie',
  surgery: 'Chirurgie',
  toxicology: 'Toxicologie',
  transplantation: 'Transplantation',
  traumatology: 'Traumatologie',
  urology: 'Urologie',
  vaccine: 'Vaccins',
  veterinary: 'Vétérinaire',
  vitamins: 'Vitamines',
};

export const categoryStyleMapping: Record<string, string> = {
  cardiology: 'Cardiologie',
  cardiovascular: 'Cardiologie',
  neurology: 'Neurologie',
  psychiatry: 'Neurologie',
  gastroenterology: 'Gastroentérologie',
  digestive: 'Gastroentérologie',
  hepatology: 'Gastroentérologie',
  proctology: 'Gastroentérologie',
  infectiology: 'Infectiologie',
  antibiotic: 'Infectiologie',
  hiv: 'Infectiologie',
  vaccine: 'Infectiologie',
  immunology: 'Infectiologie',
  dermatology: 'Dermatologie',
  hygiene: 'Dermatologie',
  ophthalmology: 'Ophtalmologie',
  rheumatology: 'Rhumatologie',
  orthopedics: 'Rhumatologie',
  traumatology: 'Rhumatologie',
  sports_medicine: 'Rhumatologie',
  pneumology: 'Pneumologie',
  pulmonology: 'Pneumologie',
  respiratory: 'Pneumologie',
};

export function getCategoryTranslation(cat: string, t: (key: string, fallback?: string) => string): string {
  if (cat === 'all') return 'Tous';
  const fileTranslation = t(`products.${cat}`);
  if (fileTranslation && fileTranslation !== `products.${cat}`) {
    return fileTranslation;
  }
  return categoryTranslations[cat] || cat.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
