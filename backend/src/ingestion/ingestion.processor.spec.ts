import { Job } from 'bullmq';
import { EventType, IncidentStatus, Severity } from '../incidents/incident.enums';
import { IncidentsService } from '../incidents/incidents.service';
import { IngestionProcessor } from './ingestion.processor';
import { IngestionJob } from './ingestion.types';

describe('IngestionProcessor', () => {
  let incidents: jest.Mocked<IncidentsService>;
  let processor: IngestionProcessor;

  beforeEach(() => {
    incidents = {
      openCase: jest.fn(),
      applyStatusEvent: jest.fn(),
    } as unknown as jest.Mocked<IncidentsService>;
    processor = new IngestionProcessor(incidents);
  });

  it('routes an open job to openCase', async () => {
    const job = {
      data: {
        kind: 'open',
        id: 'abc',
        deviceId: 'CAM-001',
        location: 'Sheikh Zayed Road',
        eventType: EventType.ACCIDENT,
        severity: Severity.HIGH,
        occurredAt: '2026-06-01T10:30:00Z',
      } satisfies IngestionJob,
    } as Job<IngestionJob>;

    await processor.process(job);

    expect(incidents.openCase).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'abc', occurredAt: new Date('2026-06-01T10:30:00Z') }),
    );
  });

  it('routes a status job to applyStatusEvent', async () => {
    const job = {
      data: {
        kind: 'status',
        id: 'abc',
        status: IncidentStatus.RESOLVED,
        occurredAt: '2026-06-01T11:00:00Z',
      } satisfies IngestionJob,
    } as Job<IngestionJob>;

    await processor.process(job);

    expect(incidents.applyStatusEvent).toHaveBeenCalledWith(
      'abc',
      IncidentStatus.RESOLVED,
      new Date('2026-06-01T11:00:00Z'),
    );
  });
});
