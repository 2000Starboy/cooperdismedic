if (typeof global.File === 'undefined') {
  // Define File globally for Node 18 compatibility with undici
  const { Blob } = require('buffer');
  global.Blob = Blob;
  global.File = class File extends Blob {
    constructor(parts, filename, options = {}) {
      super(parts, options);
      this.name = filename;
      this.lastModified = options.lastModified || Date.now();
    }
  };
}

const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('doliprane-search.html', 'utf-8');
const $ = cheerio.load(html);

const results = [];

// Select all rows in the tbody of #medicamentsTable
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

  // Find the detail button to get the modal ID
  const detailBtn = $(tds[7]).find('button');
  const targetModalId = detailBtn.attr('data-bs-target');
  
  let presentation = '';
  let statutAmm = '';
  let ppv = '';
  let ph = '';

  if (targetModalId) {
    // Find the modal matching this ID
    const modalId = targetModalId.replace('#', '');
    const modal = $(`#${modalId}`);
    if (modal.length > 0) {
      statutAmm = modal.find('.ammps-modal-label').filter((i, el) => $(el).text().includes('Statut AMM')).next('.ammps-modal-value').text().trim();
      presentation = modal.find('.ammps-modal-label').filter((i, el) => $(el).text().includes('Présentation')).next('.ammps-modal-value').text().trim();
      ppv = modal.find('.ammps-modal-label').filter((i, el) => $(el).text().includes('PPV')).next('.ammps-modal-value').text().trim();
      ph = modal.find('.ammps-modal-label').filter((i, el) => $(el).text().includes('PH')).next('.ammps-modal-value').text().trim();
    }
  }

  results.push({
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
    ph
  });
});

console.log(`Parsed ${results.length} results:`);
console.log(JSON.stringify(results.slice(0, 5), null, 2));
