import { useState } from 'react';
import { Icons } from '../lib/icons';
import { DECISIONS, TRANSPORTS } from './content';

export function DesignDecisions() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <div>
        <div className="eyebrow">Chapter 02 · Why it’s built this way</div>
        <h2 className="chapter-title">Design decisions</h2>
        <p className="lead">
          Every major choice traded something off. Tap a card to see the problem it solves, the
          alternatives considered, and the reasoning behind the pick.
        </p>
      </div>

      <div className="grid-2">
        {DECISIONS.map((d) => {
          const isOpen = open === d.id;
          return (
            <div
              key={d.id}
              className={`card decision${isOpen ? ' open' : ''}`}
              onClick={() => setOpen(isOpen ? null : d.id)}
            >
              <div className="card-head" style={{ marginBottom: 10 }}>
                <span className="card-title">{d.title}</span>
                <Icons.ChevronRight
                  size={16}
                  style={{
                    color: 'var(--text-faint)',
                    transform: isOpen ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.18s',
                  }}
                />
              </div>
              <div className="prose">{d.problem}</div>

              <div className="why" style={{ marginTop: 14 }}>
                <div className="label-caps">Alternatives weighed</div>
                <div className="tag-row" style={{ margin: '8px 0 14px' }}>
                  {d.alternatives.map((a) => (
                    <span key={a} className="chip" style={{ cursor: 'default' }}>
                      {a}
                    </span>
                  ))}
                </div>
                <div className="label-caps" style={{ color: 'var(--accent)' }}>
                  Chosen
                </div>
                <div className="prose" style={{ color: 'var(--text)', margin: '6px 0 14px' }}>
                  {d.chosen}
                </div>
                <div className="label-caps">Why</div>
                <div className="prose" style={{ marginTop: 6 }}>
                  {d.why}
                </div>
                <div className="label-caps" style={{ color: 'var(--high-muted)', marginTop: 14 }}>
                  At scale
                </div>
                <div className="prose" style={{ marginTop: 6 }}>
                  {d.future}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Real-time transport · SSE vs WebSocket vs polling</div>
          <span className="badge st-OPEN">
            <span className="dot" />
            SSE chosen
          </span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th></th>
              <th>REST polling</th>
              <th>WebSocket</th>
              <th className="chosen">SSE (chosen)</th>
            </tr>
          </thead>
          <tbody>
            {TRANSPORTS.map((r) => (
              <tr key={r.dimension}>
                <td className="mono" style={{ fontWeight: 700, color: 'var(--text)' }}>
                  {r.dimension}
                </td>
                <td className="soft">{r.polling}</td>
                <td className="soft">{r.websocket}</td>
                <td className="chosen">{r.sse}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="prose" style={{ marginTop: 16 }}>
          The dashboard needs new incidents without a manual refresh — a purely{' '}
          <strong>server → client</strong> push. One push beats N polls, and we use none of
          WebSocket’s bidirectional/binary machinery. WebSocket would win only if clients needed to
          stream <em>to</em> the server — they don’t.
        </p>
      </div>
    </>
  );
}
