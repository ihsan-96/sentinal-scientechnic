import { Entity, ENTITIES, INDEXES } from './content';

function EntityCard({ e }: { e: Entity }) {
  return (
    <div className="card">
      <div style={{ marginBottom: 12 }}>
        <span className="card-title mono">{e.name}</span>
        <div className="label-caps" style={{ marginTop: 4 }}>
          {e.tag}
        </div>
      </div>
      <div>
        {e.columns.map((c) => (
          <div className="col-row" key={c.name}>
            <span style={{ whiteSpace: 'nowrap' }}>
              <span className="col-name">{c.name}</span>
              {c.key && <span className={`keychip ${c.key}`}>{c.key}</span>}
            </span>
            <span className="row gap" style={{ gap: 10, justifyContent: 'flex-end' }}>
              {c.note && <span className="col-note">{c.note}</span>}
              <span className="col-type">{c.type}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DataModel() {
  return (
    <>
      <div>
        <div className="eyebrow">Chapter 06 · The data model</div>
        <h2 className="chapter-title">Data model</h2>
        <p className="lead">
          A traffic incident is a <strong>case</strong> (<span className="mono">incidents</span>) with
          an append-only <strong>status timeline</strong> (<span className="mono">incident_events</span>).
          The current <span className="mono">status</span> is denormalised onto the case and derived
          from the latest event-time, the rule the <strong>out-of-order walkthrough</strong> in
          Architecture demonstrates.
        </p>
      </div>

      <div className="er-grid">
        <EntityCard e={ENTITIES[0]} />
        <div className="er-link">
          <span className="er-card">1</span>
          <span className="label-caps">has timeline</span>
          <span className="er-card">∞</span>
        </div>
        <EntityCard e={ENTITIES[1]} />
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Indexes → what they back</div>
          <span className="badge st-OPEN">
            <span className="dot" />
            performance
          </span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Table</th>
              <th>Index</th>
              <th>Backs</th>
            </tr>
          </thead>
          <tbody>
            {INDEXES.map((r, idx) => (
              <tr key={idx}>
                <td className="mono" style={{ fontWeight: 700, color: 'var(--text)' }}>
                  {r.table}
                </td>
                <td className="mono soft">{r.index}</td>
                <td className="soft">{r.backs}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="prose" style={{ marginTop: 16 }}>
          Enums (<span className="mono">event_type</span>, <span className="mono">severity</span>,{' '}
          <span className="mono">status</span>) are native PostgreSQL enum types.{' '}
          <span className="mono">incident_events.incident_id</span> is a foreign key with{' '}
          <strong>ON DELETE CASCADE</strong>, so clearing a case removes its timeline. The schema
          lives in <span className="mono">backend/src/db/schema.ts</span>; Drizzle Kit generates the
          SQL migrations.
        </p>
      </div>
    </>
  );
}
