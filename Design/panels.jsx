// Major panels: Sidebar, LiveTicker, FiltersBar, IncidentTable, Detail (drawer/modal/inline).

const { SEVERITIES, STATUSES, EVENT_TYPES } = window.INCIDENT_DATA;

// ---------- Sidebar ----------
function Sidebar({ active, onNav, stats }) {
  const items = [
    { id: 'overview', label: 'Overview', icon: Icons.Grid },
    { id: 'incidents', label: 'Incidents', icon: Icons.List, badge: stats ? stats.open : null },
    { id: 'map', label: 'Live Map', icon: Icons.Map },
    { id: 'devices', label: 'Devices', icon: Icons.Pin },
  ];
  const sys = [
    { id: 'alerts', label: 'Alert Rules', icon: Icons.Bell },
    { id: 'settings', label: 'Settings', icon: Icons.Settings },
  ];
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
        {items.map((it) => (
          <button key={it.id} className={`nav-item ${active === it.id ? 'active' : ''}`} onClick={() => onNav(it.id)}>
            <it.icon size={18} />
            <span>{it.label}</span>
            {it.badge != null && (
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>{it.badge}</span>
            )}
          </button>
        ))}
        <div className="nav-sec label-caps">System</div>
        {sys.map((it) => (
          <button key={it.id} className={`nav-item ${active === it.id ? 'active' : ''}`} onClick={() => onNav(it.id)}>
            <it.icon size={18} />
            <span>{it.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="neu-sunk" style={{ padding: 14, borderRadius: 'var(--radius)' }}>
          <div className="row" style={{ gap: 8, marginBottom: 8 }}>
            <span className="live-dot" />
            <span className="label-caps" style={{ color: 'var(--success)' }}>Stream Live</span>
          </div>
          <div className="faint mono" style={{ fontSize: 10.5, lineHeight: 1.5 }}>
            218 devices reporting<br />ingest lag 1.4s
          </div>
        </div>
      </div>
    </aside>
  );
}

// ---------- Live ticker ----------
function LiveTicker({ feed }) {
  return (
    <div className="card" style={{ padding: 'calc(var(--u)*1.75)' }}>
      <div className="card-head" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 9 }}>
          <span className="live-dot" />
          <span className="card-title">Live Feed</span>
        </div>
        <span className="label-caps">{feed.length ? relTime(feed[0].at) : '—'}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 230, overflowY: 'auto' }}>
        {feed.map((f) => {
          const EvIcon = EVENT_ICONS[f.eventType] || Icons.Alert;
          return (
            <div key={f.key} className="ticker-row">
              <span className="neu-sunk" style={{ width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', flexShrink: 0, color: SEV_COLOR[f.severity] }}>
                <EvIcon size={15} />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.location}</div>
                <div className="faint mono" style={{ fontSize: 10 }}>{f.eventType.replace('_', ' ')} · {f.deviceId}</div>
              </div>
              <SeverityBadge severity={f.severity} />
            </div>
          );
        })}
        {feed.length === 0 && <div className="faint mono" style={{ fontSize: 11, padding: 16, textAlign: 'center' }}>Waiting for events…</div>}
      </div>
    </div>
  );
}

// ---------- Filters bar + saved views ----------
const SAVED_VIEWS = [
  { id: 'crit', label: 'Critical Open', patch: { severity: 'CRITICAL', status: 'OPEN' } },
  { id: 'accidents', label: 'Accidents', patch: { eventType: 'ACCIDENT' } },
  { id: 'unack', label: 'Needs Triage', patch: { status: 'OPEN' } },
  { id: 'progress', label: 'In Progress', patch: { status: 'IN_PROGRESS' } },
];

function FiltersBar({ filters, onChange, count, showChips }) {
  const activeView = (v) => Object.entries(v.patch).every(([k, val]) => filters[k] === val) &&
    Object.keys(filters).filter((k) => ['severity', 'status', 'eventType'].includes(k) && filters[k]).length === Object.keys(v.patch).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {showChips && (
        <div className="row" style={{ gap: 9, flexWrap: 'wrap' }}>
          <span className="label-caps" style={{ marginRight: 2 }}>Saved</span>
          {SAVED_VIEWS.map((v) => (
            <button key={v.id} className={`chip ${activeView(v) ? 'on' : ''}`}
              onClick={() => onChange(activeView(v) ? { severity: undefined, status: undefined, eventType: undefined } : { severity: undefined, status: undefined, eventType: undefined, ...v.patch })}>
              {v.label}
            </button>
          ))}
        </div>
      )}
      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
        <div className="row" style={{ gap: 8, flex: 1, minWidth: 200 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Icons.Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input className="field" style={{ width: '100%', paddingLeft: 34 }} placeholder="Search device or location…"
              value={filters.q || ''} onChange={(e) => onChange({ q: e.target.value || undefined })} />
          </div>
        </div>
        <select className="field" value={filters.severity || ''} onChange={(e) => onChange({ severity: e.target.value || undefined })}>
          <option value="">All severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="field" value={filters.status || ''} onChange={(e) => onChange({ status: e.target.value || undefined })}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="field" value={filters.eventType || ''} onChange={(e) => onChange({ eventType: e.target.value || undefined })}>
          <option value="">All types</option>
          {EVENT_TYPES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <span className="spacer" />
        <span className="label-caps" style={{ alignSelf: 'center' }}>{count} results</span>
      </div>
    </div>
  );
}

// ---------- Incident table ----------
const NEXT_STATUS = { OPEN: 'ACKNOWLEDGED', ACKNOWLEDGED: 'IN_PROGRESS', IN_PROGRESS: 'RESOLVED', RESOLVED: null };
const NEXT_LABEL = { OPEN: 'Ack', ACKNOWLEDGED: 'Start', IN_PROGRESS: 'Resolve', RESOLVED: null };

function IncidentTable({ incidents, onSelect, selectedId, density, colorMode, onAdvance, inlineActions }) {
  if (incidents.length === 0) {
    return <div className="faint mono" style={{ textAlign: 'center', padding: 48, fontSize: 12 }}>No incidents match these filters.</div>;
  }
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th style={{ width: 4, padding: 0 }}></th>
          <th>Severity</th>
          <th>Event</th>
          <th>Location</th>
          <th>Device</th>
          <th>Status</th>
          <th>Occurred</th>
          {inlineActions && <th style={{ textAlign: 'right' }}>Action</th>}
        </tr>
      </thead>
      <tbody>
        {incidents.map((inc) => {
          const EvIcon = EVENT_ICONS[inc.eventType] || Icons.Alert;
          const next = NEXT_STATUS[inc.status];
          return (
            <tr key={inc.id} className={selectedId === inc.id ? 'sel' : ''} onClick={() => onSelect(inc)}>
              <td style={{ padding: 0 }}>
                <div className={`sevbar-${inc.severity}`} style={{ width: 4, height: density === 'compact' ? 30 : 36, borderRadius: 4, margin: '0 auto' }} />
              </td>
              <td><SeverityBadge severity={inc.severity} mono={colorMode === 'mono'} /></td>
              <td>
                <span className="row" style={{ gap: 8 }}>
                  <span style={{ color: colorMode === 'mono' ? 'var(--text-soft)' : SEV_COLOR[inc.severity] }}><EvIcon size={16} /></span>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{inc.eventType.replace('_', ' ')}</span>
                </span>
              </td>
              <td style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inc.location}</td>
              <td className="mono faint" style={{ fontSize: 11 }}>{inc.deviceId}</td>
              <td><StatusBadge status={inc.status} /></td>
              <td className="mono faint" style={{ fontSize: 11 }}>{relTime(inc.occurredAt)}</td>
              {inlineActions && (
                <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                  {next ? (
                    <button className="btn" style={{ padding: '6px 11px', fontSize: 11 }} onClick={() => onAdvance(inc.id, next)}>
                      <Icons.Check size={13} />{NEXT_LABEL[inc.status]}
                    </button>
                  ) : (
                    <span className="label-caps" style={{ color: 'var(--success)' }}><Icons.Check size={13} style={{ verticalAlign: -2 }} /> Done</span>
                  )}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ---------- Detail content (shared) ----------
function DetailBody({ incident, onAdvance, onSetStatus }) {
  const EvIcon = EVENT_ICONS[incident.eventType] || Icons.Alert;
  const rows = [
    ['Incident ID', <span className="mono">{incident.id}</span>],
    ['Device', <span className="mono">{incident.deviceId}</span>],
    ['Location', incident.location],
    ['Event type', incident.eventType.replace('_', ' ')],
    ['Opened', fmtTime(incident.occurredAt)],
    ['Last update', relTime(incident.lastEventAt)],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="row" style={{ gap: 14 }}>
        <span className="neu-raise" style={{ width: 52, height: 52, borderRadius: 'var(--radius)', display: 'grid', placeItems: 'center', color: SEV_COLOR[incident.severity], flexShrink: 0 }}>
          <EvIcon size={26} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="row" style={{ gap: 8, marginBottom: 5 }}>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{incident.location}</div>
        </div>
      </div>

      <div className="neu-sunk" style={{ borderRadius: 'var(--radius)', padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 18px' }}>
        {rows.map(([k, v]) => (
          <div key={k}>
            <div className="label-caps" style={{ marginBottom: 3 }}>{k}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="label-caps" style={{ marginBottom: 14 }}>Status Timeline</div>
        <div className="timeline">
          {incident.events.slice().reverse().map((ev) => (
            <div key={ev.id} className="tl-item">
              <span className="tl-dot" />
              <div className="row" style={{ gap: 8 }}>
                <StatusBadge status={ev.status} />
                <span className="faint mono" style={{ fontSize: 10.5 }}>{fmtTime(ev.occurredAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="label-caps" style={{ marginBottom: 10 }}>Update Status</div>
        <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
          {STATUSES.map((s) => (
            <button key={s} className={`chip ${incident.status === s ? 'on' : ''}`} onClick={() => onSetStatus(incident.id, s)}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        {NEXT_STATUS[incident.status] && (
          <button className="btn btn-accent" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} onClick={() => onAdvance(incident.id, NEXT_STATUS[incident.status])}>
            <Icons.Check size={15} /> Advance to {NEXT_STATUS[incident.status].replace('_', ' ')}
          </button>
        )}
      </div>
    </div>
  );
}

function DetailHeader({ onClose }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', padding: 'calc(var(--u)*2.5) calc(var(--u)*3)', flexShrink: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="label-caps" style={{ lineHeight: 1 }}>Incident Detail</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>Case Review</div>
      </div>
      <button className="btn btn-icon" onClick={onClose}><Icons.X size={16} /></button>
    </div>
  );
}

function Detail({ incident, mode, onClose, onAdvance, onSetStatus }) {
  if (!incident) return null;
  const body = (
    <div style={{ padding: '0 calc(var(--u)*3) calc(var(--u)*3)', overflowY: 'auto' }}>
      <DetailBody incident={incident} onAdvance={onAdvance} onSetStatus={onSetStatus} />
    </div>
  );

  if (mode === 'inline') {
    return (
      <div className="card fade-in" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
        <DetailHeader onClose={onClose} />
        {body}
      </div>
    );
  }

  if (mode === 'modal') {
    return (
      <>
        <div className="scrim" onClick={onClose} />
        <div className="modal">
          <DetailHeader onClose={onClose} />
          {body}
        </div>
      </>
    );
  }

  // drawer
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer">
        <DetailHeader onClose={onClose} />
        {body}
      </div>
    </>
  );
}

Object.assign(window, { Sidebar, LiveTicker, FiltersBar, IncidentTable, Detail, SAVED_VIEWS });
