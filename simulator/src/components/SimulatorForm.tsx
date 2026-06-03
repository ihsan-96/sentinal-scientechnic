import { ReactNode } from 'react';
import { Mode, RunConfig } from '../hooks/useSimulator';
import { EVENT_TYPES, Overrides, ROADS, SEVERITIES } from '../types';

interface Props {
  config: RunConfig;
  onChange: (config: RunConfig) => void;
  disabled: boolean;
}

const COUNT_PRESETS = [100, 1000, 10000];

export function SimulatorForm({ config, onChange, disabled }: Props) {
  const set = (patch: Partial<RunConfig>) => onChange({ ...config, ...patch });
  const setOverride = (patch: Partial<Overrides>) =>
    onChange({ ...config, overrides: { ...config.overrides, ...patch } });

  return (
    <div className="col" style={{ gap: 20 }}>
      <div>
        <span className="label-caps">Mode</span>
        <div className="seg" style={{ marginTop: 8 }}>
          {(['oneshot', 'continuous'] as Mode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={disabled}
              className={config.mode === mode ? 'on' : ''}
              onClick={() => set({ mode })}
            >
              {mode === 'oneshot' ? 'One-shot' : 'Continuous'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {config.mode === 'oneshot' ? (
          <>
            <Field label="Count">
              <input
                type="number"
                min={1}
                className="field"
                disabled={disabled}
                value={config.count}
                onChange={(e) => set({ count: Number(e.target.value) })}
              />
              <div className="tag-row" style={{ marginTop: 8 }}>
                {COUNT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={disabled}
                    className={`chip${config.count === preset ? ' on' : ''}`}
                    onClick={() => set({ count: preset })}
                  >
                    {preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Rate (target/sec · 0 = max)">
              <input
                type="number"
                min={0}
                className="field"
                disabled={disabled}
                value={config.rate}
                onChange={(e) => set({ rate: Number(e.target.value) })}
              />
            </Field>
          </>
        ) : (
          <Field label="Interval (seconds)">
            <input
              type="number"
              min={0.2}
              step={0.1}
              className="field"
              disabled={disabled}
              value={config.interval}
              onChange={(e) => set({ interval: Number(e.target.value) })}
            />
          </Field>
        )}
        <Field label="Batch size">
          <input
            type="number"
            min={1}
            max={1000}
            className="field"
            disabled={disabled}
            value={config.batchSize}
            onChange={(e) => set({ batchSize: Number(e.target.value) })}
          />
        </Field>
      </div>

      <p className="faint mono" style={{ fontSize: 11, lineHeight: 1.6, margin: 0 }}>
        Batch size = incidents per request (≤ 1000). Rate is best-effort; actual throughput is
        bounded by the backend; the live rate is shown after you start.
      </p>

      <div className="grid-2">
        <Field label="Progress % (cases advanced through lifecycle)">
          <input
            type="number"
            min={0}
            max={100}
            className="field"
            disabled={disabled}
            value={config.progressPct}
            onChange={(e) => set({ progressPct: Number(e.target.value) })}
          />
        </Field>
        <label className="chip" style={{ alignSelf: 'end', justifyContent: 'flex-start' }}>
          <input
            type="checkbox"
            disabled={disabled}
            checked={config.outOfOrder}
            onChange={(e) => set({ outOfOrder: e.target.checked })}
          />
          Inject out-of-order events
        </label>
      </div>

      <div>
        <span className="label-caps">
          Case attributes <span className="faint">· blank = random</span>
        </span>
        <div className="grid-2" style={{ marginTop: 10 }}>
          <Select
            label="Severity"
            value={config.overrides.severity ?? ''}
            options={SEVERITIES}
            disabled={disabled}
            onChange={(severity) => setOverride({ severity })}
          />
          <Select
            label="Event type"
            value={config.overrides.eventType ?? ''}
            options={EVENT_TYPES}
            disabled={disabled}
            onChange={(eventType) => setOverride({ eventType })}
          />
          <Select
            label="Location"
            value={config.overrides.location ?? ''}
            options={ROADS}
            disabled={disabled}
            onChange={(location) => setOverride({ location })}
          />
          <Field label="Device">
            <input
              className="field"
              placeholder="random"
              disabled={disabled}
              value={config.overrides.device ?? ''}
              onChange={(e) => setOverride({ device: e.target.value || undefined })}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="col" style={{ gap: 8 }}>
      <span className="label-caps">{label}</span>
      {children}
    </label>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: T | '';
  options: readonly T[];
  disabled: boolean;
  onChange: (value: T | undefined) => void;
}) {
  return (
    <Field label={label}>
      <select
        className="field"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange((e.target.value || undefined) as T | undefined)}
      >
        <option value="">Any</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace('_', ' ')}
          </option>
        ))}
      </select>
    </Field>
  );
}
