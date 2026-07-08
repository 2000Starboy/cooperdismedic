import https from "https";
const url = "https://www.cure.ma/medicaments/flagyl-250-mg-comprime";
https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, res => {
  let data = "";
  res.setEncoding("utf8");
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    const start = data.indexOf('<script type="application/ld+json">');
    console.log('STATUS', res.statusCode);
    console.log('TITLE', (data.match(/<title>([^<]+)<\/title>/i) || [])[1]);
    console.log('HAS_JSONLD', start !== -1);
    if (start !== -1) {
      const end = data.indexOf('</script>', start);
      console.log('JSONLD', data.slice(start, Math.min(data.length, start + 1200)));
    }
    const excerpt = data.slice(0, 6000);
    console.log('EXCERPT', excerpt);
  });
}).on('error', e => console.error(e.message));
