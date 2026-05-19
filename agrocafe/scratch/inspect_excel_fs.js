const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Despesas-Cafe.xlsx');
const outputPath = path.join(__dirname, 'excel_structure.txt');

try {
  console.log('Reading Excel from:', filePath);
  const workbook = xlsx.readFile(filePath);
  
  let output = `Excel File: Despesas-Cafe.xlsx\n`;
  output += `Sheet Names: ${JSON.stringify(workbook.SheetNames)}\n\n`;

  workbook.SheetNames.forEach((sheetName) => {
    output += `=========================================\n`;
    output += `SHEET: ${sheetName}\n`;
    output += `=========================================\n`;
    
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    output += `Total Rows: ${data.length}\n\n`;
    output += `First 10 Rows:\n`;
    data.slice(0, 15).forEach((row, idx) => {
      output += `Row ${idx}: ${JSON.stringify(row)}\n`;
    });
    output += `\n\n`;
  });

  fs.writeFileSync(outputPath, output, 'utf8');
  console.log('Successfully wrote structure to:', outputPath);
} catch (err) {
  fs.writeFileSync(outputPath, `Error reading Excel: ${err.message}\n${err.stack}`, 'utf8');
  console.error('Error:', err);
}
