import { Controller, Sse } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { IncidentMessage, IncidentStreamService } from './incident-stream.service';

@ApiTags('stream')
@Controller('stream')
export class IncidentStreamController {
  constructor(private readonly stream: IncidentStreamService) {}

  @Sse()
  @ApiOperation({ summary: 'Server-Sent Events: incidents.changed / incidents.cleared' })
  subscribe(): Observable<IncidentMessage> {
    return this.stream.asObservable();
  }
}
