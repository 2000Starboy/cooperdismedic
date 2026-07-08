import https from 'https';

const url = 'https://www.cure.ma/sitemap.xml';
https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let data = '';
  res.setEncoding('utf8');
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const urls = [...data.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m => m[1]);
    console.log('TOTAL LOCS', urls.length);
    console.log(urls.slice(0, 40).join('\n'));
    console.log('---');
    const productLike = urls.filter(u => /\/medicaments\//i.test(new URL(u).pathname) && !/\/classe\//i.test(new URL(u).pathname));
    console.log('PRODUCT-LIKE', productLike.length);
    console.log(productLike.slice(0, 40).join('\n'));
  });
}).on('error', e => console.error('ERROR', e.message));
