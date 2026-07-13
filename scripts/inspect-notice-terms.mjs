import { chromium } from 'playwright';

const url = process.argv[2] || 'https://cure.ma/medicaments/aciclovir-viatris-250-mg-poudre-pour-solution-injectable-iv/notice';
const terms = ['posologie','posologie et','contre-indications','contre indications','contre-indication','effets indésirables','effet indésirable','conservation','mode d\'emploi','mode d\'utilisation'];

(async ()=>{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try{
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle');
    const text = await page.textContent('body') || '';
    const lower = text.toLowerCase();
    const out = {};
    for(const t of terms){
      const idx = lower.indexOf(t);
      if(idx>=0){
        const start = Math.max(0, idx-200);
        const snippet = text.slice(start, idx+800).replace(/\s+/g,' ').trim();
        out[t]=snippet.slice(0,1600);
      }
    }
    console.log(JSON.stringify({url, found: out}, null, 2));
  }catch(e){ console.error('ERR', e.message); process.exitCode=2; }
  finally{ await browser.close(); }
})();
