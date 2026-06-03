import { NavId } from '../components/Sidebar';
import { Icons } from '../lib/icons';
import { ArchitectureMap } from './ArchitectureMap';
import { EDGES, GROUPS, NODES } from './content';

interface Props {
  onNav: (id: NavId) => void;
}

const STATS: { val: string; label: string }[] = [
  { val: 'HTTP 202', label: 'Accepted, API enqueues and never blocks on the DB' },
  { val: '~2 / sec', label: 'Coalesced SSE nudges, not per-incident' },
  { val: '100→100k', label: 'Devices on one architectural shape' },
];

const CHAPTERS: { id: NavId; icon: keyof typeof Icons; title: string; desc: string }[] = [
  { id: 'architecture', icon: 'Map', title: 'Architecture', desc: 'Click through the system map and watch a request flow hop-by-hop, including the read-after-SSE.' },
  { id: 'datamodel', icon: 'Database', title: 'Data Model', desc: 'The two tables, their one-to-many relationship, and the indexes that back every query.' },
  { id: 'api', icon: 'Code', title: 'API Reference', desc: 'Every endpoint and SSE event, plus the async (202) vs synchronous operator write paths.' },
  { id: 'decisions', icon: 'GitBranch', title: 'Design Decisions', desc: 'The main trade-offs: problem, alternatives, why each pick won, and how it scales.' },
  { id: 'tech', icon: 'Layers', title: 'Tech Stack', desc: 'What every tool does here and why it beat the obvious alternative.' },
  { id: 'deployment', icon: 'Server', title: 'Deployment', desc: 'What runs in Docker, what is static-hosted, today and at 100k.' },
  { id: 'scale', icon: 'Scale', title: 'Scale & Bottlenecks', desc: 'Dial the load and see the real pressure points and the scale-out path.' },
];

export function Overview({ onNav }: Props) {
  return (
    <>
      <div>
        <div className="eyebrow">SENTINEL · Architecture guide</div>
        <h2 className="chapter-title" style={{ fontSize: 26 }}>
          Real-Time Traffic Incident Platform
        </h2>
        <p className="lead">
          Roadside devices report incidents as <strong>cases with a status timeline</strong>. The
          backend ingests them through a <strong>queue</strong>, persists them in{' '}
          <strong>PostgreSQL</strong>, and streams live updates to an operator{' '}
          <strong>dashboard over SSE</strong>, with out-of-order arrivals handled by latest
          event-time. This guide walks the architecture, the decisions behind it, where it runs, and
          how it scales.
        </p>
      </div>

      <div className="kpi-grid">
        {STATS.map((s) => (
          <div className="kpi" key={s.label}>
            <span className="kpi-val">{s.val}</span>
            <span className="faint mono" style={{ fontSize: 11, lineHeight: 1.5 }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">The whole system, at a glance</div>
          <button className="btn" onClick={() => onNav('architecture')}>
            Explore map <Icons.ChevronRight size={13} />
          </button>
        </div>
        <ArchitectureMap nodes={NODES} edges={EDGES} groups={GROUPS} viewW={970} viewH={472} live legend />
      </div>

      <div className="grid-2">
        {CHAPTERS.map((c) => {
          const Icon = Icons[c.icon];
          return (
            <button
              key={c.id}
              className="card tech"
              style={{ textAlign: 'left' }}
              onClick={() => onNav(c.id)}
            >
              <span className="tech-mark neu-raise-sm">
                <Icon size={20} />
              </span>
              <div className="card-title">{c.title}</div>
              <div className="prose" style={{ fontSize: 12 }}>
                {c.desc}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
