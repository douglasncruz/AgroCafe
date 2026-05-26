const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '..', 'backend', 'agrocafe.sqlite'));

db.all('SELECT id, name, tenant_id, "farmId" FROM harvests WHERE "farmId"=\'7d7e06e0-116c-4c41-84db-7ad559612798\';', (err, rows) => {
  console.log('Harvests:', JSON.stringify(rows, null, 2));
});
