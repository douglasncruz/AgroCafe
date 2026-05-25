const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '..', 'backend', 'agrocafe.sqlite'));

const douglasTenantId = '30f8a8b5-62d4-4394-9b83-d4d07fbd5662';

db.all('SELECT id, name, tenant_id FROM farms WHERE tenant_id = ?;', [douglasTenantId], (err, rows) => {
  console.log("Farms:", rows);
});

db.all('SELECT id, name, tenant_id, "farmId" FROM harvests WHERE tenant_id = ?;', [douglasTenantId], (err, rows) => {
  console.log("Harvests:", rows);
});
