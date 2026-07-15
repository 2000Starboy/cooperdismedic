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

const https = require('https');
const cheerio = require('cheerio');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const url = 'https://www.ammps.gov.ma/basesdedonnes/liste_marocaine_des_medicaments?page=493';
    console.log(`Fetching: ${url}`);
    const html = await fetchUrl(url);
    const $ = cheerio.load(html);
    const rows = $('#medicamentsTable tbody tr');
    console.log(`Found ${rows.length} rows on page 493.`);
    if (rows.length > 0) {
      console.log('First row specialty:', rows.first().find('td').first().text().trim());
      console.log('Last row specialty:', rows.last().find('td').first().text().trim());
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
  }
}

run();
