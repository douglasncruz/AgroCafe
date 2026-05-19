const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'AgroCafe', 'Despesas-Cafe.xlsx');
try {
  const workbook = xlsx.readFile(filePath);
  console.log("=== SHEET NAMES ===");
  console.log(workbook.SheetNames);
  
  for (const sheetName of workbook.SheetNames) {
    if (!sheetName.includes('2023')) continue;
    console.log(`\n=== SHEET: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    console.log(JSON.stringify(data.slice(0, 3), null, 2));
  }
} catch (err) {
  console.error("Erro ao ler o arquivo Excel:", err.message);
}
