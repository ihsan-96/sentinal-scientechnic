import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException } from '@nestjs/common';
import { IncidentRow } from '../db/schema';
import { EventType, IncidentStatus, Severity } from './incident.enums';
import { IncidentEvents } from './incident.events';
import { IncidentsRepository } from './incidents.repository';
import { IncidentsService } from './incidents.service';

const sampleRow: IncidentRow = {
  id: '11111111-1111-1111-1111-111111111111',
  deviceId: 'CAM-001',
  location: 'Sheikh Zayed Road',
  eventType: EventType.ACCIDENT,
  severity: Severity.HIGH,
  status: IncidentStatus.OPEN,
  occurredAt: new Date('2026-06-01T10:30:00Z'),
  lastEventAt: new Date('2026-06-01T10:30:00Z'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('IncidentsService', () => {
  let repository: jest.Mocked<IncidentsRepository>;
  let events: jest.Mocked<EventEmitter2>;
  let service: IncidentsService;

  beforeEach(() => {
    repository = {
      openCase: jest.fn(),
      applyStatusEvent: jest.fn(),
      findById: jest.fn(),
      findEvents: jest.fn(),
      findMany: jest.fn(),
      deleteAll: jest.fn(),
    } as unknown as jest.Mocked<IncidentsRepository>;
    events = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
    service = new IncidentsService(repository, events);
  });

  it('emits created when a new case is opened', async () => {
    repository.openCase.mockResolvedValue(sampleRow);
    await service.openCase({
      id: sampleRow.id,
      deviceId: 'CAM-001',
      location: 'Sheikh Zayed Road',
      eventType: EventType.ACCIDENT,
      severity: Severity.HIGH,
      occurredAt: new Date('2026-06-01T10:30:00Z'),
    });
    expect(events.emit).toHaveBeenCalledWith(IncidentEvents.Created, expect.anything());
  });

  it('does not emit created when the open is a duplicate (idempotent)', async () => {
    repository.openCase.mockResolvedValue(null);
    await service.openCase({
      id: sampleRow.id,
      deviceId: 'CAM-001',
      location: 'Sheikh Zayed Road',
      eventType: EventType.ACCIDENT,
      severity: Severity.HIGH,
      occurredAt: new Date('2026-06-01T10:30:00Z'),
    });
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('emits updated when a status event is applied', async () => {
    repository.applyStatusEvent.mockResolvedValue({ ...sampleRow, status: IncidentStatus.RESOLVED });
    const result = await service.applyStatusEvent(sampleRow.id, IncidentStatus.RESOLVED, new Date());
    expect(result.status).toBe(IncidentStatus.RESOLVED);
    expect(events.emit).toHaveBeenCalledWith(IncidentEvents.Updated, expect.anything());
  });

  it('throws when a status event targets a missing case', async () => {
    repository.applyStatusEvent.mockResolvedValue(null);
    await expect(
      service.applyStatusEvent('missing', IncidentStatus.RESOLVED, new Date()),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns a case with its timeline', async () => {
    repository.findById.mockResolvedValue(sampleRow);
    repository.findEvents.mockResolvedValue([]);
    const result = await service.getById(sampleRow.id);
    expect(result).toMatchObject({ id: sampleRow.id, events: [] });
  });

  it('throws when fetching a missing case', async () => {
    repository.findById.mockResolvedValue(undefined);
    await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
  });
});
