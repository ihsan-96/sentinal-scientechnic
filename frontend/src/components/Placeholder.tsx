import { Icons } from '../lib/icons';

/** Labeled "Future expansion" page for nav sections not yet backed by the API. */
export function Placeholder({ title }: { title: string }) {
  return (
    <div className="card" style={{ display: 'grid', placeItems: 'center', minHeight: 360, textAlign: 'center' }}>
      <div>
        <div
          className="neu-sunk"
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 18px',
            color: 'var(--text-faint)',
          }}
        >
          <Icons.Sliders size={28} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{title}</div>
        <div className="label-caps" style={{ marginTop: 10, color: 'var(--accent)' }}>
          Future expansion
        </div>
        <div className="faint mono" style={{ fontSize: 12, marginTop: 8, maxWidth: 340, lineHeight: 1.6 }}>
          This section is planned for a future release. The Overview and Incidents views are fully interactive.
        </div>
      </div>
    </div>
  );
}
