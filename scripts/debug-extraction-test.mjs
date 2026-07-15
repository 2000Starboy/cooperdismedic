// Debug full RSC format for /notice page
const AGREL_NOTICE = 'https://cure.ma/medicaments/agrel-75-mg-comprime-pellicule/notice';

const res = await fetch(AGREL_NOTICE, { headers:{'User-Agent':'Mozilla/5.0','Accept':'text/html'} });
const html = await res.text();

// Get chunk 8 fully
const re = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
let m;
let chunkIdx = 0;
while ((m = re.exec(html)) !== null) {
  if (chunkIdx === 8) {
    const raw = m[1]
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\t/g, ' ')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
    
    console.log('=== CHUNK 8 (full, first 5000 chars) ===');
    console.log(raw.substring(0, 5000));
    
    // Find all T<size>, text blocks
    const tBlocks = [...raw.matchAll(/\d+:T[0-9a-f]+,([\s\S]*?)(?=\n\d+:|$)/g)];
    console.log(`\n\n=== T-blocks found: ${tBlocks.length} ===`);
    for (const tb of tBlocks) {
      console.log(`\n--- T-block ---`);
      console.log(tb[1].substring(0, 500));
    }
  }
  chunkIdx++;
}
