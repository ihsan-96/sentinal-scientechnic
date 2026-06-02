import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { uuidv7 } from '../src/common/uuidv7';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { EventType, IncidentStatus, Severity } from '../src/incidents/incident.enums';
import { IncidentsService } from '../src/incidents/incidents.service';
import { MaintenanceService } from '../src/maintenance/maintenance.service';

describe('Incidents API (e2e)', () => {
  let app: INestApplication;
  let service: IncidentsService;
  const caseA = uuidv7();
  const caseB = uuidv7();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app, '*');
    await app.init();

    service = app.get(IncidentsService);
    await app.get(MaintenanceService).clearAll();

    await service.openCase({
      id: caseA,
      deviceId: 'CAM-001',
      location: 'Sheikh Zayed Road',
      eventType: EventType.ACCIDENT,
      severity: Severity.HIGH,
      occurredAt: new Date('2026-06-02T10:00:00Z'),
    });
    await service.openCase({
      id: caseB,
      deviceId: 'CAM-002',
      location: 'Al Khail Road',
      eventType: EventType.CONGESTION,
      severity: Severity.LOW,
      occurredAt: new Date('2026-06-02T11:00:00Z'),
    });
  });

  afterAll(async () => {
    await app.get(MaintenanceService).clearAll();
    await app.close();
  });

  it('lists one row per case', async () => {
    const res = await request(app.getHttpServer()).get('/api/incidents?deviceId=CAM-001').expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].severity).toBe('HIGH');
  });

  it('keeps the latest-by-event-time status when events arrive out of order', async () => {
    // RESOLVED at 10:30, then a LATE ACKNOWLEDGED at 10:10 — must not regress.
    await service.applyStatusEvent(caseA, IncidentStatus.RESOLVED, new Date('2026-06-02T10:30:00Z'));
    await service.applyStatusEvent(caseA, IncidentStatus.ACKNOWLEDGED, new Date('2026-06-02T10:10:00Z'));

    const res = await request(app.getHttpServer()).get(`/api/incidents/${caseA}`).expect(200);
    expect(res.body.status).toBe('RESOLVED');
    expect(res.body.events.map((e: { status: string }) => e.status)).toEqual([
      'OPEN',
      'ACKNOWLEDGED',
      'RESOLVED',
    ]);
  });

  it('applies an operator status update immediately', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/incidents/${caseB}/status`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);
    expect(res.body.status).toBe('IN_PROGRESS');
  });

  it('summarizes case counts', async () => {
    const res = await request(app.getHttpServer()).get('/api/stats').expect(200);
    expect(res.body.total).toBe(2);
    expect(res.body.resolved).toBe(1);
  });

  it('returns a windowed time-series with buckets', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/stats/timeseries?from=2026-06-02T00:00:00Z&to=2026-06-02T23:59:59Z&bucket=hour')
      .expect(200);
    expect(res.body.bucket).toBe('hour');
    const opened = res.body.points.reduce((sum: number, p: { opened: number }) => sum + p.opened, 0);
    expect(opened).toBe(2);
  });

  // Last: this enqueues an async open that the worker persists, so it runs after the
  // deterministic count assertions above.
  it('accepts an open and returns a generated id', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/incidents')
      .send({
        deviceId: 'CAM-009',
        location: 'Emirates Road',
        eventType: 'HAZARD',
        severity: 'MEDIUM',
        timestamp: '2026-06-02T12:00:00Z',
      })
      .expect(202);
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
