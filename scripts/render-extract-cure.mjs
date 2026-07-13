import { chromium } from 'playwright';
import { gotoNoticePage, extractNoticeSections, normalizeText } from './cure-notice-utils.mjs';

const url = process.argv[2] || 'https://cure.ma/medicaments/anor-70-mg-comprime';
const labels = ['Indications', 'Posologie', 'Contre‑indications', 'Contre-indications', 'Effets indésirables', 'Effets secondaires', 'Conservation', 'Mode d\'emploi', 'Mode d\'utilisation'];

function normalize(s){ return String(s||'').replace(/\s+/g,' ').trim(); }

async function extractSections(page){
  // Wait for main content to appear
  await page.waitForLoadState('networkidle');

  // Prefer notice-specific extraction when the page has a notice structure
  const noticeSections = await extractNoticeSections(page);
  if (Object.values(noticeSections).some((v) => v && v.length > 0)) {
    return noticeSections;
  }

  const result = {};

  // Try to extract by scanning headers (h1..h4) and nearby siblings
  const headerHandles = await page.$$('h1,h2,h3,h4,div');
  for (const label of labels){
    result[label] = '';
  }

  for (const h of headerHandles){
    try{
      const text = normalize(await h.innerText());
      if(!text) continue;
      for (const label of labels){
        if (text.toLowerCase().includes(label.toLowerCase())){
          // gather the next siblings' text until next header-like element
          const content = await page.evaluate((el)=>{
            let out='';
            let node = el.nextElementSibling;
            let steps=0;
            while(node && steps<40){
              const tag = node.tagName.toLowerCase();
              if(/h1|h2|h3|h4/.test(tag) ) break;
              out += ' ' + (node.innerText || node.textContent || '');
              node = node.nextElementSibling;
              steps++;
            }
            return out;
          }, h);
          if (content && content.trim()) result[label] = (result[label] ? result[label] + '\n' : '') + normalize(content);
        }
      }
    }catch(e){ /* ignore */ }
  }

  // Also try selectors that might contain rich sections
  const possibleSelectors = [
    '[data-test-section]','[data-section]','[class*=indication]','[class*=posologie]','[class*=contre]','[class*=effet]','.product-description','.product-content'
  ];
  for (const sel of possibleSelectors){
    try{
      const el = await page.$(sel);
      if(el){
        const t = normalize(await el.innerText());
        for (const label of labels){
          if(t.toLowerCase().includes(label.toLowerCase()) && (!result[label] || result[label].length<10)){
            result[label] = t;
          }
        }
      }
    }catch(e){ }
  }

  // As fallback, read JSON-LD Drug description
  const jsonLd = await page.$$eval('script[type="application/ld+json"]', (nodes)=>nodes.map(n=>n.textContent).slice(0,10));
  for (const txt of jsonLd){
    try{
      const j = JSON.parse(txt);
      if(Array.isArray(j)){
        for(const item of j){ if(item['@type']==='Drug' && item.description){ result['jsonld_description'] = item.description; }}
      }else{
        if(j['@type']==='Drug' && j.description) result['jsonld_description']=j.description;
      }
    }catch(e){}
  }

  // Fallback: parse whole visible text and split by label headers using original text positions
  try{
    const bodyText = (await page.textContent('body')) || '';
    const lower = bodyText.toLowerCase();
    const idxs = [];
    for(const label of labels){
      const ln = label.toLowerCase().replace(/’/g,"'");
      const i = lower.indexOf(ln);
      if(i>=0) idxs.push({label, i, ln});
    }
    idxs.sort((a,b)=>a.i-b.i);
    for(let j=0;j<idxs.length;j++){
      const start = idxs[j].i + idxs[j].ln.length;
      const end = (j+1<idxs.length)? idxs[j+1].i : Math.min(start+3000, lower.length);
      const slice = bodyText.slice(Math.max(0, start-20), Math.min(bodyText.length, end+20)).replace(/\s+/g,' ').trim();
      if(slice && slice.length>10){
        result[idxs[j].label] = slice;
      }
    }
  }catch(e){}

  return result;
}

async function clickNoticeAndTabs(page){
  // Try to click link/button that reveals the full notice
  const noticeTexts = ['Lire la notice', 'Lire la notice complète', 'Voir la notice', 'Lire la notice complète'];
  for (const txt of noticeTexts){
    try{
      const xpath = `//a[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${txt.toLowerCase()}')]|//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${txt.toLowerCase()}')]`;
      const nodes = await page.$x(xpath);
      if(nodes && nodes.length){
        try{ await nodes[0].click({force:true}); await page.waitForTimeout(600); }catch(e){}
        break;
      }
    }catch(e){}
  }

  // Try clicking tab-like elements for each label to reveal content panels
  for (const label of labels){
    const low = label.toLowerCase().replace(/’/g,"'");
    try{
      // search for visible element that contains the label text
      const xpathTab = `//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${low}')]|//a[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${low}')]|//li[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${low}')]`;
      const tabs = await page.$x(xpathTab);
      if(tabs && tabs.length){
        try{ await tabs[0].click({force:true}); await page.waitForTimeout(300); }catch(e){}
      }
    }catch(e){}
  }

  // give page time to render dynamic panels
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
}

(async ()=>{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try{
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // try to open the notice page first
    await clickNoticeAndTabs(page);
    await gotoNoticePage(page);
    await page.waitForLoadState('networkidle');
    const sections = await extractSections(page);
    console.log(JSON.stringify({ url: page.url(), sections }, null, 2));
  }catch(err){
    console.error('ERROR', err.message);
    process.exitCode = 2;
  }finally{
    await browser.close();
  }
})();
