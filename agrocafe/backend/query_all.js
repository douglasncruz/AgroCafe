const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '..', 'backend', 'agrocafe.sqlite'));

db.all('SELECT id, name, tenant_id, "userId" FROM farms;', (err, rows) => { console.log('Farms:', rows); });
db.all('SELECT id, name, tenant_id, "farmId" FROM harvests;', (err, rows) => { console.log('Harvests:', rows); });
db.all('SELECT id, name, email, tenant_id FROM users;', (err, rows) => { console.log('Users:', rows); });
