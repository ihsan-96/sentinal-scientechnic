import { RunConfig, useSimulator } from '../hooks/useSimulator';
import { ClearData } from './ClearData';
import { RunPanel } from './RunPanel';
import { SimulatorForm } from './SimulatorForm';

interface Props {
  config: RunConfig;
  onChange: (config: RunConfig) => void;
  sim: ReturnType<typeof useSimulator>;
}

export function Generator({ config, onChange, sim }: Props) {
  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-head">
          <div className="card-title">Configuration</div>
        </div>
        <SimulatorForm config={config} onChange={onChange} disabled={sim.running} />
      </div>

      <div className="col" style={{ gap: 20 }}>
        <div className="card">
          <div className="card-head">
            <div className="card-title">Run</div>
            <span className="faint mono" style={{ fontSize: 11 }}>
              {config.mode === 'oneshot' ? 'One-shot' : 'Continuous'}
            </span>
          </div>
          <RunPanel
            running={sim.running}
            opened={sim.opened}
            updates={sim.updates}
            startedAt={sim.startedAt}
            error={sim.error}
            onStart={() => sim.start(config)}
            onStop={sim.stop}
          />
        </div>

        <div className="card">
          <ClearData apiUrl={config.apiUrl} disabled={sim.running} />
        </div>
      </div>
    </div>
  );
}
