import { IconComponent, Icons } from '../lib/icons';

export type NavId =
  | 'generator'
  | 'overview'
  | 'architecture'
  | 'datamodel'
  | 'api'
  | 'decisions'
  | 'tech'
  | 'deployment'
  | 'scale';

interface NavItem {
  id: NavId;
  label: string;
  icon: IconComponent;
}

const SIMULATE: NavItem[] = [{ id: 'generator', label: 'Generator', icon: Icons.Sliders }];

const DOCS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: Icons.Compass },
  { id: 'architecture', label: 'Architecture', icon: Icons.Map },
  { id: 'datamodel', label: 'Data Model', icon: Icons.Database },
  { id: 'api', label: 'API Reference', icon: Icons.Code },
  { id: 'decisions', label: 'Design Decisions', icon: Icons.GitBranch },
  { id: 'tech', label: 'Tech Stack', icon: Icons.Layers },
  { id: 'deployment', label: 'Deployment', icon: Icons.Server },
  { id: 'scale', label: 'Scale & Bottlenecks', icon: Icons.Scale },
];

interface Props {
  active: NavId;
  onNav: (id: NavId) => void;
  running: boolean;
  opened: number;
}

export function Sidebar({ active, onNav, running, opened }: Props) {
  const renderItem = (it: NavItem) => (
    <button
      key={it.id}
      className={`nav-item ${active === it.id ? 'active' : ''}`}
      onClick={() => onNav(it.id)}
    >
      <it.icon size={18} />
      <span>{it.label}</span>
    </button>
  );

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark neu-raise-sm">
          <Icons.Activity size={20} sw={2.4} />
        </span>
        <div>
          <div className="brand-name">SENTINEL</div>
          <div className="brand-sub">Simulator</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-sec label-caps">Simulate</div>
        {SIMULATE.map(renderItem)}
        <div className="nav-sec label-caps">Architecture Guide</div>
        {DOCS.map(renderItem)}
      </nav>

      <div className="sidebar-foot">
        <div className="neu-sunk" style={{ padding: 14, borderRadius: 'var(--radius)' }}>
          <div className="row" style={{ gap: 8, marginBottom: 8 }}>
            <span className={`live-dot${running ? '' : ' off'}`} />
            <span
              className="label-caps"
              style={{ color: running ? 'var(--success)' : 'var(--text-faint)' }}
            >
              {running ? 'Generating' : 'Idle'}
            </span>
          </div>
          <div className="faint mono" style={{ fontSize: 10.5, lineHeight: 1.5 }}>
            {opened.toLocaleString()} cases sent this run
          </div>
        </div>
      </div>
    </aside>
  );
}
