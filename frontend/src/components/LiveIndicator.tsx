interface Props {
  connected: boolean;
}

export function LiveIndicator({ connected }: Props) {
  return (
    <div
      className="row"
      style={{
        gap: 8,
        fontFamily: 'var(--font-mono)',
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: '0.04em',
        color: 'var(--text-soft)',
      }}
    >
      <span className={`live-dot${connected ? '' : ' off'}`} />
      {connected ? 'LIVE' : 'OFFLINE'}
    </div>
  );
}
