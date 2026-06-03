import { useEffect, useState } from 'react';
import { clearAll } from '../api';
import { Icons } from '../lib/icons';

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
    <div className="row gap" style={{ justifyContent: 'space-between' }}>
      <div className="col" style={{ gap: 4 }}>
        <span className="label-caps" style={{ color: 'var(--danger-muted)' }}>
          Danger zone
        </span>
        <span className="faint mono" style={{ fontSize: 11 }}>
          {message ?? 'Wipes every incident, the queue, and the cache.'}
        </span>
      </div>
      <button className="btn btn-danger" onClick={onClear} disabled={disabled || busy}>
        <Icons.Trash size={13} />
        {busy ? 'Clearing…' : 'Clear all data'}
      </button>
    </div>
  );
}
