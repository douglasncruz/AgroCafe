import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  console.log('Connected to:', dataSource.options.type);
  if (dataSource.options.type === 'postgres') {
    console.log('URL:', dataSource.options.url);
  }

  // Find demo farm
  const farms = await dataSource.query(`SELECT id, name, tenant_id FROM farms WHERE name LIKE '%Demonstração%'`);
  console.log('Demo farms found:', farms);

  if (farms.length > 0) {
    for (const farm of farms) {
      console.log(`Deleting farm: ${farm.id}`);
      // Delete harvests manually to avoid FK constraint issues if any
      await dataSource.query(`DELETE FROM harvests WHERE "farmId" = '${farm.id}'`);
      await dataSource.query(`DELETE FROM farms WHERE id = '${farm.id}'`);
      console.log('Farm deleted successfully!');
    }
  } else {
    console.log('No demo farm found to delete.');
  }

  await app.close();
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
