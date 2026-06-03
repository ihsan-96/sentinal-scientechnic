import { useState } from 'react';
import {
  DEPLOY_CURRENT,
  DEPLOY_FUTURE,
  DeployTier,
  Hosting,
  HOSTING_LABEL,
} from './content';

const HOST_CLASS: Record<Hosting, string> = {
  docker: 'host-docker',
  static: 'host-static',
  managed: 'host-managed',
  external: 'host-external',
};

function Tier({ tier }: { tier: DeployTier }) {
  return (
    <div className="card">
      <div className="card-head" style={{ marginBottom: 14 }}>
        <span className="tier-label">{tier.tier}</span>
        <span className="faint mono" style={{ fontSize: 10.5 }}>
          {tier.note}
        </span>
      </div>
      <div className="col" style={{ gap: 12 }}>
        {tier.items.map((it) => (
          <div key={it.name} className="flow-stage">
            <div className="row gap" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="row gap" style={{ gap: 10 }}>
                <span className="card-title" style={{ fontSize: 13 }}>
                  {it.name}
                </span>
                <span className="faint mono" style={{ fontSize: 10.5 }}>
                  {it.tech}
                </span>
              </span>
              <span className={`host-badge ${HOST_CLASS[it.hosting]}`}>
                {HOSTING_LABEL[it.hosting]}
              </span>
            </div>
            <div className="prose" style={{ fontSize: 12 }}>
              {it.role}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Deployment() {
  const [view, setView] = useState<'current' | 'future'>('current');
  const tiers = view === 'current' ? DEPLOY_CURRENT : DEPLOY_FUTURE;

  return (
    <>
      <div>
        <div className="eyebrow">Chapter 04 · Where it runs</div>
        <h2 className="chapter-title">Deployment &amp; hosting</h2>
        <p className="lead">
          What is containerised, what is static-hosted, and what is managed — for the system as it
          ships today, and as it would scale out. The <strong>backend</strong> (API + worker + SSE)
          is a long-lived Node process holding DB/Redis connections and live sockets, so it ships as
          one reproducible Docker deployable with Postgres and Redis. The <strong>dashboard</strong>{' '}
          has no server runtime — it builds to static files served from a <strong>CDN/edge</strong>{' '}
          (cheap, scales to many operators for free, low-latency, deploys decoupled), pointed at the
          backend via <span className="mono">VITE_API_URL</span>. SSE is plain HTTP, so it stays
          CDN/proxy-friendly.
        </p>
      </div>

      <div className="row gap" style={{ justifyContent: 'space-between' }}>
        <div className="seg">
          <button className={view === 'current' ? 'on' : ''} onClick={() => setView('current')}>
            Current
          </button>
          <button className={view === 'future' ? 'on' : ''} onClick={() => setView('future')}>
            Future (100k)
          </button>
        </div>
        <div className="row gap2">
          {(['docker', 'static', 'managed', 'external'] as Hosting[]).map((h) => (
            <span key={h} className="row gap" style={{ gap: 6 }}>
              <span className={`host-badge ${HOST_CLASS[h]}`}>{HOSTING_LABEL[h]}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid-3" key={view}>
        {tiers.map((t) => (
          <Tier key={t.tier} tier={t} />
        ))}
      </div>
    </>
  );
}
