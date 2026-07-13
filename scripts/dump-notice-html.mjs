import { chromium } from 'playwright';

const url = process.argv[2] || 'https://cure.ma/medicaments/aciclovir-viatris-250-mg-poudre-pour-solution-injectable-iv/notice';

(async ()=>{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try{
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle');
    const matches = await page.$$eval('*', (els)=>els.filter(e=>{try{return (e.innerText||'').toLowerCase().includes('notice complète')|| (e.innerText||'').toLowerCase().includes('notice disponible');}catch(e){return false}}).slice(0,10).map(e=>({tag:e.tagName, class:e.className, text:(e.innerText||'').slice(0,800)})));
    console.log(JSON.stringify({url, matches}, null, 2));
  }catch(e){ console.error('ERR', e.message); process.exitCode=2; }
  finally{ await browser.close(); }
})();
