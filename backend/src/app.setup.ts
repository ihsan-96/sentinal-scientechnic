import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

export function configureApp(app: INestApplication, corsOrigin: string): void {
  app.setGlobalPrefix('api');
  app.enableCors({ origin: corsOrigin.split(',').map((o) => o.trim()) });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
}
