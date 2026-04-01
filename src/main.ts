import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['*', 'http://localhost:3001'], // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

    credentials: true, // Allow credentials
  });
  await app.listen(process.env.PORT ?? 3000, () => {
    console.log('connected on port', process.env.PORT);
  });
}
bootstrap();
