const url = process.argv[2] || 'https://cure.ma/medicaments/anor-70-mg-comprime';

(async () => {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'fr-FR,fr;q=0.9' } });
    const html = await res.text();
    const patterns = [
      'self.__next_f',
      'window.__NEXT_DATA__',
      '__NEXT_DATA__',
      'id="__NEXT_DATA__"',
      'data-next',
        '/_next/data',
        '/api/medicaments',
      'hydration',
      '"indications"',
      '"posologie"',
      'application/ld+json'
    ];

    for (const p of patterns) {
      const has = html.includes(p);
      console.log(p + ':', has);
      if (has) {
        const idx = html.indexOf(p);
        console.log('--- snippet ---');
        console.log(html.slice(Math.max(0, idx - 200), idx + 800));
        console.log('--- end ---\n');
      }
    }

    // Try regexes for serialized push blocks
    const pushRe = /self\.__next_f\s*\.\s*push\s*\(\s*\[\s*1\s*,\s*"([\s\S]*?)"\s*\]\s*\)\s*\;/g;
    let m;
    let parts = [];
    while ((m = pushRe.exec(html))) {
      parts.push(m[1]);
    }
    if (parts.length) {
      console.log('\nCollected', parts.length, 'self.__next_f payload parts');
      const joined = parts.join('\n');
      const keywords = ['Indications','Posologie','Contre-indications','Effets indésirables','Conservation','posologie','indication','contre','effet','conservation'];
      for (const k of keywords) {
        const foundIdx = joined.search(new RegExp(k, 'i'));
        console.log(k + ':', foundIdx !== -1 ? 'present' : 'absent');
        if (foundIdx !== -1) console.log(' --- context ---\n', joined.slice(Math.max(0, foundIdx-200), foundIdx+400), '\n--- end ---');
      }
    }

    const nextDataRe = /<script[^>]*>\s*(?:window\.)?__NEXT_DATA__\s*=\s*(\{[\s\S]*?\})\s*<\//i;
    const nd = html.match(nextDataRe);
    if (nd) {
      console.log('\nFound __NEXT_DATA__ script, sample:', nd[1].slice(0, 500));
    }

    const ld = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    console.log('\nJSON-LD scripts found:', ld.length);
    for (let i=0;i<ld.length;i++){
      try{
        const j = JSON.parse(ld[i][1]);
        console.log('JSON-LD['+i+'] @type:', j['@type'] || '(none)', ' keys:', Object.keys(j).slice(0,6));
        if (i<3) console.log(' sample:', ld[i][1].slice(0,300));
      }catch(e){
        console.log('JSON-LD['+i+'] parse error, sample:', ld[i][1].slice(0,300));
      }
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
