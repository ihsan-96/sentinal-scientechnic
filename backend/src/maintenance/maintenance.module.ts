import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { IncidentsModule } from '../incidents/incidents.module';
import { INGESTION_QUEUE } from '../ingestion/ingestion.constants';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';

@Module({
  imports: [IncidentsModule, BullModule.registerQueue({ name: INGESTION_QUEUE })],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
})
export class MaintenanceModule {}
