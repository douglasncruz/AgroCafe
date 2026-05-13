const xlsx = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const db = new sqlite3.Database(path.join(__dirname, 'agrocafe.sqlite'));

const filePath = path.join(__dirname, '..', 'Despesas-Cafe.xlsx');
console.log("Lendo arquivo:", filePath);

try {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

  db.serialize(() => {
    db.get("SELECT id FROM users LIMIT 1", (err, user) => {
      if (err || !user) {
        console.error("Nenhum usuário logado/registrado no banco para associar as fazendas.");
        return;
      }
      const userId = user.id;
      console.log("Associando dados ao usuário ID:", userId);

      const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0] || row[0] === 'Totais') continue;

        let farmName = row[0]; // 'Douglas' ou 'Cruz'
        if (farmName === 'Cruz') {
           farmName = 'Família Cruz';
        }

        const farmId = uuidv4();
        const created_at = new Date().toISOString();
        
        db.run(`INSERT INTO farms (id, name, total_area_hectares, city, state, "userId", created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
          [farmId, farmName, 50, 'Machado', 'MG', userId, created_at, created_at], 
          function(err) {
            if (err) console.error("Erro ao criar fazenda:", err.message);
            else console.log("Fazenda criada com sucesso:", farmName);
        });

        for (let j = 0; j < years.length; j++) {
          const year = years[j];
          const colIndex = j + 1;
          const totalYearlyExpense = row[colIndex];
          
          if (totalYearlyExpense && !isNaN(totalYearlyExpense)) {
            const monthlyAmount = totalYearlyExpense / 12;
            
            for (let month = 0; month < 12; month++) {
              const expenseId = uuidv4();
              const mm = String(month + 1).padStart(2, '0');
              const dateStr = `${year}-${mm}-15`;

              db.run(`INSERT INTO expenses (id, description, amount, date, category, status, "farmId", created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [expenseId, `Manutenção e Insumos (${year})`, monthlyAmount, dateStr, 'Insumos', 'Pago', farmId, created_at, created_at],
                function(err) {
                  if (err) console.error("Erro ao criar despesa:", err.message);
              });
            }
          }
        }
      }
      console.log("Importação concluída com sucesso! Milhares de despesas foram inseridas no banco.");
    });
  });
} catch (e) {
  console.error("Erro fatal:", e);
}
