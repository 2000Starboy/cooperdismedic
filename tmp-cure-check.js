import https from 'https';

const url = 'https://www.cure.ma/medicaments/classe/antibiotiques';
const options = { headers: { 'User-Agent': 'Mozilla/5.0' } };

https.get(url, options, (res) => {
  let data = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    const regex = /href="(\/medicaments\/[^\"#?]+)"/g;
    const set = new Set();
    let match;

    while ((match = regex.exec(data)) !== null) {
      set.add(match[1]);
      if (set.size >= 40) break;
    }

    console.log('Found links:', set.size);
    console.log([...set].slice(0,40).join('\n'));
    console.log('--- page includes API markers ---');
    console.log('NEXT_DATA', data.includes('__NEXT_DATA__'));
    console.log('LDJSON', data.includes('application/ld+json'));
  });
}).on('error', (e) => {
  console.error(e.message);
});
