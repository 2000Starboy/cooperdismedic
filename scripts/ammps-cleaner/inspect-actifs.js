const XLSX = require('xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../../medicaments_actifs.xlsx');
const wb = XLSX.readFile(filePath);
console.log('Sheet Names:', wb.SheetNames);

const sheetName = wb.SheetNames[0];
const ws = wb.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(ws);

console.log('Total Rows:', data.length);
console.log('First Row Keys:', Object.keys(data[0] || {}));
console.log('First Row:', JSON.stringify(data[0], null, 2));
console.log('Second Row:', JSON.stringify(data[1], null, 2));
