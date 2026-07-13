const DEFAULT_OLLAMA_HOST = 'http://127.0.0.1:11434';
const DEFAULT_MODEL = 'llama2';

function safeJsonParse(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  const candidate = firstBrace !== -1 && lastBrace !== -1 ? trimmed.slice(firstBrace, lastBrace + 1) : trimmed;

  try {
    return JSON.parse(candidate);
  } catch (error) {
    const cleaned = candidate
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ');
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

function buildPrompt(product, extracted, missingFields) {
  const fields = missingFields.map((field) => `- ${field}`).join('\n');
  const existingFields = missingFields
    .map((field) => `${field}: ${String(product[field] || '').trim()}`)
    .join('\n');

  const extractedSummary = Object.entries(extracted || {})
    .filter(([key]) => missingFields.includes(key))
    .map(([key, value]) => `${key}: ${String(value || '').trim()}`)
    .join('\n');

  return `You are a medical content assistant for a Moroccan pharmaceutical catalogue.\n` +
    `A product has missing fields. Do not invent information. Use only the reliable extracted material and local catalogue context.\n` +
    `Return only a JSON object with the keys: ${missingFields.join(', ')}.\n` +
    `If you cannot find a value, return an empty string for that field.\n` +
    `Do not include any explanation or markdown.\n` +
    `\n` +
    `Product metadata:\n` +
    `name: ${product.name || ''}\n` +
    `dci: ${product.dci || ''}\n` +
    `laboratory: ${product.laboratory || ''}\n` +
    `dosage: ${product.dosage || ''}\n` +
    `sourceUrl: ${product.sourceUrl || ''}\n` +
    `\n` +
    `Existing fields:\n${existingFields}\n` +
    `\n` +
    `Extracted candidate texts:\n${extractedSummary}\n` +
    `\n` +
    `Output JSON:`;
}

export class OllamaAgent {
  constructor({ host = DEFAULT_OLLAMA_HOST, model = DEFAULT_MODEL } = {}) {
    this.host = host;
    this.model = model;
  }

  async isAvailable() {
    try {
      const response = await fetch(`${this.host}/v1/models/${this.model}`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  async complete(payload) {
    const url = `${this.host}/v1/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Ollama request failed ${response.status} ${response.statusText}`);
    }
    const json = await response.json();
    return json;
  }

  async enrich(product, extracted, missingFields) {
    if (!missingFields.length) return null;
    const prompt = buildPrompt(product, extracted, missingFields);
    const payload = {
      model: this.model,
      prompt,
      max_tokens: 512,
      temperature: 0.2,
    };

    const result = await this.complete(payload);
    const text = String(result?.choices?.[0]?.text || result?.output?.[0]?.content?.[0]?.text || '');
    const parsed = safeJsonParse(text);
    if (!parsed) {
      return null;
    }

    const normalized = {};
    for (const field of missingFields) {
      if (Object.prototype.hasOwnProperty.call(parsed, field)) {
        normalized[field] = parsed[field] || '';
      }
    }
    return normalized;
  }
}
