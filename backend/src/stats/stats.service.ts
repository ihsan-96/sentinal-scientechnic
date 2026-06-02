import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { and, count, gte, lte, SQL, sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { RedisCacheService } from '../cache/redis-cache.service';
import { DB, Database } from '../db/db.module';
import { incidents } from '../db/schema';
import { EventType, IncidentStatus, Severity } from '../incidents/incident.enums';
import { IncidentEvents } from '../incidents/incident.events';
import { Bucket, TimeseriesQueryDto } from './dto/timeseries-query.dto';
import { StatsQueryDto } from './dto/stats-query.dto';
import { STATS_CACHE_KEY as CACHE_KEY } from './stats.constants';

export interface IncidentStats {
  total: number;
  open: number;
  resolved: number;
  bySeverity: Record<Severity, number>;
  byStatus: Record<IncidentStatus, number>;
  byEventType: Record<EventType, number>;
}

export interface TimeseriesPoint {
  t: string;
  opened: number;
  resolved: number;
  active: number;
  bySeverity: Record<Severity, number>;
}

const STRIDE: Record<Bucket, { sql: string; ms: number }> = {
  [Bucket.MINUTE]: { sql: '1 minute', ms: 60_000 },
  [Bucket.FIVE_MINUTES]: { sql: '5 minutes', ms: 300_000 },
  [Bucket.FIFTEEN_MINUTES]: { sql: '15 minutes', ms: 900_000 },
  [Bucket.HOUR]: { sql: '1 hour', ms: 3_600_000 },
  [Bucket.SIX_HOURS]: { sql: '6 hours', ms: 21_600_000 },
  [Bucket.DAY]: { sql: '1 day', ms: 86_400_000 },
};
const MAX_POINTS = 2000;
const zeroSeverity = (): Record<Severity, number> => ({ LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 });

@Injectable()
export class StatsService {
  private readonly ttl: number;

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly cache: RedisCacheService,
    config: ConfigService,
  ) {
    this.ttl = config.getOrThrow<number>('STATS_CACHE_TTL_SECONDS');
  }

  async getSummary(query: StatsQueryDto): Promise<IncidentStats> {
    const where = this.windowWhere(query.from, query.to);
    if (where) return this.compute(where); // windowed → computed live (indexed)

    const cached = await this.cache.get<IncidentStats>(CACHE_KEY);
    if (cached) return cached;
    const stats = await this.compute(undefined);
    await this.cache.set(CACHE_KEY, stats, this.ttl);
    return stats;
  }

  @OnEvent(IncidentEvents.Created)
  @OnEvent(IncidentEvents.Updated)
  @OnEvent(IncidentEvents.Cleared)
  invalidate(): Promise<void> {
    return this.cache.del(CACHE_KEY);
  }

  async getTimeseries(query: TimeseriesQueryDto) {
    const { sql: stride, ms } = STRIDE[query.bucket];
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : new Date();

    const opened = await this.bucketRows(stride, 'incidents', from, to, true);
    const resolved = await this.bucketRows(stride, 'incident_events', from, to, false);
    const baseline = from ? await this.netOpenBefore(from) : 0;

    return { bucket: query.bucket, points: this.buildPoints(opened, resolved, baseline, from, to, ms) };
  }

  private windowWhere(from?: string, to?: string): SQL | undefined {
    const conditions: SQL[] = [];
    if (from) conditions.push(gte(incidents.occurredAt, new Date(from)));
    if (to) conditions.push(lte(incidents.occurredAt, new Date(to)));
    return conditions.length ? and(...conditions) : undefined;
  }

  private async compute(where: SQL | undefined): Promise<IncidentStats> {
    const [bySeverity, byStatus, byEventType] = await Promise.all([
      this.groupCount(incidents.severity, Severity, where),
      this.groupCount(incidents.status, IncidentStatus, where),
      this.groupCount(incidents.eventType, EventType, where),
    ]);

    const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
    return {
      total,
      open: byStatus[IncidentStatus.OPEN],
      resolved: byStatus[IncidentStatus.RESOLVED],
      bySeverity,
      byStatus,
      byEventType,
    };
  }

  private async groupCount<T extends string>(
    column: PgColumn,
    values: Record<string, T>,
    where: SQL | undefined,
  ): Promise<Record<T, number>> {
    const rows = await this.db
      .select({ key: column, value: count() })
      .from(incidents)
      .where(where)
      .groupBy(column);

    const result = Object.fromEntries(Object.values(values).map((v) => [v, 0])) as Record<T, number>;
    for (const row of rows) result[row.key as T] = row.value;
    return result;
  }

  /** Per-bucket counts via date_bin (incidents adds a severity breakdown). */
  private async bucketRows(
    stride: string,
    table: 'incidents' | 'incident_events',
    from: Date | undefined,
    to: Date,
    withSeverity: boolean,
  ): Promise<Array<{ bucket: string; severity?: Severity; c: number }>> {
    const conditions = [sql`occurred_at <= ${to.toISOString()}::timestamptz`];
    if (from) conditions.push(sql`occurred_at >= ${from.toISOString()}::timestamptz`);
    if (table === 'incident_events') conditions.push(sql`status = 'RESOLVED'`);
    const where = sql.join(conditions, sql` AND `);
    const bucket = sql`date_bin(${stride}::interval, occurred_at, 'epoch'::timestamptz)`;
    const source = table === 'incidents' ? sql`incidents` : sql`incident_events`;
    const select = withSeverity
      ? sql`${bucket} AS bucket, severity, count(*)::int AS c`
      : sql`${bucket} AS bucket, count(*)::int AS c`;
    const groupBy = withSeverity ? sql`bucket, severity` : sql`bucket`;

    return (await this.db.execute(
      sql`SELECT ${select} FROM ${source} WHERE ${where} GROUP BY ${groupBy}`,
    )) as unknown as Array<{ bucket: string; severity?: Severity; c: number }>;
  }

  private async netOpenBefore(from: Date): Promise<number> {
    const before = from.toISOString();
    const [opened] = (await this.db.execute(
      sql`SELECT count(*)::int AS c FROM incidents WHERE occurred_at < ${before}::timestamptz`,
    )) as unknown as Array<{ c: number }>;
    const [resolved] = (await this.db.execute(
      sql`SELECT count(*)::int AS c FROM incident_events WHERE status = 'RESOLVED' AND occurred_at < ${before}::timestamptz`,
    )) as unknown as Array<{ c: number }>;
    return opened.c - resolved.c;
  }

  private buildPoints(
    openedRows: Array<{ bucket: string; severity?: Severity; c: number }>,
    resolvedRows: Array<{ bucket: string; c: number }>,
    baseline: number,
    from: Date | undefined,
    to: Date,
    ms: number,
  ): TimeseriesPoint[] {
    const opened = new Map<number, { opened: number; bySeverity: Record<Severity, number> }>();
    for (const row of openedRows) {
      const key = new Date(row.bucket).getTime();
      const entry = opened.get(key) ?? { opened: 0, bySeverity: zeroSeverity() };
      entry.opened += row.c;
      if (row.severity) entry.bySeverity[row.severity] += row.c;
      opened.set(key, entry);
    }
    const resolved = new Map<number, number>();
    for (const row of resolvedRows) resolved.set(new Date(row.bucket).getTime(), row.c);

    const keys = [...opened.keys(), ...resolved.keys()];
    if (!from && keys.length === 0) return [];

    const floor = (t: number) => Math.floor(t / ms) * ms;
    let start = floor(from ? from.getTime() : Math.min(...keys));
    const end = floor(to.getTime());
    if ((end - start) / ms > MAX_POINTS) start = end - MAX_POINTS * ms;

    const points: TimeseriesPoint[] = [];
    let active = baseline;
    for (let t = start; t <= end; t += ms) {
      const o = opened.get(t);
      const r = resolved.get(t) ?? 0;
      active += (o?.opened ?? 0) - r;
      points.push({
        t: new Date(t).toISOString(),
        opened: o?.opened ?? 0,
        resolved: r,
        active,
        bySeverity: o?.bySeverity ?? zeroSeverity(),
      });
    }
    return points;
  }
}
