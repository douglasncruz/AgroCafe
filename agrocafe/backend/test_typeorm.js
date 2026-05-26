const { DataSource } = require('typeorm');
const path = require('path');

const dataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, '..', 'backend', 'agrocafe.sqlite'),
  entities: [path.join(__dirname, '..', 'backend', 'dist', '**', '*.entity.js')],
});

async function run() {
  await dataSource.initialize();
  const harvestRepo = dataSource.getRepository('Harvest');
  // test TypeORM query with tenant_id
  const douglasTenantId = '30f8a8b5-62d4-4394-9b83-d4d07fbd5662';
  const farmId = '7d7e06e0-116c-4c41-84db-7ad559612798';
  
  const harvests = await harvestRepo.find({
    where: { farm: { id: farmId }, tenant_id: douglasTenantId },
  });
  console.log("Harvests with tenant_id:", harvests.map(h => h.name));
  await dataSource.destroy();
}

run().catch(console.error);
