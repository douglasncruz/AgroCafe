const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'AgroCafe', 'Despesas-Cafe.xlsx');
console.log("Caminho do arquivo:", filePath);
try {
  const workbook = xlsx.readFile(filePath);
  console.log("Abas encontradas:", workbook.SheetNames);
  
  for (const sheetName of workbook.SheetNames) {
    console.log(`\n--- Aba: ${sheetName} ---`);
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    console.log("Colunas e primeiras 5 linhas:");
    console.log(JSON.stringify(data.slice(0, 6), null, 2));
  }
} catch (err) {
  console.error("Erro ao ler o arquivo Excel:", err.message);
}
