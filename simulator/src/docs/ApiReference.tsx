import { Endpoint, ENDPOINT_GROUPS, ENDPOINTS, STREAM_EVENTS } from './content';

function EndpointRow({ ep }: { ep: Endpoint }) {
  return (
    <div className="flow-stage">
      <div
        className="row gap"
        style={{ justifyContent: 'space-between', marginBottom: 6, gap: 10, flexWrap: 'wrap' }}
      >
        <span className="row gap" style={{ gap: 10 }}>
          <span className={`method ${ep.method}`}>{ep.method}</span>
          <span className="mono" style={{ fontWeight: 700, fontSize: 12.5 }}>
            {ep.path}
          </span>
        </span>
        <span className="row gap" style={{ gap: 8 }}>
          {ep.mode && (
            <span
              className="badge"
              style={{
                background: 'var(--surface-2)',
                color: ep.mode === 'sync' ? 'var(--warning)' : 'var(--accent)',
              }}
            >
              <span className="dot" />
              {ep.mode === 'sync' ? 'sync · immediate' : 'async · 202'}
            </span>
          )}
          {ep.returns && (
            <span className="mono faint" style={{ fontSize: 10.5 }}>
              {ep.returns}
            </span>
          )}
        </span>
      </div>
      <div className="prose" style={{ fontSize: 12 }}>
        {ep.summary}
      </div>
    </div>
  );
}

export function ApiReference() {
  return (
    <>
      <div>
        <div className="eyebrow">Chapter 07 · The contract</div>
        <h2 className="chapter-title">API reference</h2>
        <p className="lead">
          Base URL <span className="mono">/api</span>, live Swagger at{' '}
          <span className="mono">/api/docs</span>. There are <strong>two write paths</strong>: device
          ingestion is <strong>asynchronous</strong>: validated, queued, and acknowledged with{' '}
          <strong>HTTP 202</strong>, while an operator’s{' '}
          <span className="mono">PATCH&nbsp;/incidents/:id/status</span> is{' '}
          <strong>synchronous</strong>, applied immediately and returning the updated case.
        </p>
      </div>

      {ENDPOINT_GROUPS.map((g) => {
        const eps = ENDPOINTS.filter((e) => e.group === g);
        if (!eps.length) return null;
        return (
          <div className="card" key={g}>
            <div className="card-head">
              <div className="card-title">{g}</div>
            </div>
            <div className="col" style={{ gap: 12 }}>
              {eps.map((ep) => (
                <EndpointRow key={`${ep.method} ${ep.path}`} ep={ep} />
              ))}
            </div>
          </div>
        );
      })}

      <div className="card">
        <div className="card-head">
          <div className="card-title">Realtime · Server-Sent Events</div>
          <span className="badge st-OPEN">
            <span className="dot" />
            GET /stream
          </span>
        </div>
        <p className="prose">
          Incident activity is coalesced server-side (~2/sec); the dashboard learns{' '}
          <em>something changed, and how much</em>, then refetches its current view. Two named events:
        </p>
        <div className="col" style={{ gap: 12, margin: '14px 0' }}>
          {STREAM_EVENTS.map((ev) => (
            <div className="flow-stage" key={ev.name}>
              <div className="row gap" style={{ justifyContent: 'space-between', gap: 10 }}>
                <span className="mono" style={{ fontWeight: 700, fontSize: 12.5 }}>
                  {ev.name}
                </span>
                <span className="mono faint" style={{ fontSize: 11 }}>
                  {ev.data}
                </span>
              </div>
              <div className="prose" style={{ fontSize: 12, marginTop: 6 }}>
                {ev.when}
              </div>
            </div>
          ))}
        </div>
        <pre
          className="mono neu-sunk"
          style={{
            margin: 0,
            padding: 'calc(var(--u) * 1.5)',
            borderRadius: 'var(--radius)',
            fontSize: 11.5,
            color: 'var(--text-soft)',
            overflowX: 'auto',
          }}
        >
          {`event: incidents.changed\ndata: {"count":42}`}
        </pre>
      </div>
    </>
  );
}
