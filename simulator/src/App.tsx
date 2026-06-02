import { useState } from 'react';
import { ClearData } from './components/ClearData';
import { RunPanel } from './components/RunPanel';
import { SimulatorForm } from './components/SimulatorForm';
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

export default function App() {
  const [config, setConfig] = useState<RunConfig>(DEFAULTS);
  const sim = useSimulator();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <header>
          <h1 className="text-xl font-semibold text-slate-900">Traffic Incident Simulator</h1>
          <p className="text-sm text-slate-500">
            Generates incidents in the browser → POST <code>{config.apiUrl}/incidents/batch</code>
          </p>
        </header>

        <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6">
          <SimulatorForm config={config} onChange={setConfig} disabled={sim.running} />
          <RunPanel
            running={sim.running}
            opened={sim.opened}
            updates={sim.updates}
            startedAt={sim.startedAt}
            error={sim.error}
            onStart={() => sim.start(config)}
            onStop={sim.stop}
          />
          <ClearData apiUrl={config.apiUrl} disabled={sim.running} />
        </div>
      </div>
    </div>
  );
}
