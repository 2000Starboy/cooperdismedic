import { chromium } from 'playwright';

const url = process.argv[2] || 'https://cure.ma/medicaments/aciclovir-viatris-250-mg-poudre-pour-solution-injectable-iv';

(async ()=>{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try{
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle');
    // collect anchors/buttons/spans that include 'notice' in text
    const nodes = await page.$$eval('a,button,span,div', (els)=>els.map(e=>({text:e.innerText||e.textContent||'', href:e.getAttribute&&e.getAttribute('href')})).filter(x=>x.text && /notice/i.test(x.text)).slice(0,50));
    console.log(JSON.stringify({ url, found: nodes }, null, 2));
  }catch(e){ console.error('ERR', e.message); process.exitCode=2; }
  finally{ await browser.close(); }
})();
