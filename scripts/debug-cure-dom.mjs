import { chromium } from 'playwright';

const url = process.argv[2] || 'https://cure.ma/medicaments/aciclovir-viatris-250-mg-poudre-pour-solution-injectable-iv/notice';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  const results = await page.evaluate(() => {
    const labels = ['indications', 'posologie', 'contre', 'effet', 'conservation', 'grossesse'];
    const nodeList = Array.from(document.querySelectorAll('*'));
    const out = [];
    for (const el of nodeList) {
      const text = (el.innerText || '').trim();
      const low = text.toLowerCase();
      if (text.length > 0 && low.length <= 300 && labels.some(label => low.includes(label))) {
        const isHidden = el.offsetParent === null && getComputedStyle(el).visibility !== 'visible';
        if(isHidden) continue;
        out.push({
          tag: el.tagName.toLowerCase(),
          class: el.className || '',
          id: el.id || '',
          text: text.slice(0, 300),
          outerHTML: el.outerHTML.slice(0, 800),
          next: el.nextElementSibling ? {tag: el.nextElementSibling.tagName.toLowerCase(), text: (el.nextElementSibling.innerText || '').slice(0, 300)} : null,
          prev: el.previousElementSibling ? {tag: el.previousElementSibling.tagName.toLowerCase(), text: (el.previousElementSibling.innerText || '').slice(0, 300)} : null,
        });
      }
    }
    return out.slice(0, 80);
  });

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
