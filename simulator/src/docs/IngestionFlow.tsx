import { useEffect, useState } from 'react';
import { Icons } from '../lib/icons';
import { IncidentStatus } from '../types';
import { ArchitectureMap, Tone } from './ArchitectureMap';
import { EDGES, GROUPS, NODES } from './content';

interface Step {
  from: string;
  to: string;
  tone: Tone;
  nodes?: string[];
  wire: string;
  note: string;
  // scenario B (out-of-order) case state after this step
  status?: IncidentStatus;
  lastEventAt?: string;
  timeline?: { status: IncidentStatus; at: string; late?: boolean }[];
  punch?: boolean;
}

const TONE_LABEL: Record<Tone, string> = {
  req: 'Request',
  res: 'Response',
  event: 'Domain event',
  live: 'SSE push',
  read: 'DB read',
  write: 'Sync write',
};
const TONE_VAR: Record<Tone, string> = {
  req: 'var(--accent)',
  res: 'var(--text-soft)',
  event: 'var(--high-muted)',
  live: 'var(--success)',
  read: 'var(--accent)',
  write: 'var(--warning)',
};

// Scenario A: open a case, push it live, dashboard refetches.
const OPEN_FLOW: Step[] = [
  { from: 'dev', to: 'api', tone: 'req', wire: 'POST /incidents (OPEN)', note: 'A roadside device reports a new incident to the ingestion endpoint.' },
  { from: 'api', to: 'dev', tone: 'res', wire: '202 Accepted { id }', note: 'The API validates the DTO, returns HTTP 202 Accepted immediately, and enqueues the job; it never blocks on the database.' },
  { from: 'api', to: 'queue', tone: 'req', wire: 'enqueue open', note: 'The job lands on the BullMQ queue (Redis), decoupling the request from the write.' },
  { from: 'queue', to: 'worker', tone: 'event', wire: 'deliver job', note: 'The in-process worker (concurrency 10) picks up the job.' },
  { from: 'worker', to: 'db', tone: 'req', wire: 'INSERT case + OPEN event', note: 'Idempotent open (on-conflict-do-nothing), so a BullMQ retry can never double-create the case.' },
  { from: 'worker', to: 'events', tone: 'event', wire: 'emit incident.created', note: 'After the write, the service emits an in-process domain event (EventEmitter2).' },
  { from: 'events', to: 'sse', tone: 'event', wire: 'buffer ~500ms', note: 'The SSE listener buffers change events for 500ms (bufferTime) to coalesce bursts.' },
  { from: 'events', to: 'cache', tone: 'event', wire: 'invalidate stats:summary', note: 'In parallel, the cache listener drops the all-time stats summary so the next read is fresh.' },
  { from: 'sse', to: 'ui', tone: 'live', nodes: ['sse', 'ui'], wire: 'incidents.changed { count }', note: 'Every connected dashboard gets one small coalesced nudge, a count, not the incident itself.' },
  { from: 'ui', to: 'api', tone: 'read', wire: 'GET /incidents + /stats', note: 'On the nudge, TanStack Query refetches the current filtered / paginated view, through the API.' },
  { from: 'api', to: 'db', tone: 'read', wire: 'SELECT (indexed)', note: 'Reads hit PostgreSQL via the repository; the all-time summary is served from the Redis cache.' },
  { from: 'api', to: 'ui', tone: 'res', wire: 'rows + stats', note: 'The dashboard re-renders one row per case, never per status. The loop is closed.' },
];

const T0 = '09:00';
const T1 = '09:05';
const T2 = '09:10';

// Scenario B: a late event must not regress the case.
const OOO_FLOW: Step[] = [
  {
    from: 'worker', to: 'db', tone: 'req', wire: 'case open @ 09:00',
    note: 'Start: the case is already open. last_event_at = 09:00.',
    status: 'OPEN', lastEventAt: T0, timeline: [{ status: 'OPEN', at: T0 }],
  },
  {
    from: 'dev', to: 'api', tone: 'req', wire: 'POST RESOLVED @ 09:10',
    note: 'A later status event arrives and is enqueued.',
    status: 'OPEN', lastEventAt: T0, timeline: [{ status: 'OPEN', at: T0 }],
  },
  {
    from: 'worker', to: 'db', tone: 'req', wire: 'apply: 09:10 > 09:00 → RESOLVED',
    note: 'Its event-time is newer than last_event_at, so the current status advances to RESOLVED.',
    status: 'RESOLVED', lastEventAt: T2,
    timeline: [{ status: 'OPEN', at: T0 }, { status: 'RESOLVED', at: T2 }],
  },
  {
    from: 'dev', to: 'api', tone: 'req', wire: 'POST ACKNOWLEDGED @ 09:05 (late)',
    note: 'Now an older event arrives out of order: it happened at 09:05 but lands after the 09:10 RESOLVED.',
    status: 'RESOLVED', lastEventAt: T2,
    timeline: [{ status: 'OPEN', at: T0 }, { status: 'RESOLVED', at: T2 }],
  },
  {
    from: 'worker', to: 'db', tone: 'req', punch: true, wire: 'apply: 09:05 ≤ 09:10 → recorded, not applied',
    note: 'Key rule: the late event is appended to the timeline, but because 09:05 ≤ last_event_at it does NOT regress the case. Status stays RESOLVED; ingestion is order-independent.',
    status: 'RESOLVED', lastEventAt: T2,
    timeline: [
      { status: 'OPEN', at: T0 },
      { status: 'ACKNOWLEDGED', at: T1, late: true },
      { status: 'RESOLVED', at: T2 },
    ],
  },
];

// Scenario C: an operator resolves a case (synchronous write path, no queue).
const OP_FLOW: Step[] = [
  { from: 'ui', to: 'api', tone: 'write', wire: 'PATCH /incidents/:id/status (RESOLVED)', note: 'An operator resolves a case from the dashboard. Unlike device ingestion, this write is applied synchronously; it never touches the queue.' },
  { from: 'api', to: 'db', tone: 'write', wire: 'append event + advance status', note: 'The API writes straight to PostgreSQL inside the request: it appends a RESOLVED event and updates the case’s current status in one call.' },
  { from: 'api', to: 'ui', tone: 'res', wire: '200 OK, updated case', note: 'The operator gets the updated case back immediately; the action is confirmed, not merely accepted (202).' },
  { from: 'api', to: 'events', tone: 'event', wire: 'emit incident.updated', note: 'The very same domain event fires as the queued path; the synchronous write converges on the identical fan-out.' },
  { from: 'events', to: 'cache', tone: 'event', wire: 'invalidate stats:summary', note: 'One listener drops the all-time stats cache so the next read is fresh.' },
  { from: 'events', to: 'sse', tone: 'event', wire: 'buffer ~500ms', note: 'The other listener coalesces the change for the SSE stream.' },
  { from: 'sse', to: 'ui', tone: 'live', nodes: ['sse', 'ui'], wire: 'incidents.changed { count }', note: 'Every OTHER connected dashboard gets the nudge and refetches. Two write paths (device-async, operator-sync), one fan-out.' },
];

type ScenarioId = 'open' | 'ooo' | 'op';

const SCENARIOS: { id: ScenarioId; label: string; steps: Step[] }[] = [
  { id: 'open', label: 'Device open', steps: OPEN_FLOW },
  { id: 'ooo', label: 'Out-of-order', steps: OOO_FLOW },
  { id: 'op', label: 'Operator resolve', steps: OP_FLOW },
];

export function IngestionFlow() {
  const [scenario, setScenario] = useState<ScenarioId>('open');
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);

  const steps = SCENARIOS.find((s) => s.id === scenario)!.steps;
  const step = steps[i];
  const atEnd = i >= steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setI((n) => n + 1), 1700);
    return () => clearTimeout(t);
  }, [playing, i, atEnd]);

  const pick = (s: ScenarioId) => {
    setScenario(s);
    setI(0);
    setPlaying(false);
  };

  const jump = (idx: number) => {
    setPlaying(false);
    setI(idx);
  };

  return (
    <div className="card">
      <div className="card-head" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="card-title">Live walkthrough</div>
          <div className="faint mono" style={{ fontSize: 11, marginTop: 4 }}>
            One pulse travels the active line per step; the lines stay put.
          </div>
        </div>
        <div className="seg">
          {SCENARIOS.map((s) => (
            <button key={s.id} className={scenario === s.id ? 'on' : ''} onClick={() => pick(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <ArchitectureMap
        nodes={NODES}
        edges={EDGES}
        groups={GROUPS}
        viewW={970}
        viewH={472}
        spotlight={false}
        flow={{ from: step.from, to: step.to, tone: step.tone, nodes: step.nodes }}
        flowKey={i}
      />

      <div className="row gap" style={{ margin: '16px 0 14px', justifyContent: 'space-between' }}>
        <div className="row gap">
          <button
            className="btn btn-accent"
            onClick={() => {
              if (atEnd) setI(0);
              setPlaying((p) => !p);
            }}
          >
            {playing ? <Icons.Square size={13} /> : <Icons.Play size={13} />}
            {playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
          </button>
          <button
            className="btn"
            disabled={atEnd}
            onClick={() => {
              setPlaying(false);
              setI((n) => Math.min(n + 1, steps.length - 1));
            }}
          >
            Step <Icons.ChevronRight size={13} />
          </button>
          <button className="btn" onClick={() => { setPlaying(false); setI(0); }}>
            Reset
          </button>
        </div>
        <span className="faint mono" style={{ fontSize: 11 }}>
          {i + 1} / {steps.length}
        </span>
      </div>

      <div className="stepper" style={{ marginBottom: 14 }}>
        {steps.map((_, idx) => (
          <button
            key={idx}
            className={`step-dot${idx === i ? ' active' : idx < i ? ' done' : ''}`}
            onClick={() => jump(idx)}
            aria-label={`Step ${idx + 1}`}
          />
        ))}
      </div>

      <div className="flow-caption fade-in" key={`${scenario}-${i}`}>
        <div className="row gap" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="badge" style={{ background: 'var(--surface-2)', color: TONE_VAR[step.tone] }}>
            <span className="dot" />
            {TONE_LABEL[step.tone]}
          </span>
          <span className="mono faint" style={{ fontSize: 10.5, letterSpacing: '0.04em' }}>
            {step.from} → {step.to}
          </span>
        </div>
        <div className="mono" style={{ fontSize: 13, fontWeight: 700, margin: '2px 0 6px' }}>
          {step.wire}
        </div>
        <div className="prose" style={{ fontSize: 12.5, color: step.punch ? 'var(--text)' : undefined }}>
          {step.punch && <span className="eyebrow" style={{ marginRight: 8 }}>Key rule</span>}
          {step.note}
        </div>

        {scenario === 'ooo' && (
          <>
            <div className="row gap2" style={{ marginTop: 16, flexWrap: 'wrap' }}>
              <span className="row gap" style={{ gap: 8 }}>
                <span className="label-caps">status</span>
                <span className={`badge st-${step.status}`}>
                  <span className="dot" />
                  {step.status?.replace('_', ' ')}
                </span>
              </span>
              <span className="row gap" style={{ gap: 8 }}>
                <span className="label-caps">last_event_at</span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>
                  {step.lastEventAt}
                </span>
              </span>
            </div>
            <div className="timeline" style={{ marginTop: 12 }}>
              {step.timeline?.map((ev, k) => (
                <div className="tl-item" key={k}>
                  <span className="tl-dot" />
                  <div className="row gap" style={{ justifyContent: 'space-between' }}>
                    <span className={`badge st-${ev.status}`}>
                      <span className="dot" />
                      {ev.status.replace('_', ' ')}
                    </span>
                    <span className="mono faint" style={{ fontSize: 11 }}>
                      {ev.at}
                      {ev.late && <span className="hot" style={{ marginLeft: 8 }}>late</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
