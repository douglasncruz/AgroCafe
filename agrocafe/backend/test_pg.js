const { Client } = require('pg');

const passwords = ['postgres', 'admin', 'root', '123456', 'password', 'agrocafe', '1234'];

async function testPassword(password) {
  const client = new Client({
    connectionString: `postgres://postgres:${password}@localhost:5432/agrocafe`
  });
  try {
    await client.connect();
    console.log(`Success with password: ${password}`);
    await client.end();
    return true;
  } catch (err) {
    return false;
  }
}

async function run() {
  for (const pw of passwords) {
    if (await testPassword(pw)) {
      break;
    }
  }
}
run();
