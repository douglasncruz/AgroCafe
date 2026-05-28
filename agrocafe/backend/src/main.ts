import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security: Helmet adds secure HTTP headers (XSS protection, anti-clickjacking)
  app.use(helmet());
  
  // Enable CORS safely
  app.enableCors({
    origin: true, // Permitir todas as origens para garantir conectividade entre Vercel e Render
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Aumentar o limite de payload para uploads de Base64
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
