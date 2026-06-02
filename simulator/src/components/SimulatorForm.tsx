import { ReactNode } from 'react';
import { Mode, RunConfig } from '../hooks/useSimulator';
import { EVENT_TYPES, Overrides, ROADS, SEVERITIES } from '../types';

interface Props {
  config: RunConfig;
  onChange: (config: RunConfig) => void;
  disabled: boolean;
}

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100';

const COUNT_PRESETS = [100, 1000, 10000];

export function SimulatorForm({ config, onChange, disabled }: Props) {
  const set = (patch: Partial<RunConfig>) => onChange({ ...config, ...patch });
  const setOverride = (patch: Partial<Overrides>) =>
    onChange({ ...config, overrides: { ...config.overrides, ...patch } });

  return (
    <div className="space-y-5">
      <Field label="Backend endpoint">
        <input
          className={inputClass}
          placeholder="http://localhost:4000/api"
          disabled={disabled}
          value={config.apiUrl}
          onChange={(e) => set({ apiUrl: e.target.value })}
        />
      </Field>

      <div className="flex gap-2">
        {(['oneshot', 'continuous'] as Mode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            disabled={disabled}
            onClick={() => set({ mode })}
            className={`rounded-md px-3 py-1.5 text-sm ${
              config.mode === mode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {mode === 'oneshot' ? 'One-shot' : 'Continuous'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {config.mode === 'oneshot' ? (
          <>
            <Field label="Count">
              <input
                type="number"
                min={1}
                className={inputClass}
                disabled={disabled}
                value={config.count}
                onChange={(e) => set({ count: Number(e.target.value) })}
              />
              <div className="mt-1 flex gap-1">
                {COUNT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={disabled}
                    onClick={() => set({ count: preset })}
                    className={`rounded px-2 py-0.5 text-xs ${
                      config.count === preset
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Rate (target incidents/sec, 0 = max)">
              <input
                type="number"
                min={0}
                className={inputClass}
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
              className={inputClass}
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
            className={inputClass}
            disabled={disabled}
            value={config.batchSize}
            onChange={(e) => set({ batchSize: Number(e.target.value) })}
          />
        </Field>
      </div>

      <p className="text-xs text-slate-400">
        Batch size = incidents per request (≤ 1000). Rate = target incidents/sec
        (best-effort — actual throughput is bounded by the backend; the live rate is shown
        below).
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Progress % (cases advanced through lifecycle)">
          <input
            type="number"
            min={0}
            max={100}
            className={inputClass}
            disabled={disabled}
            value={config.progressPct}
            onChange={(e) => set({ progressPct: Number(e.target.value) })}
          />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
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
        <p className="text-sm font-semibold text-slate-700">
          Case attributes <span className="font-normal text-slate-400">(blank = random)</span>
        </p>
        <div className="mt-2 grid grid-cols-2 gap-4">
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
              className={inputClass}
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
    <label className="block">
      <span className="block text-sm font-medium text-slate-600">{label}</span>
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
        className={inputClass}
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
