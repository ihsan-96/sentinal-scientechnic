// Documentation content for the in-app Architecture Guide. Mirrors docs/ARCHITECTURE.md,
// docs/SCHEMA.md, and README.md. The guide describes the backend system; the simulator is
// only the tool that renders it.

/* ------------------------------------------------------------------ */
/* Architecture map graph                                              */
/* ------------------------------------------------------------------ */

export type Dot = 'accent' | 'store' | 'edge-svc' | 'client';

export interface MapNode {
  id: string;
  name: string;
  tag: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  dot?: Dot;
  blurb: string;
}

export interface MapEdge {
  from: string;
  to: string;
  /**
   * ingest/fanout  → solid primary pipeline (device → … → dashboard)
   * read           → dashboard pulls list/stats THROUGH the API (dashed)
   * read-res       → the API serves rows/stats back to the dashboard
   * write          → synchronous operator action (PATCH status), no queue
   */
  kind: 'ingest' | 'fanout' | 'read' | 'read-res' | 'write';
  /** Perpendicular arc offset, to separate edges that share endpoints. */
  bow?: number;
}

/** A labelled container drawn behind a set of nodes (e.g. the one Nest process). */
export interface MapGroup {
  id: string;
  label: string;
  nodeIds: string[];
}

// Production topology. The four nodes inside the GROUPS['nest'] box all run in
// ONE NestJS process (see GROUPS); queue/db/cache are external infra. viewBox 970 x 472.
export const NODES: MapNode[] = [
  {
    id: 'dev',
    name: 'Roadside Devices',
    tag: 'PRODUCERS',
    x: 30,
    y: 150,
    dot: 'client',
    blurb:
      'Cameras and sensors report two kinds of event to the ingestion API: an OPEN that starts a case, and later status events. They POST over plain HTTP and get an HTTP 202 Accepted back immediately.',
  },
  {
    id: 'queue',
    name: 'BullMQ Queue',
    tag: 'REDIS',
    x: 250,
    y: 10,
    dot: 'store',
    blurb:
      'A Redis-backed BullMQ queue (incident-ingestion) decouples request handling from DB writes and absorbs bursts. Status jobs retry with backoff, so a status event that arrives before its OPEN commits is retried until the case exists.',
  },
  {
    id: 'api',
    name: 'NestJS API',
    tag: 'HTTP API',
    x: 250,
    y: 230,
    dot: 'accent',
    blurb:
      'The HTTP entry point: NestJS controllers. They validate DTOs, accept ingestion (return HTTP 202, then enqueue), and serve the read endpoints: list, detail + timeline, stats, and time-series. The synchronous operator status PATCH lands here too. The worker, domain-event bus, and SSE stream are their own nodes in this process, which is what the dashed box marks.',
  },
  {
    id: 'worker',
    name: 'Worker',
    tag: 'QUEUE CONSUMER',
    x: 470,
    y: 118,
    dot: 'accent',
    blurb:
      'The BullMQ consumer (IngestionProcessor) runs in-process inside the backend container at concurrency 10. It drains the queue and applies each job: an OPEN creates the case (idempotent, on-conflict-do-nothing); a status event appends to the timeline and recomputes the current status by latest event-time.',
  },
  {
    id: 'events',
    name: 'Domain Events',
    tag: 'IN-PROCESS BUS',
    x: 470,
    y: 370,
    dot: 'accent',
    blurb:
      'NestJS EventEmitter2. After a write the service emits incident.created / incident.updated; two decoupled listeners react: one pushes over SSE (coalesced), one invalidates the stats cache. This is the seam where audit and notifications, or an external broker like Kafka at scale, plug in without touching the write path.',
  },
  {
    id: 'sse',
    name: 'SSE /stream',
    tag: 'SERVER → CLIENT',
    x: 250,
    y: 370,
    dot: 'edge-svc',
    blurb:
      'One long-lived HTTP response. The listener buffers change events for 500 ms (bufferTime) and pushes a coalesced { count }, at most ~2 messages/sec, so a 10k-case run never floods clients. Plain GET, native EventSource auto-reconnect, no handshake.',
  },
  {
    id: 'db',
    name: 'PostgreSQL',
    tag: 'CASES + EVENTS',
    x: 760,
    y: 150,
    dot: 'store',
    blurb:
      'Two tables via Drizzle: incidents (one row per case, with a denormalised current status) and incident_events (an append-only timeline). Composite indexes on occurred_at back the list filters and the date_bin time-series.',
  },
  {
    id: 'cache',
    name: 'Redis Cache',
    tag: 'STATS SUMMARY',
    x: 760,
    y: 360,
    dot: 'store',
    blurb:
      'The all-time stats summary aggregates the whole table, so it is cached under stats:summary and invalidated on every write via the domain event. Windowed stats and time-series are always computed live (a sliding window would never hit a cache key).',
  },
  {
    id: 'ui',
    name: 'React Dashboard',
    tag: 'OPERATORS',
    x: 30,
    y: 380,
    dot: 'client',
    blurb:
      'The operator UI. TanStack Query reads lists, detail+timeline, and stats/time-series over REST (through the API to Postgres) and holds one SSE connection; on each coalesced nudge it refetches the current view. Operators also resolve cases here via a synchronous PATCH. The dashboard never receives incidents directly over SSE.',
  },
];

export const EDGES: MapEdge[] = [
  // ingest (solid): the device-ingestion pipeline
  { from: 'dev', to: 'api', kind: 'ingest' },
  { from: 'api', to: 'queue', kind: 'ingest' },
  { from: 'queue', to: 'worker', kind: 'ingest' },
  { from: 'worker', to: 'db', kind: 'ingest' },
  { from: 'worker', to: 'events', kind: 'ingest' },
  // events fan-out
  { from: 'events', to: 'sse', kind: 'fanout' },
  { from: 'events', to: 'cache', kind: 'fanout' },
  { from: 'sse', to: 'ui', kind: 'fanout' },
  // read path (dashed, two-way): request out, response back; the live pulse oscillates
  { from: 'ui', to: 'api', kind: 'read', bow: 30 },
  { from: 'api', to: 'db', kind: 'read', bow: -22 },
  { from: 'api', to: 'cache', kind: 'read', bow: -40 },
  // synchronous operator write path (PATCH status), no queue
  { from: 'ui', to: 'api', kind: 'write', bow: 64 },
  { from: 'api', to: 'db', kind: 'write', bow: 30 },
];

export const GROUPS: MapGroup[] = [
  { id: 'nest', label: 'NestJS · ONE CONTAINER', nodeIds: ['api', 'worker', 'events', 'sse'] },
];

// 100k-device scale-out topology. viewBox 1140 x 520.
export const SCALE_NODES: MapNode[] = [
  { id: 'devs', name: '100k Devices', tag: 'PRODUCERS', x: 24, y: 230, dot: 'client',
    blurb: 'Two orders of magnitude more producers, on the same OPEN/status contract, just far more of it.' },
  { id: 'lb', name: 'API Gateway / LB', tag: 'INGRESS', x: 210, y: 230, dot: 'accent',
    blurb: 'Spreads ingestion and SSE across stateless API instances. SSE needs no sticky sessions.' },
  { id: 'api1', name: 'API instance', tag: 'STATELESS', x: 396, y: 120, dot: 'accent',
    blurb: 'Horizontally scaled NestJS; nothing is held in process except transient SSE connections.' },
  { id: 'api2', name: 'API instance', tag: 'STATELESS', x: 396, y: 330, dot: 'accent',
    blurb: 'Add instances behind the gateway to scale ingestion and fan-out linearly.' },
  { id: 'kafka', name: 'Kafka', tag: 'PARTITION BY DEVICE', x: 582, y: 230, dot: 'store',
    blurb: 'Replaces BullMQ when you need a durable, replayable, partitioned log. Partition by deviceId to preserve per-device ordering; persistence and analytics consumers scale independently.' },
  { id: 'cw', name: 'Persistence', tag: 'CONSUMER GROUP', x: 768, y: 96, dot: 'accent',
    blurb: 'Batch-inserts into the time-partitioned database; concurrency scales with partitions.' },
  { id: 'aw', name: 'Rollup Consumer', tag: 'AGGREGATES', x: 768, y: 230, dot: 'accent',
    blurb: 'Maintains pre-aggregated time-buckets so reporting reads never scan the hot tables.' },
  { id: 'ps', name: 'Redis Pub/Sub', tag: 'SSE FAN-OUT', x: 768, y: 364, dot: 'edge-svc',
    blurb: 'Re-publishes domain events to every API instance so each pushes to its own SSE clients. This is the cross-instance fan-out a single process can’t do alone.' },
  { id: 'pg', name: 'PostgreSQL', tag: 'PARTITIONED + REPLICAS', x: 954, y: 96, dot: 'store',
    blurb: 'Range-partitioned by time (pg_partman + pg_cron for retention) with read replicas serving list/stats queries.' },
  { id: 'ts', name: 'TimescaleDB', tag: 'TIME-SERIES', x: 954, y: 230, dot: 'store',
    blurb: 'Hypertables + continuous aggregates maintain bucket rollups incrementally, and native compression shrinks old chunks, so charts read rollups instead of scanning millions of rows.' },
  { id: 'dash', name: 'Dashboards', tag: 'OPERATORS', x: 954, y: 364, dot: 'client',
    blurb: 'Many concurrent operators, each on a long-lived SSE connection to whichever instance the gateway picked.' },
];

export const SCALE_EDGES: MapEdge[] = [
  { from: 'devs', to: 'lb', kind: 'ingest' },
  { from: 'lb', to: 'api1', kind: 'ingest' },
  { from: 'lb', to: 'api2', kind: 'ingest' },
  { from: 'api1', to: 'kafka', kind: 'ingest' },
  { from: 'api2', to: 'kafka', kind: 'ingest' },
  { from: 'kafka', to: 'cw', kind: 'ingest' },
  { from: 'kafka', to: 'aw', kind: 'ingest' },
  { from: 'cw', to: 'pg', kind: 'ingest' },
  { from: 'aw', to: 'ts', kind: 'ingest' },
  { from: 'kafka', to: 'ps', kind: 'fanout' },
  { from: 'ps', to: 'api1', kind: 'read', bow: 30 },
  { from: 'ps', to: 'api2', kind: 'read', bow: -30 },
  { from: 'api2', to: 'dash', kind: 'fanout', bow: 30 },
];

/* ------------------------------------------------------------------ */
/* Design decisions (main only, each with a forward-looking note)      */
/* ------------------------------------------------------------------ */

export interface Decision {
  id: string;
  title: string;
  problem: string;
  alternatives: string[];
  chosen: string;
  why: string;
  future: string;
}

export const DECISIONS: Decision[] = [
  {
    id: 'case-timeline',
    title: 'Cases + an event timeline',
    problem:
      'A status change is an update to an existing incident, but a naive model creates a brand-new row per status report, and real networks deliver those reports out of order.',
    alternatives: ['One row per status report', 'Mutable status field, no history'],
    chosen:
      'A case row with a denormalised current status, backed by an append-only incident_events log. Current status is derived from the latest event-time (last_event_at), so a late ACKNOWLEDGED after RESOLVED is recorded but never regresses the case.',
    why: 'The denormalised status gives fast filtering and stats; the log gives history and audit; latest-by-event-time makes ingestion order-independent, so retries and reordering are harmless.',
    future: 'Time-partition both tables by occurred_at (monthly) for small indexes and cheap archival.',
  },
  {
    id: 'queue-202',
    title: 'A queue + 202, not a direct DB write',
    problem:
      'Writing to Postgres synchronously on every request couples the API to DB latency and lets a traffic spike overwhelm the database.',
    alternatives: ['Synchronous write then 201', 'DB-side buffering'],
    chosen:
      'The API validates, returns 202 Accepted, and enqueues to BullMQ; the in-process worker drains it into Postgres. The open insert is idempotent (on-conflict-do-nothing) so retries can’t double-create.',
    why: 'Spikes are absorbed by the queue, not the database, and the API stays responsive. Trade-off: reads are eventually consistent, since incidents appear once the worker drains them.',
    future: 'Swap BullMQ for Kafka: a durable, replayable log partitioned by deviceId, with persistence and analytics consumers scaling independently.',
  },
  {
    id: 'sse',
    title: 'SSE over WebSocket and polling',
    problem:
      'The dashboard needs new incidents without a manual refresh, a purely server-to-client push. The client never sends anything over this channel.',
    alternatives: ['REST polling', 'WebSocket'],
    chosen:
      'Server-Sent Events over a plain HTTP GET (native EventSource, auto-reconnect, no handshake).',
    why: 'One push beats N polls, and we use none of WebSocket’s bidirectional/binary machinery. WebSocket would win only if clients streamed to the server, which they don’t. (Full comparison below.)',
    future: 'Across multiple API instances, fan out by publishing domain events over Redis Pub/Sub (or Kafka) so every instance pushes to its own clients.',
  },
  {
    id: 'count-sse',
    title: 'SSE carries a count, not incidents',
    problem:
      'Pushing one SSE message per incident would flood every dashboard during a 10k-case run.',
    alternatives: ['One message per incident', 'Full incident payloads over SSE'],
    chosen:
      'The stream buffers changes for 500 ms (bufferTime) and emits incidents.changed { count }. The client treats it as "something changed, this much" and refetches its current filtered/paginated view.',
    why: 'Clients get a handful of small messages instead of tens of thousands, and the refetch already respects their filters, range, and page, so the list and stats stay the single source of truth.',
    future: 'If even the nudge rate gets high, add client-side throttling/backpressure; the contract stays the same.',
  },
  {
    id: 'postgres',
    title: 'PostgreSQL as the store',
    problem:
      'We need relational integrity, flexible filtered queries, and time-bucketed reporting, without hiding the SQL that performance depends on.',
    alternatives: ['Document store (MongoDB)', 'A dedicated time-series DB from day one'],
    chosen:
      'PostgreSQL via Drizzle (type-safe, SQL-transparent). Composite indexes on occurred_at back list filters and time-series, computed live with the built-in date_bin.',
    why: 'One well-indexed relational store covers cases, the event log and reporting at this scale, and the schema doubles as documentation.',
    future:
      'Do we need TimescaleDB at 100k? Not because of device count. Timescale is a Postgres extension, reached for on reporting cost. Base Postgres (time-partitioned, with read replicas) stays the OLTP source of truth for cases and reads; the pressure point is charting a billion-row event log live. Continuous aggregates and compression keep rollups cheap; hand-rolled rollup tables are the lighter first step. Add it (or rollups) only when live date_bin aggregation exceeds the latency budget.',
  },
  {
    id: 'redis-cache',
    title: 'Caching stats in Redis',
    problem:
      'The all-time summary aggregates the entire table on every dashboard load, which is expensive and repetitive.',
    alternatives: ['Always compute live', 'TTL-only cache (can serve stale)'],
    chosen:
      'Cache only the unwindowed summary under stats:summary and invalidate it on every write via the domain event. Windowed stats and time-series stay live and indexed.',
    why: 'The hot, repeated query is served from memory and is never stale beyond the next read; sliding-window queries (which would never hit a cache key) stay correct and fresh.',
    future: 'Extend caching to hot list queries, and serve reporting from pre-aggregated rollups so reads never touch the write-hot tables.',
  },
  {
    id: 'nestjs',
    title: 'NestJS over plain Express',
    problem:
      'Express is the framework I know best, but this system needs three cross-cutting capabilities (an SSE stream, a queue worker, and a decoupled event bus) wired together cleanly and testably, not bolted onto raw route handlers.',
    alternatives: ['Plain Express', 'Fastify'],
    chosen:
      'NestJS, running on the Express adapter it already uses under the hood (NestExpressApplication). First-class @Sse() for realtime, @nestjs/bullmq @Processor/WorkerHost for the in-process worker, and @nestjs/event-emitter @OnEvent for the domain-event seam, all DI-managed.',
    why: 'These are the parts that are hand-rolled, untyped plumbing in bare Express. Nest isn’t a replacement for Express here; it keeps the Express HTTP layer I’m fluent in and adds modules, lifecycle, and DI on top, so SSE, worker, and events become declarative, unit-testable building blocks.',
    future: 'The same module boundaries are the cut-lines for splitting ingestion / query / realtime / worker into separate deployables.',
  },
  {
    id: 'deploy-split',
    title: 'Backend in one container, dashboard on the edge',
    problem:
      'The two halves have very different runtime needs: one is a long-lived stateful-adjacent server, the other is a static asset bundle. Co-deploying them would couple their lifecycles and waste edge economics.',
    alternatives: ['Serve the SPA from the backend', 'One combined deployable'],
    chosen:
      'The backend (API + worker + SSE) ships as one Docker Compose deployable with Postgres and Redis; the React/Vite dashboard builds to static files served from a CDN/edge, pointed at the backend via VITE_API_URL.',
    why: 'The backend holds a long-lived Node process, DB/Redis connections and live SSE sockets, so it wants one reproducible container. The dashboard has no server runtime: edge hosting is cheap, scales to many operators for free, gives low-latency global delivery, and decouples UI deploys. SSE is plain HTTP, so it stays CDN/proxy-friendly.',
    future: 'Behind a load balancer the backend splits into stateless API instances; the static frontend is unchanged.',
  },
  {
    id: 'validation',
    title: 'Validation at the edge',
    problem:
      'Malformed payloads from devices or operators must be rejected before they reach business logic, and every error should look the same to clients.',
    alternatives: ['Validate inside services', 'Hand-rolled checks per handler'],
    chosen:
      'class-validator DTOs + a global ValidationPipe reject bad requests at the controller boundary; a global exception filter returns one consistent error envelope.',
    why: 'Controllers stay thin and business logic can assume well-formed input; one filter means clients get a single predictable error shape instead of per-handler ad-hoc responses.',
    future: 'The DTOs double as the OpenAPI/Swagger contract, so the validated schema is the published API surface.',
  },
];

export interface TransportRow {
  dimension: string;
  polling: string;
  websocket: string;
  sse: string;
}

export const TRANSPORTS: TransportRow[] = [
  { dimension: 'Latency', polling: 'Up to one poll interval', websocket: 'Instant push', sse: 'Instant push' },
  { dimension: 'Server / network load', polling: 'High: every dashboard re-fetches on a timer even when idle', websocket: 'Low', sse: 'Low: one long-lived response, data only on change' },
  { dimension: 'Directionality', polling: 'Request / response', websocket: 'Bidirectional', sse: 'Server → client (all we need)' },
  { dimension: 'Complexity', polling: 'Trivial but wasteful', websocket: 'Upgrade handshake, separate protocol, sticky sessions to scale', sse: 'Plain GET; native EventSource auto-reconnect; no handshake' },
  { dimension: 'Infra / CDN-friendliness', polling: 'Anywhere', websocket: 'Needs WS-aware proxies / LB', sse: 'Standard HTTP: proxy / CDN / LB friendly' },
];

/* ------------------------------------------------------------------ */
/* Tech stack                                                          */
/* ------------------------------------------------------------------ */

export interface Tech {
  name: string;
  tag: string;
  icon: string; // key into Icons
  role: string;
  why: string;
}

export const TECH: Tech[] = [
  { name: 'NestJS', tag: 'Backend framework', icon: 'Server',
    role: 'Module-per-concern HTTP API: ingestion, incidents, stats, realtime, plus the in-process queue worker.',
    why: 'On top of the Express adapter it already uses, Nest gives first-class @Sse(), @nestjs/bullmq workers and @OnEvent domain events as DI-managed, testable building blocks, the parts that are hand-rolled plumbing in bare Express.' },
  { name: 'PostgreSQL', tag: 'Primary store', icon: 'Database',
    role: 'Stores cases and the append-only event timeline; computes time-series live with date_bin over indexed occurred_at.',
    why: 'Relational integrity, composite indexes, and built-in bucketing, with a clear path to partitioning or TimescaleDB at scale.' },
  { name: 'Drizzle ORM', tag: 'Data access', icon: 'Code',
    role: 'Type-safe, SQL-transparent queries; the schema file is the data-model doc.',
    why: 'Performance depends on the SQL, so we keep it visible. No hidden query magic.' },
  { name: 'BullMQ', tag: 'Job queue', icon: 'Layers',
    role: 'Redis-backed ingestion queue with retry/backoff feeding the in-process worker.',
    why: 'Decouples writes from requests and absorbs spikes; retries make status-before-open and reordering safe.' },
  { name: 'Redis', tag: 'Queue + cache', icon: 'Bolt',
    role: 'Backs the BullMQ queue and caches the all-time stats summary.',
    why: 'One dependency for two jobs, and the substrate for SSE Pub/Sub fan-out at scale.' },
  { name: 'Server-Sent Events', tag: 'Real-time', icon: 'Broadcast',
    role: 'Pushes a coalesced { count } (~2/sec) to every dashboard; clients refetch on the nudge.',
    why: 'The feed is server-to-client only; SSE gives instant push with the least machinery.' },
  { name: 'React + Vite', tag: 'Operator dashboard', icon: 'Cpu',
    role: 'The operator dashboard; TanStack Query for server state and SSE-driven refetch.',
    why: 'Fast dev loop and a clean cache/refetch model that pairs naturally with SSE nudges.' },
  { name: 'Docker Compose', tag: 'Local infra', icon: 'Layers',
    role: 'Runs the backend, PostgreSQL and Redis together; the backend auto-migrates on boot.',
    why: 'One command brings up the whole server side reproducibly; the SPAs deploy separately as static sites.' },
];

/* ------------------------------------------------------------------ */
/* Deployment / hosting                                                */
/* ------------------------------------------------------------------ */

export type Hosting = 'docker' | 'static' | 'managed' | 'external';

export interface DeployItem {
  name: string;
  tech: string;
  hosting: Hosting;
  role: string;
}

export interface DeployTier {
  tier: string;
  note: string;
  items: DeployItem[];
}

export const HOSTING_LABEL: Record<Hosting, string> = {
  docker: 'Docker',
  static: 'Static / CDN',
  managed: 'Managed',
  external: 'External',
};

export const DEPLOY_CURRENT: DeployTier[] = [
  {
    tier: 'Clients & edge',
    note: 'Browser and producers; nothing to operate.',
    items: [
      { name: 'React Dashboard', tech: 'React + Vite SPA', hosting: 'static', role: 'Static bundle on Netlify/Vercel (SPA fallback). Points at the backend via VITE_API_URL.' },
      { name: 'Roadside Devices', tech: 'HTTP clients', hosting: 'external', role: 'Out-of-system producers that POST open/status events.' },
    ],
  },
  {
    tier: 'Application (Docker Compose)',
    note: 'One container does it all.',
    items: [
      { name: 'Backend', tech: 'NestJS, Node 22', hosting: 'docker', role: 'HTTP API + in-process BullMQ worker + SSE stream on port 4000. Auto-migrates the DB on boot. CORS via CORS_ORIGIN.' },
    ],
  },
  {
    tier: 'Data (Docker Compose)',
    note: 'Stateful services with a healthcheck gate.',
    items: [
      { name: 'PostgreSQL 16', tech: 'postgres:16-alpine', hosting: 'docker', role: 'Cases + event timeline. Persistent volume (pgdata), port 5432.' },
      { name: 'Redis 7', tech: 'redis:7-alpine', hosting: 'docker', role: 'Backs the BullMQ queue and the stats cache, port 6379.' },
    ],
  },
];

export const DEPLOY_FUTURE: DeployTier[] = [
  {
    tier: 'Clients & edge',
    note: 'Same contract, many more clients.',
    items: [
      { name: 'Dashboards', tech: 'React SPA on CDN', hosting: 'static', role: 'Many concurrent operators; static hosting scales for free.' },
      { name: 'API Gateway / LB', tech: 'Managed gateway', hosting: 'managed', role: 'Terminates TLS, spreads ingestion + SSE across stateless API instances (no sticky sessions).' },
    ],
  },
  {
    tier: 'Application (orchestrated, K8s)',
    note: 'Stateless, scaled per workload.',
    items: [
      { name: 'API instances ×N', tech: 'NestJS containers', hosting: 'docker', role: 'Horizontally scaled; hold only transient SSE connections.' },
      { name: 'Persistence consumers', tech: 'Worker deployment', hosting: 'docker', role: 'Batch-insert from Kafka into partitioned Postgres; scale with partitions.' },
      { name: 'Rollup / analytics consumer', tech: 'Worker deployment', hosting: 'docker', role: 'Maintains time-bucket aggregates for reporting.' },
    ],
  },
  {
    tier: 'Streaming & data (managed)',
    note: 'Durable log + purpose-built stores.',
    items: [
      { name: 'Kafka', tech: 'Managed (MSK/Confluent)', hosting: 'managed', role: 'Durable, replayable log partitioned by deviceId; multi-consumer fan-out.' },
      { name: 'PostgreSQL', tech: 'Partitioned + read replicas', hosting: 'managed', role: 'Time-partitioned writes; replicas serve list/stats reads.' },
      { name: 'TimescaleDB', tech: 'Hypertables + compression', hosting: 'managed', role: 'Continuous-aggregate rollups + compressed old chunks power the charts.' },
      { name: 'Redis', tech: 'Pub/Sub + cache', hosting: 'managed', role: 'Cross-instance SSE fan-out and hot-query/stat caching.' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Bottlenecks & scaling scenarios                                     */
/* ------------------------------------------------------------------ */

export type ScaleLevel = 100 | 1000 | 10000 | 100000;

export interface Bottleneck {
  area: string;
  driver: string;
  symptom: string;
  mitigation: string;
  future: string;
  /** Device level where it bites, or null if not driven by device count. */
  bitesAt: ScaleLevel | null;
}

export const BOTTLENECKS: Bottleneck[] = [
  {
    area: 'Ingestion throughput',
    driver: 'Incoming events / sec',
    symptom: 'A spike of producers could outpace a single API + worker.',
    mitigation: 'Already async: the API only enqueues (202) and the worker drains at concurrency 10. Run multiple stateless API instances behind a load balancer.',
    future: 'At extreme rates, move BullMQ to Kafka so ingestion and processing scale as independent, partitioned consumers.',
    bitesAt: 10000,
  },
  {
    area: 'Database writes',
    driver: 'Cumulative event volume',
    symptom: 'The append-only incident_events log grows fastest; per-event inserts and index maintenance dominate.',
    mitigation: 'Worker concurrency is tunable; the open insert is a single idempotent upsert.',
    future: 'Batch inserts in the worker, time-partition by occurred_at (pg_partman), and add retention so indexes stay small.',
    bitesAt: 10000,
  },
  {
    area: 'Time-series / reporting reads',
    driver: 'Rows scanned per query',
    symptom: 'On-demand date_bin aggregation over millions of rows gets slow as history accumulates; the charts feel it first.',
    mitigation: 'Composite occurred_at indexes back the buckets today; the all-time summary is cached.',
    future: 'Move to TimescaleDB (hypertables and continuous aggregates maintain rollups incrementally, and compression shrinks old chunks), or hand-rolled rollup tables with read replicas.',
    bitesAt: 1000,
  },
  {
    area: 'Queue durability & backlog',
    driver: 'Spike size vs Redis memory',
    symptom: 'BullMQ on Redis is in-memory buffering, not a durable replayable log; a very large backlog is bounded by Redis memory and lost reprocessing.',
    mitigation: 'Fine for absorbing normal spikes with retry/backoff at the current scale.',
    future: 'Kafka gives durability, partition-ordered replay and multiple independent consumer groups.',
    bitesAt: 100000,
  },
  {
    area: 'SSE fan-out',
    driver: 'API instances × concurrent operators, not device count',
    symptom: 'A single process only sees its own in-process domain events and holds every connection; once you run more than one API instance, a client on instance A misses changes processed by instance B.',
    mitigation: 'A single instance handles many dashboards fine; this is purely a horizontal-scaling concern.',
    future: 'Publish domain events over Redis Pub/Sub (or Kafka) so every instance pushes to its own SSE clients. No sticky sessions needed.',
    bitesAt: null,
  },
];

export const SCALE_LEVELS: { level: ScaleLevel; label: string; note: string }[] = [
  { level: 100, label: '100 devices', note: 'The shipped single-node build handles this comfortably.' },
  { level: 1000, label: '1k devices', note: 'History accumulates; time-series reads are the first thing to feel it.' },
  { level: 10000, label: '10k devices', note: 'Write volume and ingestion rate matter: batching, partitioning, horizontal API.' },
  { level: 100000, label: '100k devices', note: 'Full scale-out: Kafka, partitioned Postgres + replicas, TimescaleDB, Pub/Sub fan-out.' },
];

/* ------------------------------------------------------------------ */
/* Data model (entities + indexes), mirrors docs/SCHEMA.md             */
/* ------------------------------------------------------------------ */

export interface Column {
  name: string;
  type: string;
  key?: 'PK' | 'FK';
  note?: string;
}

export interface Entity {
  id: string;
  name: string;
  tag: string;
  columns: Column[];
}

export const ENTITIES: Entity[] = [
  {
    id: 'incidents',
    name: 'incidents',
    tag: 'THE CASE, ONE ROW PER INCIDENT',
    columns: [
      { name: 'id', type: 'uuid', key: 'PK', note: 'UUIDv7, client-optional, time-ordered' },
      { name: 'device_id', type: 'varchar(64)' },
      { name: 'location', type: 'varchar(256)' },
      { name: 'event_type', type: 'event_type', note: 'native enum' },
      { name: 'severity', type: 'severity', note: 'native enum' },
      { name: 'status', type: 'status', note: 'current, derived from the timeline' },
      { name: 'occurred_at', type: 'timestamptz', note: 'opened at' },
      { name: 'last_event_at', type: 'timestamptz', note: 'event-time of the current status' },
      { name: 'created_at', type: 'timestamptz' },
      { name: 'updated_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'incident_events',
    name: 'incident_events',
    tag: 'THE TIMELINE, APPEND-ONLY',
    columns: [
      { name: 'id', type: 'uuid', key: 'PK' },
      { name: 'incident_id', type: 'uuid', key: 'FK', note: 'ON DELETE CASCADE' },
      { name: 'status', type: 'status' },
      { name: 'occurred_at', type: 'timestamptz', note: 'event time' },
      { name: 'created_at', type: 'timestamptz', note: 'received time' },
    ],
  },
];

export interface IndexRow {
  table: string;
  index: string;
  backs: string;
}

export const INDEXES: IndexRow[] = [
  { table: 'incidents', index: 'device_id, severity, status', backs: 'list filters' },
  { table: 'incidents', index: 'occurred_at DESC', backs: 'default ordering + time-window filter' },
  { table: 'incidents', index: '(severity, occurred_at)', backs: 'severity-volume time-series' },
  { table: 'incidents', index: '(status, occurred_at)', backs: 'status + windowed queries' },
  { table: 'incident_events', index: 'incident_id', backs: 'load a case’s timeline' },
  { table: 'incident_events', index: 'occurred_at, (status, occurred_at)', backs: 'resolved-per-bucket time-series' },
];

/* ------------------------------------------------------------------ */
/* API surface, mirrors docs/API.md                                   */
/* ------------------------------------------------------------------ */

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
export type EndpointGroup =
  | 'Ingestion'
  | 'Retrieval'
  | 'Updates'
  | 'Stats'
  | 'Maintenance'
  | 'Realtime';

export const ENDPOINT_GROUPS: EndpointGroup[] = [
  'Ingestion',
  'Retrieval',
  'Updates',
  'Stats',
  'Maintenance',
  'Realtime',
];

export interface Endpoint {
  method: HttpMethod;
  path: string;
  group: EndpointGroup;
  summary: string;
  returns?: string;
  /** Write classification: async = queued (202); sync = applied immediately. */
  mode?: 'async' | 'sync';
}

export const ENDPOINTS: Endpoint[] = [
  // Ingestion (device write path, queued, returns 202)
  { method: 'POST', path: '/incidents', group: 'Ingestion', mode: 'async', returns: '202 { id }',
    summary: 'Open a case (always OPEN). Body may carry a client UUID (idempotency key); the server generates a UUIDv7 if omitted.' },
  { method: 'POST', path: '/incidents/batch', group: 'Ingestion', mode: 'async', returns: '202 { accepted, ids }',
    summary: 'Open many in one request (≤ 1,000; 5 MB body limit). Drives the same queue → worker pipeline.' },
  { method: 'POST', path: '/incidents/:id/events', group: 'Ingestion', mode: 'async', returns: '202',
    summary: 'Report a status event for a case. Recorded in the timeline; current status is the latest by event-time (out-of-order safe).' },
  // Retrieval
  { method: 'GET', path: '/incidents', group: 'Retrieval', returns: '{ data, page, pageSize, total }',
    summary: 'Paginated, filtered list. Query: severity, status, deviceId, from, to (occurredAt), page, pageSize (1-100).' },
  { method: 'GET', path: '/incidents/:id', group: 'Retrieval', returns: 'case + events[] or 404',
    summary: 'A single case with its full status timeline, or 404.' },
  // Updates (operator write path, synchronous)
  { method: 'PATCH', path: '/incidents/:id/status', group: 'Updates', mode: 'sync', returns: 'updated case or 404',
    summary: 'Operator status change, applied immediately (no queue). Appends an event (timestamp = now) and returns the updated case.' },
  // Stats
  { method: 'GET', path: '/stats', group: 'Stats', returns: '{ total, open, resolved, by… }',
    summary: 'Summary counts by status / severity / eventType. Optional from/to window; the global (unwindowed) summary is cached in Redis.' },
  { method: 'GET', path: '/stats/timeseries', group: 'Stats', returns: '{ bucket, points[] }',
    summary: 'Bucketed series for the charts (bucket = minute…day). Each point: opened, resolved, active (cumulative opened − resolved).' },
  // Maintenance
  { method: 'DELETE', path: '/incidents', group: 'Maintenance', returns: '{ cleared }',
    summary: 'Destructive reset: deletes all cases (events cascade), drains the ingestion queue, resets the stats cache. Backs the simulator’s Clear all data.' },
  // Realtime
  { method: 'GET', path: '/stream', group: 'Realtime', returns: 'text/event-stream',
    summary: 'Long-lived SSE stream (consume with EventSource). Incident activity is coalesced server-side (~2/sec) so high-volume runs don’t flood clients.' },
];

export interface StreamEvent {
  name: string;
  data: string;
  when: string;
}

export const STREAM_EVENTS: StreamEvent[] = [
  { name: 'incidents.changed', data: '{ "count": <n> }', when: 'Incidents changed in the buffer window; the dashboard refetches its current view.' },
  { name: 'incidents.cleared', data: '{ "cleared": true }', when: 'Sent immediately when all data is cleared, so every dashboard resets at once.' },
];
