const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '..', 'backend', 'agrocafe.sqlite'));

db.all('SELECT id, name, tenant_id, "userId" FROM farms;', (err, rows) => {
  console.log("All Farms:", rows);
});
