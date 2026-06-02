import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from 'nestjs-pino';
import { CacheModule } from './cache/cache.module';
import { validateEnv } from './config/env.validation';
import { DbModule } from './db/db.module';
import { IncidentsModule } from './incidents/incidents.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { RealtimeModule } from './realtime/realtime.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('LOG_LEVEL'),
          transport:
            process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
        },
      }),
    }),
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.getOrThrow<string>('REDIS_HOST'),
          port: config.getOrThrow<number>('REDIS_PORT'),
        },
      }),
    }),
    DbModule,
    CacheModule,
    IncidentsModule,
    IngestionModule,
    StatsModule,
    RealtimeModule,
    MaintenanceModule,
  ],
})
export class AppModule {}
