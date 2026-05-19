const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('c:\\Users\\1124485\\OneDrive - Instituto Presbiteriano Mackenzie\\Documentos\\Antigravity\\agrocafe\\AgroCafe\\Despesas-Cafe.xlsx');

const result = {};
workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  result[sheetName] = data.slice(0, 5); // Just get the first 5 rows to see headers and some data
});

console.log(JSON.stringify(result, null, 2));
