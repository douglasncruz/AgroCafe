const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres:postgres@localhost:5432/agrocafe'
});

async function run() {
  try {
    await client.connect();
    
    // 1. Get Douglas Cruz's Tenant ID
    const resUsers = await client.query("SELECT id, name, email, tenant_id FROM users WHERE email='douglas.cruz@agrocerradocafe.com.br'");
    console.log("Douglas User:", resUsers.rows);
    const douglasTenantId = resUsers.rows[0].tenant_id;
    const douglasUserId = resUsers.rows[0].id;

    // 2. See farms owned by Douglas
    const resFarms = await client.query("SELECT id, name, tenant_id, \"userId\" FROM farms WHERE tenant_id = $1 OR \"userId\" = $2", [douglasTenantId, douglasUserId]);
    console.log("Douglas Farms:", resFarms.rows);

    // 3. See if Admin has the Família Cruz farm
    const resAdmin = await client.query("SELECT id, name, email, tenant_id FROM users WHERE email='admin@agrocafe.com'");
    if (resAdmin.rows.length > 0) {
      const adminTenantId = resAdmin.rows[0].tenant_id;
      const resAdminFarms = await client.query("SELECT id, name, tenant_id, \"userId\" FROM farms WHERE tenant_id = $1", [adminTenantId]);
      console.log("Admin Farms:", resAdminFarms.rows);
    }

  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

run();
