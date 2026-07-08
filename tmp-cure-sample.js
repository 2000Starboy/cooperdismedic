import https from "https";

const url = "https://www.cure.ma/medicaments/flagyl-250-mg-comprime";
https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, res => {
  let data = "";
  res.setEncoding("utf8");
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    const scripts = [...data.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const [index, match] of scripts.entries()) {
      const text = match[1];
      if (/"@type"\s*:\s*"(Drug|Product|MedicalEntity|WebPage|WebSite)"/i.test(text) || /dosageForm|activeIngredient|manufacturer|brand|offers/.test(text)) {
        console.log('SCRIPT', index, 'LEN', text.length);
        console.log(text.slice(0, 1400));
        console.log('---');
      }
    }
  });
}).on('error', e => console.error('ERROR', e.message));
