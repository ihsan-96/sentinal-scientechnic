import { sql } from 'drizzle-orm';
import { index, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const eventTypeEnum = pgEnum('event_type', [
  'ACCIDENT',
  'CONGESTION',
  'ROAD_CLOSURE',
  'HAZARD',
  'BREAKDOWN',
]);

export const severityEnum = pgEnum('severity', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const statusEnum = pgEnum('status', [
  'OPEN',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'RESOLVED',
]);

export const incidents = pgTable(
  'incidents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deviceId: varchar('device_id', { length: 64 }).notNull(),
    location: varchar('location', { length: 256 }).notNull(),
    eventType: eventTypeEnum('event_type').notNull(),
    severity: severityEnum('severity').notNull(),
    status: statusEnum('status').notNull().default('OPEN'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    lastEventAt: timestamp('last_event_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('incidents_device_id_idx').on(table.deviceId),
    index('incidents_severity_idx').on(table.severity),
    index('incidents_status_idx').on(table.status),
    index('incidents_occurred_at_idx').on(table.occurredAt.desc()),
    index('incidents_severity_occurred_at_idx').on(table.severity, table.occurredAt),
    index('incidents_status_occurred_at_idx').on(table.status, table.occurredAt),
  ],
);

export const incidentEvents = pgTable(
  'incident_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    incidentId: uuid('incident_id')
      .notNull()
      .references(() => incidents.id, { onDelete: 'cascade' }),
    status: statusEnum('status').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('incident_events_incident_id_idx').on(table.incidentId),
    index('incident_events_occurred_at_idx').on(table.occurredAt),
    index('incident_events_status_occurred_at_idx').on(table.status, table.occurredAt),
  ],
);

export type IncidentRow = typeof incidents.$inferSelect;
export type NewIncidentRow = typeof incidents.$inferInsert;
export type IncidentEventRow = typeof incidentEvents.$inferSelect;
export type NewIncidentEventRow = typeof incidentEvents.$inferInsert;
