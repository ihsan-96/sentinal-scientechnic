import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, lte, SQL } from 'drizzle-orm';
import { DB, Database } from '../db/db.module';
import {
  IncidentEventRow,
  incidentEvents,
  IncidentRow,
  incidents,
  NewIncidentRow,
} from '../db/schema';
import { Paginated } from '../common/pagination';
import { IncidentStatus } from './incident.enums';
import { QueryIncidentsDto } from './dto/query-incidents.dto';

@Injectable()
export class IncidentsRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Idempotent: returns the created case, or null if the id already existed. */
  async openCase(values: NewIncidentRow): Promise<IncidentRow | null> {
    return this.db.transaction(async (tx) => {
      const [incident] = await tx
        .insert(incidents)
        .values(values)
        .onConflictDoNothing({ target: incidents.id })
        .returning();
      if (!incident) return null;
      await tx.insert(incidentEvents).values({
        incidentId: incident.id,
        status: incident.status,
        occurredAt: incident.occurredAt,
      });
      return incident;
    });
  }

  /**
   * Appends a status event and recomputes the current status: the event with the
   * latest `occurredAt` wins, so out-of-order arrivals are recorded but never regress
   * the case. Returns the case, or null if it does not exist yet.
   */
  async applyStatusEvent(
    id: string,
    status: IncidentStatus,
    occurredAt: Date,
  ): Promise<IncidentRow | null> {
    return this.db.transaction(async (tx) => {
      const existing = await tx.query.incidents.findFirst({ where: eq(incidents.id, id) });
      if (!existing) return null;

      await tx.insert(incidentEvents).values({ incidentId: id, status, occurredAt });

      if (occurredAt <= existing.lastEventAt) return existing;

      const [updated] = await tx
        .update(incidents)
        .set({ status, lastEventAt: occurredAt, updatedAt: new Date() })
        .where(eq(incidents.id, id))
        .returning();
      return updated;
    });
  }

  findById(id: string): Promise<IncidentRow | undefined> {
    return this.db.query.incidents.findFirst({ where: eq(incidents.id, id) });
  }

  findEvents(incidentId: string): Promise<IncidentEventRow[]> {
    return this.db.query.incidentEvents.findMany({
      where: eq(incidentEvents.incidentId, incidentId),
      orderBy: asc(incidentEvents.occurredAt),
    });
  }

  async deleteAll(): Promise<number> {
    const [{ total }] = await this.db.select({ total: count() }).from(incidents);
    await this.db.delete(incidents);
    return total;
  }

  async findMany(query: QueryIncidentsDto): Promise<Paginated<IncidentRow>> {
    const where = this.buildWhere(query);
    const offset = (query.page - 1) * query.pageSize;

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(incidents)
        .where(where)
        .orderBy(desc(incidents.occurredAt))
        .limit(query.pageSize)
        .offset(offset),
      this.db.select({ total: count() }).from(incidents).where(where),
    ]);

    return { data, page: query.page, pageSize: query.pageSize, total };
  }

  private buildWhere(query: QueryIncidentsDto): SQL | undefined {
    const conditions: SQL[] = [];
    if (query.severity) conditions.push(eq(incidents.severity, query.severity));
    if (query.status) conditions.push(eq(incidents.status, query.status));
    if (query.deviceId) conditions.push(eq(incidents.deviceId, query.deviceId));
    if (query.from) conditions.push(gte(incidents.occurredAt, new Date(query.from)));
    if (query.to) conditions.push(lte(incidents.occurredAt, new Date(query.to)));
    return conditions.length ? and(...conditions) : undefined;
  }
}
