import { useState } from 'react';
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

export default function App() {
  const [config, setConfig] = useState<RunConfig>(DEFAULTS);
  const [nav, setNav] = useState<NavId>('generator');
  const sim = useSimulator();
  const meta = META[nav];

  return (
    <div className="app">
      <Sidebar active={nav} onNav={setNav} running={sim.running} opened={sim.opened} />
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
          {nav === 'overview' && <Overview onNav={setNav} />}
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
