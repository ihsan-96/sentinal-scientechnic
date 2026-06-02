import { useEffect, useState } from 'react';
import { clearAll } from '../api';

interface Props {
  apiUrl: string;
  disabled: boolean;
}

const WARNING =
  'This permanently deletes ALL incidents, drains the ingestion queue, and resets the stats cache. Continue?';

export function ClearData({ apiUrl, disabled }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const onClear = async () => {
    if (!window.confirm(WARNING)) return;
    setBusy(true);
    setMessage(null);
    try {
      const cleared = await clearAll(apiUrl);
      setMessage(`Cleared ${cleared.toLocaleString()} incidents.`);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 border-t border-slate-200 pt-5">
      <p className="text-sm font-semibold text-red-700">Danger zone</p>
      <button
        onClick={onClear}
        disabled={disabled || busy}
        className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-40"
      >
        {busy ? 'Clearing…' : 'Clear all data'}
      </button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}
