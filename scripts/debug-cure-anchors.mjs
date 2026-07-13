import { chromium } from 'playwright';

const url = process.argv[2] || 'https://cure.ma/medicaments/aciclovir-viatris-250-mg-poudre-pour-solution-injectable-iv/notice';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  const results = await page.evaluate(() => {
    const out = [];
    for (const el of Array.from(document.querySelectorAll('a,button'))) {
      const text = (el.innerText || el.textContent || '').trim();
      const href = el.getAttribute('href');
      if (/notice/i.test(text) || /notice/i.test(href || '')) {
        out.push({tag: el.tagName.toLowerCase(), href: href || null, text: text.slice(0, 200), class: el.className || ''});
      }
    }
    return out;
  });
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
