import { useEffect, useState } from 'react';

interface Props {
  running: boolean;
  opened: number;
  updates: number;
  startedAt: number | null;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
}

export function RunPanel({ running, opened, updates, startedAt, error, onStart, onStop }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const elapsed = startedAt ? (now - startedAt) / 1000 : 0;
  const rate = elapsed > 0 ? Math.round(opened / elapsed) : 0;

  return (
    <div className="space-y-3 border-t border-slate-200 pt-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onStart}
          disabled={running}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Start
        </button>
        <button
          onClick={onStop}
          disabled={!running}
          className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
        >
          Stop
        </button>
        <span className="flex items-center gap-2 text-sm text-slate-600">
          <span className={`h-2.5 w-2.5 rounded-full ${running ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          {running ? 'Running' : 'Idle'} · {opened.toLocaleString()} cases ·{' '}
          {updates.toLocaleString()} updates · ~{rate.toLocaleString()}/s actual
        </span>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
