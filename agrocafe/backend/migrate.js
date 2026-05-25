const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '..', 'backend', 'agrocafe.sqlite'));

const adminTenantId = 'cebe7374-21b0-44d0-a71e-6fb6bccf342b';
const douglasTenantId = '30f8a8b5-62d4-4394-9b83-d4d07fbd5662';
const douglasUserId = 'bc95ceb5-72a7-4ef6-aa01-d1c1b7fd7c9a';

db.serialize(() => {
  db.run("UPDATE farms SET tenant_id = ?, \"userId\" = ? WHERE tenant_id = ?", [douglasTenantId, douglasUserId, adminTenantId]);
  db.run("UPDATE harvests SET tenant_id = ? WHERE tenant_id = ?", [douglasTenantId, adminTenantId]);
  db.run("UPDATE expenses SET tenant_id = ? WHERE tenant_id = ?", [douglasTenantId, adminTenantId]);
  db.run("UPDATE revenues SET tenant_id = ? WHERE tenant_id = ?", [douglasTenantId, adminTenantId]);
  db.run("UPDATE plots SET tenant_id = ? WHERE tenant_id = ?", [douglasTenantId, adminTenantId]);
  db.run("UPDATE machines SET tenant_id = ? WHERE tenant_id = ?", [douglasTenantId, adminTenantId]);
  db.run("UPDATE maintenances SET tenant_id = ? WHERE tenant_id = ?", [douglasTenantId, adminTenantId]);
  db.run("UPDATE partners SET tenant_id = ? WHERE tenant_id = ?", [douglasTenantId, adminTenantId]);
  db.run("UPDATE agrochemicals SET tenant_id = ? WHERE tenant_id = ?", [douglasTenantId, adminTenantId]);
  db.run("UPDATE stock_items SET tenant_id = ? WHERE tenant_id = ?", [douglasTenantId, adminTenantId]);
  db.run("UPDATE stock_transactions SET tenant_id = ? WHERE tenant_id = ?", [douglasTenantId, adminTenantId]);
  console.log('Migração concluída com sucesso!');
});
