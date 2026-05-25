const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '..', 'backend', 'agrocafe.sqlite'));

db.run("DELETE FROM farms WHERE name='Agro Cerrado Café (Demonstração)';", (err) => {
  if (err) console.error(err);
  else console.log('Fazenda deletada');
});
