export function LiveIndicator({ connected, eventCount }: { connected: boolean; eventCount: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span
        className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-slate-300'}`}
      />
      {connected ? 'Live' : 'Disconnected'}
      <span className="text-slate-400">· {eventCount} events</span>
    </div>
  );
}
