import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { IncidentsModule } from '../incidents/incidents.module';
import { IngestionController } from './ingestion.controller';
import { IngestionProcessor } from './ingestion.processor';
import { IngestionProducer } from './ingestion.producer';
import { INGESTION_QUEUE } from './ingestion.constants';

@Module({
  imports: [IncidentsModule, BullModule.registerQueue({ name: INGESTION_QUEUE })],
  controllers: [IngestionController],
  providers: [IngestionProducer, IngestionProcessor],
})
export class IngestionModule {}
