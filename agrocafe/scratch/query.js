const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '..', 'backend', 'agrocafe.sqlite'));

db.all('SELECT * FROM farms;', (err, rows) => {
  console.log(JSON.stringify(rows, null, 2));
});
