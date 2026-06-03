import { useState } from 'react';
import { Icons } from '../lib/icons';
import { TECH } from './content';

export function TechStack() {
  const [sel, setSel] = useState(0);
  const active = TECH[sel];
  const Icon = Icons[active.icon] ?? Icons.Activity;

  return (
    <>
      <div>
        <div className="eyebrow">Chapter 03 · The toolbox</div>
        <h2 className="chapter-title">Tech stack</h2>
        <p className="lead">
          Each piece earns its place. Select one to see what it does in this system and why it was
          chosen over the obvious alternative.
        </p>
      </div>

      <div className="grid-3">
        {TECH.map((t, idx) => {
          const TIcon = Icons[t.icon] ?? Icons.Activity;
          const on = idx === sel;
          return (
            <div
              key={t.name}
              className="card tech"
              onClick={() => setSel(idx)}
              style={on ? { boxShadow: 'inset 0 0 0 2px var(--accent)' } : undefined}
            >
              <span className="tech-mark neu-raise-sm">
                <TIcon size={20} />
              </span>
              <div>
                <div className="card-title">{t.name}</div>
                <div className="label-caps" style={{ marginTop: 4 }}>
                  {t.tag}
                </div>
              </div>
              <div className="prose" style={{ fontSize: 12 }}>
                {t.role}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card fade-in" key={active.name}>
        <div className="row gap2">
          <span className="tech-mark neu-raise-sm" style={{ width: 48, height: 48 }}>
            <Icon size={24} />
          </span>
          <div>
            <div className="card-title" style={{ fontSize: 16 }}>
              {active.name}
            </div>
            <div className="label-caps" style={{ marginTop: 4 }}>
              {active.tag}
            </div>
          </div>
        </div>
        <div className="grid-2" style={{ marginTop: 18 }}>
          <div>
            <div className="label-caps">Role here</div>
            <div className="prose" style={{ marginTop: 6 }}>
              {active.role}
            </div>
          </div>
          <div>
            <div className="label-caps" style={{ color: 'var(--accent)' }}>
              Why chosen
            </div>
            <div className="prose" style={{ marginTop: 6, color: 'var(--text)' }}>
              {active.why}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
