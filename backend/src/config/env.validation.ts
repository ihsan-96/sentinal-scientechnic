import { plainToInstance, Type } from 'class-transformer';
import { IsInt, IsString, Min, validateSync } from 'class-validator';

class EnvVars {
  @Type(() => Number)
  @IsInt()
  PORT = 4000;

  @IsString()
  CORS_ORIGIN = 'http://localhost:5173';

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  REDIS_HOST = 'localhost';

  @Type(() => Number)
  @IsInt()
  REDIS_PORT = 6379;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  STATS_CACHE_TTL_SECONDS = 10;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  INGESTION_CONCURRENCY = 10;

  @IsString()
  LOG_LEVEL = 'info';
}

export function validateEnv(config: Record<string, unknown>): EnvVars {
  const validated = plainToInstance(EnvVars, config);
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Invalid environment variables:\n${errors.toString()}`);
  }
  return validated;
}
