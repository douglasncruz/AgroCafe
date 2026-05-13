import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security: Helmet adds secure HTTP headers (XSS protection, anti-clickjacking)
  app.use(helmet());
  
  // Enable CORS safely
  app.enableCors({
    origin: true, // Em produção, você pode trocar true pela URL da Vercel para mais segurança
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
