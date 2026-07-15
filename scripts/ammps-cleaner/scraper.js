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
const https = require('https');
const cheerio = require('cheerio');

// Configuration
const CACHE_DIR = path.resolve(__dirname, 'cache');
const DB_FILE = path.resolve(__dirname, 'ammps_database.json');
const TOTAL_PAGES = 493; // 9860 items / 20 items per page
const CONCURRENCY = 4; // Fetch 4 pages at a time
const DELAY_MS = 200; // Wait 200ms between batches
const MAX_RETRIES = 3;

// Create cache directory if it doesn't exist
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Fetch a URL with retries and custom headers
 */
function fetchPageWithRetry(page, attempt = 1) {
  const url = `https://www.ammps.gov.ma/basesdedonnes/liste_marocaine_des_medicaments?page=${page}`;
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3'
      },
      timeout: 15000 // 15 seconds timeout
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP status code ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  }).catch(async (error) => {
    if (attempt < MAX_RETRIES) {
      const waitTime = attempt * 1000;
      console.warn(`[Page ${page}] Failed: ${error.message}. Retrying in ${waitTime}ms... (Attempt ${attempt}/${MAX_RETRIES})`);
      await new Promise(r => setTimeout(r, waitTime));
      return fetchPageWithRetry(page, attempt + 1);
    }
    throw error;
  });
}

/**
 * Parse medication table and modals from HTML content
 */
function parsePageHtml(html, page) {
  const $ = cheerio.load(html);
  const pageResults = [];

  $('#medicamentsTable tbody tr').each((i, el) => {
    const tds = $(el).find('td');
    if (tds.length === 0) return;

    const specialty = $(tds[0]).text().trim();
    const dosage = $(tds[1]).text().trim();
    const form = $(tds[2]).text().trim();
    const dci = $(tds[3]).text().trim();
    const therapeuticClass = $(tds[4]).text().trim();
    const laboratory = $(tds[5]).text().trim();
    const status = $(tds[6]).text().trim();

    // Modal details
    const detailBtn = $(tds[7]).find('button');
    const targetModalId = detailBtn.attr('data-bs-target');
    
    let presentation = '';
    let statutAmm = '';
    let ppv = '';
    let ph = '';
    let pfht = '';
    let tva = '';

    if (targetModalId) {
      const modalId = targetModalId.replace('#', '');
      const modal = $(`#${modalId}`);
      if (modal.length > 0) {
        statutAmm = modal.find('.ammps-modal-label').filter((idx, labelEl) => $(labelEl).text().includes('Statut AMM')).next('.ammps-modal-value').text().trim();
        presentation = modal.find('.ammps-modal-label').filter((idx, labelEl) => $(labelEl).text().includes('Présentation')).next('.ammps-modal-value').text().trim();
        ppv = modal.find('.ammps-modal-label').filter((idx, labelEl) => $(labelEl).text().includes('PPV')).next('.ammps-modal-value').text().trim();
        ph = modal.find('.ammps-modal-label').filter((idx, labelEl) => $(labelEl).text().includes('PH')).next('.ammps-modal-value').text().trim();
        pfht = modal.find('.ammps-modal-label').filter((idx, labelEl) => $(labelEl).text().includes('PFHT')).next('.ammps-modal-value').text().trim();
        tva = modal.find('.ammps-modal-label').filter((idx, labelEl) => $(labelEl).text().includes('TVA')).next('.ammps-modal-value').text().trim();
      }
    }

    pageResults.push({
      specialty,
      dosage,
      form,
      dci,
      therapeuticClass,
      laboratory,
      status,
      statutAmm,
      presentation,
      ppv,
      ph,
      pfht,
      tva,
      sourcePage: page
    });
  });

  return pageResults;
}

/**
 * Main scraper function
 */
async function scrapeDatabase() {
  console.log('=== AMMPS DATABASE SCRAPER ===');
  console.log(`Target: ${TOTAL_PAGES} pages`);
  console.log(`Cache directory: ${CACHE_DIR}`);
  console.log(`Concurrency: ${CONCURRENCY} | Batch delay: ${DELAY_MS}ms`);

  const pagesToDownload = [];
  const parsedData = [];

  // Determine what needs to be downloaded
  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const cacheFilePath = path.join(CACHE_DIR, `page_${page}.json`);
    if (fs.existsSync(cacheFilePath)) {
      try {
        const cachedContent = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
        parsedData.push(...cachedContent);
      } catch (err) {
        console.warn(`Failed to parse cache for page ${page}, will re-download. Error: ${err.message}`);
        pagesToDownload.push(page);
      }
    } else {
      pagesToDownload.push(page);
    }
  }

  console.log(`Cached pages: ${TOTAL_PAGES - pagesToDownload.length}/${TOTAL_PAGES}`);
  console.log(`Pages remaining to download: ${pagesToDownload.length}`);

  if (pagesToDownload.length > 0) {
    let successCount = 0;
    let failCount = 0;

    // Process in batches
    for (let i = 0; i < pagesToDownload.length; i += CONCURRENCY) {
      const batch = pagesToDownload.slice(i, i + CONCURRENCY);
      console.log(`[Downloading batch] Pages: ${batch.join(', ')} (${Math.round((i / pagesToDownload.length) * 100)}% done)`);

      const promises = batch.map(async (page) => {
        try {
          const html = await fetchPageWithRetry(page);
          const pageResults = parsePageHtml(html, page);
          
          if (pageResults.length === 0 && page !== TOTAL_PAGES) {
            // Throw error to trigger retry if we got an empty page and it's not the absolute last page (which could be partially empty)
            throw new Error('Parsed 0 records from page');
          }

          // Save to cache
          const cacheFilePath = path.join(CACHE_DIR, `page_${page}.json`);
          fs.writeFileSync(cacheFilePath, JSON.stringify(pageResults, null, 2), 'utf-8');
          
          parsedData.push(...pageResults);
          successCount++;
        } catch (err) {
          console.error(`\x1b[31m[ERROR] Page ${page} failed after all retries: ${err.message}\x1b[0m`);
          failCount++;
        }
      });

      await Promise.all(promises);
      
      // Batch delay
      if (i + CONCURRENCY < pagesToDownload.length) {
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }

    console.log(`\nDownload completed. Success: ${successCount}, Failed: ${failCount}`);
  }

  // Deduplicate and save compiled database
  // We can key on a unique combination or just compile the array
  console.log(`Saving compiled database with ${parsedData.length} records to ${DB_FILE}...`);
  fs.writeFileSync(DB_FILE, JSON.stringify(parsedData, null, 2), 'utf-8');
  console.log('Database successfully compiled and saved!');
  
  return parsedData;
}

// Allow direct execution
if (require.main === module) {
  scrapeDatabase().catch(err => {
    console.error('Fatal Scraper Error:', err);
    process.exit(1);
  });
}

module.exports = { scrapeDatabase };
