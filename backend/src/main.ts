import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.useLogger(app.get(Logger));
  app.useBodyParser('json', { limit: '5mb' }); // batches up to 1000 incidents (~200 KB)
  configureApp(app, config.getOrThrow<string>('CORS_ORIGIN'));

  const swagger = new DocumentBuilder()
    .setTitle('Traffic Incident API')
    .setDescription('Ingest, retrieve, update and summarize traffic incidents')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));

  await app.listen(config.getOrThrow<number>('PORT'));
}

bootstrap();
