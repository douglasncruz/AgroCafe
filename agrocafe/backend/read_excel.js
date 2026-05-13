const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Despesas-Café.xlsx');
try {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  console.log("Colunas e primeiras linhas:");
  console.log(JSON.stringify(data.slice(0, 5), null, 2));
} catch (err) {
  console.error("Erro ao ler o arquivo Excel:", err.message);
}
