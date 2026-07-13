/**
 * Enhanced extraction for cure.ma products
 * 
 * Improvements:
 * - Extract dosage from product name if not found in dedicated field
 * - Better DCI extraction with fallback patterns
 * - Improved normalization
 */

export function extractDosageFromProductName(name) {
  if (!name) return '';
  
  // Patterns: "PRODUCT 500 MG", "PRODUCT 200mg", "PRODUCT 10 ML", etc.
  const match = String(name).match(
    /(\d+(?:[.,]\d+)?)\s*(%|mg|g|ml|mcg|ug|µg|l|ui|unité)/i
  );
  
  if (match) {
    const value = match[1].replace(',', '.');
    const unit = (match[2] || 'mg').toLowerCase();
    return `${value} ${unit}`;
  }
  
  return '';
}

/**
 * Enhanced extraction that better handles cure.ma structure
 * Returns extracted product data
 */
export function extractProductDataFromHtmlEnhanced(html, sourceUrl = '') {
  const plainText = stripHtmlEnhanced(html);
  const jsonLd = readJsonLdCandidate(html);
  
  // Extract name
  const title = normalizeText(
    html.match(/<title>([^<]+)<\/title>/i)?.[1] || ''
  );
  const ogTitle = normalizeText(
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] || ''
  );
  const h1 = normalizeText(
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1] || ''
  );
  
  const name = normalizeText(
    jsonLd?.name || ogTitle || h1 || title || 
    sourceUrl.split('/').filter(Boolean).pop() || 
    'Produit importé'
  );

  // Extract DCI with better patterns
  let dci = normalizeText(
    extractByLabel(plainText, [
      'DCI', 'Principe actif', 'Substance active', 
      'Dénomination', 'Dénomination commune'
    ]) ||
    jsonLd?.activeIngredient ||
    jsonLd?.drugClass ||
    jsonLd?.additionalProperty?.find((entry) => 
      /dci|active|principe|substance|dénomination/i.test(entry.name || '')
    )?.value ||
    ''
  );

  // Fallback: extract from name if DCI not found
  if (!dci || dci === 'À préciser' || dci === 'a preciser') {
    // Extract main part of name (before comma or number)
    const namePart = name.match(/^([A-Za-zÀ-ÿ\s]+)/)?.[1];
    if (namePart) {
      dci = normalizeText(namePart);
    }
  }

  // Extract laboratory
  const laboratory = normalizeText(
    extractByLabel(plainText, [
      'Laboratoire', 'Laboratory', 'Fabricant', 
      'Manufacturer', 'Marque', 'Laboratoires'
    ]) ||
    jsonLd?.brand?.name ||
    jsonLd?.manufacturer?.name ||
    ''
  );

  // Extract form
  const form = normalizeText(
    extractByLabel(plainText, [
      'Forme', 'Formulation', 'Présentation', 
      'Présentation galénique', 'Galénique', 'Galenique'
    ]) ||
    jsonLd?.dosageForm ||
    ''
  );

  // Extract dosage - with enhanced fallback to name
  let dosage = normalizeText(
    extractByLabel(plainText, [
      'Dosage', 'Dose', 'Concentration', 
      'Dosage recommandé', 'Dose recommandée'
    ]) ||
    jsonLd?.dosage ||
    ''
  );

  // If dosage still not found or is generic form description,
  // try to extract from product name
  if (
    !dosage || 
    dosage === 'À préciser' || 
    dosage === 'a preciser' ||
    /^(comprimé|capsule|solution|sirop|injection|spray|gel|crème|ampoule|pommade|suppositoire|patch|collyre)/i.test(dosage)
  ) {
    const fromName = extractDosageFromProductName(name);
    if (fromName) {
      dosage = fromName;
    }
  }

  return {
    name,
    dci,
    laboratory,
    form,
    dosage,
    sourceUrl,
    description: normalizeText(
      jsonLd?.description || 
      `${name} importé automatiquement depuis ${sourceUrl || 'une source externe'}.`
    ),
  };
}

// Helper functions from original

function normalizeText(value) {
  return String(value ?? '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .replace(/\s*([,;:.])\s*/g, '$1 ')
    .trim();
}

function stripHtmlEnhanced(value) {
  return normalizeText(
    String(value ?? '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
  );
}

function findProductNodes(value) {
  if (Array.isArray(value)) {
    return value.flatMap(findProductNodes);
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const type = value['@type'];
  const types = Array.isArray(type) ? type : [type].filter(Boolean);
  const isProductLike = Boolean(value.name) && (
    types.some((entry) => /product|drug|medication|medicine/i.test(String(entry))) || 
    value.brand || value.sku || value.offers
  );

  if (isProductLike) {
    return [value];
  }

  return Object.values(value).flatMap(findProductNodes);
}

function readJsonLdCandidate(html) {
  const matches = [
    ...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  ];

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1]);
      const candidates = findProductNodes(parsed);
      if (candidates.length > 0) {
        return candidates[0];
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  }

  return null;
}

function extractByLabel(text, labels) {
  const pattern = new RegExp(
    `(?:${labels.join('|')})\\s*[:\\-]\\s*([^\\n.;,]{1,120}?)(?=(?:\\s+(?:Laboratoire|Laboratory|Fabricant|Manufacturer|Marque|Forme|Formulation|Présentation|Dosage|Dose|Concentration|DCI|Principe actif))|$)`,
    'i'
  );
  const match = text.match(pattern);
  return match ? normalizeText(match[1]) : '';
}

export default extractProductDataFromHtmlEnhanced;
