import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { EntityManager } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const manager = app.get(EntityManager);
  
  const users = await manager.query('SELECT id, email, tenant_id FROM users');
  console.log('USERS:', users);
  
  const farms = await manager.query('SELECT id, name, tenant_id, "userId" FROM farms');
  console.log('FARMS:', farms);
  
  const harvests = await manager.query('SELECT id, name, tenant_id, "farmId" FROM harvests');
  console.log('HARVESTS:', harvests);
  
  const plots = await manager.query('SELECT id, name, tenant_id, "farmId" FROM plots');
  console.log('PLOTS:', plots);
  
  await app.close();
}

bootstrap();
