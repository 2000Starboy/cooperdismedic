export function normalizeText(value) {
  return String(value ?? '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .replace(/\s*([,;:.])\s*/g, '$1 ')
    .trim();
}

export async function gotoNoticePage(page) {
  const current = page.url();
  if (/\/notice(?:\?|#|$)/i.test(current)) {
    return current;
  }

  const href = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const candidate = anchors.find((a) => {
      const txt = (a.innerText || a.textContent || '').trim().toLowerCase();
      const href = a.getAttribute('href') || '';
      return /notice/i.test(txt) && /\/notice/i.test(href);
    });
    if (candidate) return candidate.href;

    const alt = anchors.find((a) => {
      const txt = (a.innerText || a.textContent || '').trim().toLowerCase();
      const href = a.getAttribute('href') || '';
      return /notice complète|voir la notice|notice disponible|read the notice|full notice/i.test(txt) && href;
    });
    return alt ? alt.href : null;
  });

  if (href) {
    const url = new URL(href, page.url()).toString();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    return url;
  }

  return current;
}

async function extractSection(page, labels, selectors = []) {
  const found = await page.evaluate(
    ({ labels, selectors }) => {
      const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && normalize(el.innerText).length > 0) {
          return normalize(el.innerText);
        }
      }

      const nodes = Array.from(document.querySelectorAll('h1,h2,h3,h4,div,p,section,span'));
      for (const node of nodes) {
        const txt = normalize(node.innerText || node.textContent || '');
        if (!txt) continue;
        const lower = txt.toLowerCase();
        if (labels.some((label) => lower.includes(label))) {
          let out = txt;
          let sibling = node.nextElementSibling;
          let count = 0;
          while (sibling && count < 40) {
            const tag = sibling.tagName.toLowerCase();
            if (/^h[1-4]$/.test(tag) || tag === 'section') break;
            out += ' ' + normalize(sibling.innerText || sibling.textContent || '');
            sibling = sibling.nextElementSibling;
            count += 1;
          }
          return normalize(out);
        }
      }
      return '';
    },
    { labels, selectors }
  );

  return normalizeText(found || '');
}

export async function extractNoticeSections(page) {
  const sections = {
    indications: '',
    posology: '',
    contraindications: '',
    sideEffects: '',
    conservation: '',
  };

  const tests = [
    {
      key: 'indications',
      labels: ['indications', 'indications therapeutiques', 'd\u00b4utilisation', 'd\u00b4emploi', 'd\u00b4usage', 'دواعي الاستعمال'],
      selectors: ['#indications', '[id*="indications"]', 'a[href*="#indications"]'],
    },
    {
      key: 'posology',
      labels: ['posologie', 'mode d\u2019emploi', 'mode d\u00e9utilisation', 'posology', 'dosage recommand', 'dosage'],
      selectors: ['#posologie', '[id*="posologie"]', 'a[href*="#posologie"]'],
    },
    {
      key: 'contraindications',
      labels: ['contre-indications', 'contre indications', 'contre-indication', 'contre-indication', 'mauvais', 'm\u00e9contentement'],
      selectors: ['#contre-indications', '[id*="contre"], [id*="contra"]', 'a[href*="#contre"]', 'a[href*="#contra"]'],
    },
    {
      key: 'sideEffects',
      labels: ['effets ind\u00e9sirables', 'effets secondaires', 'side effects', 'adverse reactions', 'effets'],
      selectors: ['#effets-indesirables', '#effets-secondaires', '[id*="effets"]', 'a[href*="#effets"]'],
    },
    {
      key: 'conservation',
      labels: ['conservation', 'conserver', 'storage', 'stockage'],
      selectors: ['#conservation', '[id*="conservation"]', 'a[href*="#conservation"]'],
    },
  ];

  for (const test of tests) {
    sections[test.key] = await extractSection(page, test.labels, test.selectors);
  }

  return sections;
}
