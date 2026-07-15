const XLSX = require('xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../../ref-des-medicaments-cnops-2014.xlsx');
const wb = XLSX.readFile(filePath);

console.log('=== SHEET NAMES ===');
console.log(wb.SheetNames);

for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const range = XLSX.utils.decode_range(ws['!ref']);
  console.log(`\n=== Sheet: ${sheetName} ===`);
  console.log(`Range: ${ws['!ref']}`);
  console.log(`Rows: ${range.e.r + 1}, Cols: ${range.e.c + 1}`);
  
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  
  // Print headers (first row)
  console.log('\n--- Headers ---');
  console.log(JSON.stringify(data[0], null, 2));
  
  // Print first 10 data rows
  console.log('\n--- First 10 rows ---');
  for (let i = 1; i < Math.min(11, data.length); i++) {
    console.log(`Row ${i}:`, JSON.stringify(data[i]));
  }
  
  // Print last 3 rows
  console.log('\n--- Last 3 rows ---');
  for (let i = Math.max(1, data.length - 3); i < data.length; i++) {
    console.log(`Row ${i}:`, JSON.stringify(data[i]));
  }
}
