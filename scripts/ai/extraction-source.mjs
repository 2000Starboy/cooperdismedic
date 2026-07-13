import { chromium } from 'playwright';
import { extractProductDataFromHtml } from '../import-product-from-url.mjs';
import { extractNoticeSections, gotoNoticePage } from '../cure-notice-utils.mjs';

const DEFAULT_FETCH_TIMEOUT = 15000;
const CURE_MA_HOST = /https?:\/\/(?:www\.)?cure\.ma/i;
const URL_REGEX = /https?:\/\/[^\s"'<>]+/gi;

function isUrlCandidate(value) {
  if (!value) return false;
  return URL_REGEX.test(String(value));
}

function extractUrlFromText(value) {
  if (!value) return '';
  const text = String(value);
  const matches = text.match(URL_REGEX);
  if (!matches || matches.length === 0) return '';
  return matches[0].replace(/[.,;:]+$/, '');
}

function isCureMaUrl(url) {
  return CURE_MA_HOST.test(String(url));
}

async function fetchHtml(url, timeout = DEFAULT_FETCH_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
    });
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

export class ExtractionService {
  constructor({ browser = null, enablePlaywright = true } = {}) {
    this.browser = browser;
    this.enablePlaywright = enablePlaywright;
  }

  static async create({ enablePlaywright = true } = {}) {
    const browser = enablePlaywright ? await chromium.launch({ headless: true }) : null;
    return new ExtractionService({ browser, enablePlaywright });
  }

  async dispose() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async extractFromProduct(product) {
    const sourceUrl = extractUrlFromText(product.sourceUrl || product.description || '');
    if (!sourceUrl) {
      return { sourceUrl: null, extracted: null, notes: 'no-source-url' };
    }

    const html = await fetchHtml(sourceUrl);
    if (!html) {
      return { sourceUrl, extracted: null, notes: 'fetch-failed' };
    }

    const extracted = extractProductDataFromHtml(html, sourceUrl);
    const notes = ['rawHtml'];
    if (isCureMaUrl(sourceUrl) && this.browser) {
      const browserResult = await this.extractFromCureMaUrl(sourceUrl);
      if (browserResult && browserResult.extracted) {
        notes.push('playwright');
        return {
          sourceUrl,
          extracted: {
            ...extracted,
            ...browserResult.extracted,
          },
          notes: notes.join(', '),
        };
      }
    }

    return { sourceUrl, extracted, notes: notes.join(', ') };
  }

  async extractFromCureMaUrl(url) {
    if (!this.browser || !isCureMaUrl(url)) {
      return null;
    }

    const page = await this.browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await gotoNoticePage(page);
      const sections = await extractNoticeSections(page);
      return { extracted: sections, notes: 'playwright-curema' };
    } catch {
      return null;
    } finally {
      await page.close();
    }
  }
}
