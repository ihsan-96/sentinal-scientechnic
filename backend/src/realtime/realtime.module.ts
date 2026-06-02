import { Module } from '@nestjs/common';
import { IncidentStreamController } from './incident-stream.controller';
import { IncidentStreamService } from './incident-stream.service';

@Module({
  controllers: [IncidentStreamController],
  providers: [IncidentStreamService],
})
export class RealtimeModule {}
