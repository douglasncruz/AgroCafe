const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'backend', 'agrocafe.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.all('SELECT id, name, tenant_id FROM farms', (err, rows) => {
    console.log('FARMS:', rows);
  });
  db.all('SELECT id, name, tenant_id, "farmId" FROM harvests', (err, rows) => {
    console.log('HARVESTS:', rows);
  });
  db.all('SELECT id, name, area_hectares, tenant_id, "farmId" FROM plots', (err, rows) => {
    console.log('PLOTS:', rows);
  });
});
