import { ArchitectureMap } from './ArchitectureMap';
import { IngestionFlow } from './IngestionFlow';
import { EDGES, GROUPS, NODES } from './content';

const LEGEND: { cls: string; label: string }[] = [
  { cls: '', label: 'Service' },
  { cls: 'store', label: 'Datastore / queue' },
  { cls: 'edge-svc', label: 'Realtime edge' },
  { cls: 'client', label: 'Producer / consumer' },
];

export function Architecture() {
  return (
    <>
      <div>
        <div className="eyebrow">Chapter 01 · System map</div>
        <h2 className="chapter-title">Architecture</h2>
        <p className="lead">
          An incident is a <strong>case</strong> with an append-only <strong>status timeline</strong>.
          Producers report two kinds of event to an ingestion endpoint that{' '}
          <strong>acknowledges immediately (HTTP 202)</strong> and enqueues them. A worker applies
          each event, then emits an in-process domain event; independent listeners push it over{' '}
          <strong>SSE</strong> and invalidate the <strong>stats cache</strong>. The dashboard reads
          lists, timelines and stats <strong>through the API</strong> from Postgres and refetches on
          each SSE nudge; operators also resolve cases via a <strong>synchronous PATCH</strong>. The
          boxed nodes all run in <strong>one Nest process</strong>.
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Production topology (single backend container)</div>
          <div className="row gap2">
            {LEGEND.map((l) => (
              <span key={l.label} className="row gap" style={{ gap: 6 }}>
                <svg width={10} height={10}>
                  <circle className={`node-dot ${l.cls}`} cx={5} cy={5} r={4} />
                </svg>
                <span className="faint mono" style={{ fontSize: 10 }}>
                  {l.label}
                </span>
              </span>
            ))}
          </div>
        </div>
        <ArchitectureMap nodes={NODES} edges={EDGES} groups={GROUPS} viewW={970} viewH={472} selectable legend />
        <p className="faint mono" style={{ fontSize: 11, marginTop: 14, lineHeight: 1.6 }}>
          The dashboard never touches the database directly — TanStack Query reads Postgres and the
          stats cache <strong>through the API</strong>.
        </p>
      </div>

      <IngestionFlow />
    </>
  );
}
