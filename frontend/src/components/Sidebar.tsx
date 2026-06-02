import { IconComponent, Icons } from '../lib/icons';

export type NavId = 'overview' | 'incidents' | 'map' | 'devices' | 'alerts' | 'settings';

interface NavItem {
  id: NavId;
  label: string;
  icon: IconComponent;
}

const ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: Icons.Grid },
  { id: 'incidents', label: 'Incidents', icon: Icons.List },
  { id: 'map', label: 'Live Map', icon: Icons.Map },
  { id: 'devices', label: 'Devices', icon: Icons.Pin },
];

const SYSTEM: NavItem[] = [
  { id: 'alerts', label: 'Alert Rules', icon: Icons.Bell },
  { id: 'settings', label: 'Settings', icon: Icons.Settings },
];

interface Props {
  active: NavId;
  onNav: (id: NavId) => void;
  /** Critical incidents in range — shown as the Incidents nav badge. */
  criticalCount?: number;
  connected: boolean;
  eventCount: number;
}

export function Sidebar({ active, onNav, criticalCount, connected, eventCount }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark neu-raise-sm">
          <Icons.Activity size={20} sw={2.4} />
        </span>
        <div>
          <div className="brand-name">SENTINEL</div>
          <div className="brand-sub">Traffic Ops</div>
        </div>
      </div>

      <nav className="nav">
        {ITEMS.map((it) => (
          <button
            key={it.id}
            className={`nav-item ${active === it.id ? 'active' : ''}`}
            onClick={() => onNav(it.id)}
          >
            <it.icon size={18} />
            <span>{it.label}</span>
            {it.id === 'incidents' && criticalCount != null && criticalCount > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--danger-muted)',
                }}
              >
                {criticalCount}
              </span>
            )}
          </button>
        ))}
        <div className="nav-sec label-caps">System</div>
        {SYSTEM.map((it) => (
          <button
            key={it.id}
            className={`nav-item ${active === it.id ? 'active' : ''}`}
            onClick={() => onNav(it.id)}
          >
            <it.icon size={18} />
            <span>{it.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="neu-sunk" style={{ padding: 14, borderRadius: 'var(--radius)' }}>
          <div className="row" style={{ gap: 8, marginBottom: 8 }}>
            <span className={`live-dot${connected ? '' : ' off'}`} />
            <span
              className="label-caps"
              style={{ color: connected ? 'var(--success)' : 'var(--text-faint)' }}
            >
              {connected ? 'Stream Live' : 'Disconnected'}
            </span>
          </div>
          <div className="faint mono" style={{ fontSize: 10.5, lineHeight: 1.5 }}>
            {connected ? `${eventCount.toLocaleString()} events streamed` : 'Reconnecting…'}
          </div>
        </div>
      </div>
    </aside>
  );
}
