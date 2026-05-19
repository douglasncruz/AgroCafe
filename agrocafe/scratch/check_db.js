const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'backend', 'agrocafe.sqlite');
console.log('Connecting to database:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  // Check farms
  db.all('SELECT id, name FROM farms', [], (err, rows) => {
    if (err) {
      console.error('Error querying farms:', err.message);
      return;
    }
    console.log('\n--- FARMS ---');
    console.log(rows);
  });

  // Check harvests
  db.all('SELECT id, name, is_active, status, farmId FROM harvests', [], (err, rows) => {
    if (err) {
      console.error('Error querying harvests:', err.message);
      return;
    }
    console.log('\n--- HARVESTS ---');
    console.log(rows);
  });

  // Check count of expenses and revenues per harvest
  db.all('SELECT harvestId, COUNT(*) as cnt FROM expenses GROUP BY harvestId', [], (err, rows) => {
    if (err) {
      console.error('Error querying expenses group by:', err.message);
      return;
    }
    console.log('\n--- EXPENSES COUNT PER HARVEST ---');
    console.log(rows);
  });

  db.all('SELECT harvestId, COUNT(*) as cnt FROM revenues GROUP BY harvestId', [], (err, rows) => {
    if (err) {
      console.error('Error querying revenues group by:', err.message);
      return;
    }
    console.log('\n--- REVENUES COUNT PER HARVEST ---');
    console.log(rows);
  });
});
