import { useEffect, useState } from 'react';
import { Generator } from './components/Generator';
import { NavId, Sidebar } from './components/Sidebar';
import { ApiReference } from './docs/ApiReference';
import { Architecture } from './docs/Architecture';
import { DataModel } from './docs/DataModel';
import { Deployment } from './docs/Deployment';
import { DesignDecisions } from './docs/DesignDecisions';
import { Overview } from './docs/Overview';
import { ScaleBottlenecks } from './docs/ScaleBottlenecks';
import { TechStack } from './docs/TechStack';
import { Icons } from './lib/icons';
import { API_URL } from './config';
import { RunConfig, useSimulator } from './hooks/useSimulator';

const DEFAULTS: RunConfig = {
  apiUrl: API_URL,
  mode: 'oneshot',
  count: 100,
  batchSize: 50,
  rate: 0,
  interval: 2,
  progressPct: 60,
  outOfOrder: false,
  overrides: {},
};

const META: Record<NavId, { title: string; sub: string }> = {
  generator: { title: 'Incident Generator', sub: 'Drive the real ingestion pipeline' },
  overview: { title: 'Architecture Guide', sub: 'How this platform is built' },
  architecture: { title: 'Architecture', sub: 'System map & ingestion flow' },
  datamodel: { title: 'Data Model', sub: 'Cases, timeline & the indexes' },
  api: { title: 'API Reference', sub: 'Endpoints, SSE & write paths' },
  decisions: { title: 'Design Decisions', sub: 'The trade-offs behind the build' },
  tech: { title: 'Tech Stack', sub: 'What each tool does, and why' },
  deployment: { title: 'Deployment & Hosting', sub: 'Where each part runs' },
  scale: { title: 'Scale & Bottlenecks', sub: 'From 100 to 100,000 devices' },
};

const DOCS_IDS: NavId[] = [
  'overview', 'architecture', 'datamodel', 'api', 'decisions', 'tech', 'deployment', 'scale',
];

// Map the URL path to a view and back, so the docs are directly linkable (e.g. /docs,
// /docs/architecture). Generator stays at /. SPA fallback (netlify.toml + Vite) serves these.
function pathToNav(pathname: string): NavId {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/docs') return 'overview';
  if (path.startsWith('/docs/')) {
    const id = path.slice('/docs/'.length) as NavId;
    return DOCS_IDS.includes(id) ? id : 'overview';
  }
  return 'generator';
}

function navToPath(nav: NavId): string {
  if (nav === 'generator') return '/';
  if (nav === 'overview') return '/docs';
  return `/docs/${nav}`;
}

export default function App() {
  const [config, setConfig] = useState<RunConfig>(DEFAULTS);
  const [nav, setNav] = useState<NavId>(() => pathToNav(window.location.pathname));
  const sim = useSimulator();
  const meta = META[nav];

  // Navigate + reflect the view in the address bar so links like /docs are shareable.
  const go = (id: NavId) => {
    setNav(id);
    const path = navToPath(id);
    if (path !== window.location.pathname) window.history.pushState(null, '', path);
  };

  useEffect(() => {
    const onPop = () => setNav(pathToNav(window.location.pathname));
    window.addEventListener('popstate', onPop);
    // Normalize the address bar to the canonical path for the resolved view.
    const canonical = navToPath(pathToNav(window.location.pathname));
    if (canonical !== window.location.pathname) window.history.replaceState(null, '', canonical);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <div className="app">
      <Sidebar active={nav} onNav={go} running={sim.running} opened={sim.opened} />
      <main className="main">
        <header className="topbar">
          <div>
            <h1>{meta.title}</h1>
            <div className="sub">{meta.sub}</div>
          </div>
          {nav === 'generator' && (
            <ApiEndpoint
              value={config.apiUrl}
              disabled={sim.running}
              onChange={(apiUrl) => setConfig({ ...config, apiUrl })}
            />
          )}
        </header>

        <div className="scroll" key={nav}>
          {nav === 'generator' && <Generator config={config} onChange={setConfig} sim={sim} />}
          {nav === 'overview' && <Overview onNav={go} />}
          {nav === 'architecture' && <Architecture />}
          {nav === 'datamodel' && <DataModel />}
          {nav === 'api' && <ApiReference />}
          {nav === 'decisions' && <DesignDecisions />}
          {nav === 'tech' && <TechStack />}
          {nav === 'deployment' && <Deployment />}
          {nav === 'scale' && <ScaleBottlenecks />}
        </div>
      </main>
    </div>
  );
}

function ApiEndpoint({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div className="row gap" style={{ gap: 8 }}>
        <input
          className="field mono"
          autoFocus
          style={{ width: 280 }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onChange(draft.trim());
              setEditing(false);
            }
            if (e.key === 'Escape') setEditing(false);
          }}
        />
        <button
          className="btn btn-icon btn-accent"
          title="Save"
          onClick={() => {
            onChange(draft.trim());
            setEditing(false);
          }}
        >
          <Icons.Check size={14} />
        </button>
        <button className="btn btn-icon" title="Cancel" onClick={() => setEditing(false)}>
          <Icons.X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="row gap" style={{ gap: 8 }}>
      <span className="label-caps">API endpoint</span>
      <span className="chip mono" style={{ cursor: 'default' }}>
        {value}
      </span>
      <button
        className="btn btn-icon"
        title="Edit endpoint"
        disabled={disabled}
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        <Icons.Edit size={14} />
      </button>
    </div>
  );
}
