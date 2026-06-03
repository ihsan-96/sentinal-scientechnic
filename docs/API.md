# API Reference

Base URL: `http://localhost:4000/api`. Interactive docs (Swagger): `/api/docs`.

All responses are JSON. Errors share one envelope:

```json
{ "statusCode": 400, "error": "Bad Request", "message": ["..."], "timestamp": "...", "path": "/api/..." }
```

**Two write paths.** Device ingestion (`POST`, below) is asynchronous: validated, queued, and
acknowledged with HTTP 202. The data appears once the worker drains it. An operator's
`PATCH /incidents/:id/status` is synchronous: applied immediately, returning the updated case.
Both append to the timeline and emit the same domain event, so the SSE and cache fan-out is
identical.

## Ingestion

An incident is a case: an OPEN starts one, later status events update it (they don't create new
cases). See the [data model](./SCHEMA.md).

### `POST /incidents` (open a case)
Reports a new incident (always OPEN). Returns HTTP 202 Accepted with the case id.

```json
{
  "id": "0190e8c2-...",        // optional client-supplied UUID (correlation/idempotency key)
  "deviceId": "CAM-001",
  "location": "Sheikh Zayed Road",
  "eventType": "ACCIDENT",
  "severity": "HIGH",
  "timestamp": "2026-06-01T10:30:00Z"
}
```
If `id` is omitted the server generates a UUIDv7. Response: `{ "id": "0190e8c2-..." }`.

### `POST /incidents/batch` (open many)
Body `{ "incidents": [ { ...open } ] }` (≤ 1,000 per request; JSON body limit 5 MB).
Returns HTTP 202 `{ "accepted": <n>, "ids": [...] }`.

### `POST /incidents/:id/events` (report a status event)
Device/external status update for a case. Body `{ "status": "RESOLVED", "timestamp": "..." }`
(`timestamp` defaults to now). Returns HTTP 202. Recorded in the timeline; the current status
is the latest by event time (out-of-order safe).

## Retrieval

### `GET /incidents`
Paginated, filtered list of cases.

| Query param | Type | Default |
|---|---|---|
| `severity` | `LOW\|MEDIUM\|HIGH\|CRITICAL` | (none) |
| `status` | `OPEN\|ACKNOWLEDGED\|IN_PROGRESS\|RESOLVED` | (none) |
| `deviceId` | string | (none) |
| `from`, `to` | ISO 8601 (filters `occurredAt`) | (none) |
| `page` | int ≥ 1 | 1 |
| `pageSize` | int 1-100 | 20 |

Response: `{ "data": [ /* Incident[] */ ], "page": 1, "pageSize": 20, "total": 137 }`.

### `GET /incidents/:id`
A single case with its status timeline, or 404:
```json
{ "id": "...", "status": "RESOLVED", "severity": "HIGH", "...": "...",
  "events": [ { "status": "OPEN", "occurredAt": "..." }, { "status": "RESOLVED", "occurredAt": "..." } ] }
```

## Updates

### `PATCH /incidents/:id/status`
Operator action, applied immediately (synchronous). Body `{ "status": "RESOLVED" }`. Appends an
event (timestamp = now) and returns the updated case, or 404.

## Statistics

### `GET /stats?from&to`
Summary case counts. Optional `from`/`to` (ISO, on `occurredAt`) window the result; with both
omitted it returns the global summary (cached in Redis, invalidated on every write).

```json
{
  "total": 137, "open": 90, "resolved": 30,
  "bySeverity": { "LOW": 60, "MEDIUM": 47, "HIGH": 22, "CRITICAL": 8 },
  "byStatus": { "OPEN": 90, "ACKNOWLEDGED": 10, "IN_PROGRESS": 7, "RESOLVED": 30 },
  "byEventType": { "ACCIDENT": 40, "CONGESTION": 50, "ROAD_CLOSURE": 17, "HAZARD": 20, "BREAKDOWN": 10 }
}
```

### `GET /stats/timeseries?from&to&bucket`
Bucketed series for the charts. `bucket` ∈ `minute|fiveMinutes|fifteenMinutes|hour|sixHours|day`.

```json
{ "bucket": "hour", "points": [
  { "t": "2026-06-02T10:00:00Z", "opened": 12, "resolved": 4, "active": 41,
    "bySeverity": { "LOW": 6, "MEDIUM": 3, "HIGH": 2, "CRITICAL": 1 } }
] }
```
`opened`/`resolved` are per bucket; `active` is currently-open over time (cumulative opened minus resolved).

## Maintenance

### `DELETE /incidents`
Destructive reset: deletes all cases (events cascade), drains the ingestion queue, and resets
the stats cache. Returns `{ "cleared": <n> }`. Backs the simulator's *Clear all data* button and
mirrors `npm run db:clear`.

## Real-time (Server-Sent Events)

### `GET /stream`
A long-lived SSE stream (consume with `EventSource`). Incident activity is coalesced server-side
(~2/sec) so a high-volume run doesn't flood clients with tens of thousands of messages. The
dashboard only needs to know that something changed and by how much, then refetches.

- `incidents.changed`: data `{ "count": <n> }` (incidents changed in the window)
- `incidents.cleared`: data `{ "cleared": true }` (sent immediately when all data is cleared)

```
event: incidents.changed
data: {"count":42}
```

SSE is used instead of polling `GET /incidents` (push, not repeated re-fetch) and instead of a
WebSocket (the feed is one-directional). See
[ARCHITECTURE.md](./ARCHITECTURE.md#real-time-transport-sse-vs-rest-polling-vs-websocket).
