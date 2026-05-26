/* THEME 03 — POPCORN POP
   Reference: chunky cartoon cinema icons. Cream + tomato + mustard + viridian + cocoa.
   Chunky rounded buttons, soft offset shadows, slab display type. */

const POPCORN_TOKENS = {
  bg: '#F5EDDC',
  fg: '#2A1A12',
  surface: '#FFFBF1',
  accent: '#E84A35',
  ink: '#2A1A12',
  mute: '#7A6855',
  border: '#2A1A12',
  radius: '12px',
  displayFont: '"Lilita One", "Alfa Slab One", serif',
  uiFont: '"Nunito", system-ui, sans-serif',
  monoFont: '"JetBrains Mono", monospace',
  displayTracking: '0.01em',
  grain: 0,
};

function ThemePopcorn() {
  const t = POPCORN_TOKENS;
  const offsetShadow = `4px 4px 0 ${t.ink}`;
  return (
    <ThemeCard tokens={t}>
      <ThemeHeader
        tokens={t}
        idx="3"
        name={<span>Popcorn<span style={{ color: '#F2B83C' }}>!</span></span>}
        tagline="Chunky concession-stand cartoon. Cream + tomato + mustard + viridian, sketched in thick ink outlines with offset block shadows. Friendly, tactile, almost toy-like."
      />

      <Swatches tokens={t} items={[
        { label: 'CREAM', hex: '#F5EDDC', fg: '#2A1A12' },
        { label: 'TOMATO', hex: '#E84A35', fg: '#FFFBF1' },
        { label: 'MUSTARD', hex: '#F2B83C', fg: '#2A1A12' },
        { label: 'VIRIDIAN', hex: '#3DA89B', fg: '#FFFBF1' },
        { label: 'COCOA', hex: '#2A1A12', fg: '#F5EDDC' },
      ]}/>

      <div>
        <Label tokens={t}>TYPE</Label>
        <div style={{ marginTop: 10, padding: 22, background: t.surface, borderRadius: t.radius, border: `2px solid ${t.ink}`, boxShadow: offsetShadow, position: 'relative' }}>
          <div style={{ fontFamily: t.displayFont, fontSize: 56, lineHeight: 0.92, color: t.accent, WebkitTextStroke: `2px ${t.ink}`, paintOrder: 'stroke fill' }}>
            Now Showing!
          </div>
          <div style={{ fontFamily: t.uiFont, fontSize: 13, marginTop: 10, color: t.ink, opacity: 0.85, fontWeight: 600 }}>
            The quick brown fox jumps over the lazy dog — UI body
          </div>
          <div style={{ fontFamily: t.monoFont, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.mute, marginTop: 6 }}>
            REEL 03 · 00:42 · TAKE 02
          </div>
        </div>
      </div>

      <div>
        <Label tokens={t}>CONTROLS</Label>
        <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={{
            fontFamily: t.displayFont, fontSize: 15, letterSpacing: '0.02em',
            padding: '12px 22px', background: t.accent, color: t.surface, border: `2px solid ${t.ink}`, borderRadius: 28,
            boxShadow: `4px 4px 0 ${t.ink}`,
            cursor: 'pointer'
          }}>Continue Working →</button>
          <button style={{
            fontFamily: t.uiFont, fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
            padding: '11px 18px', background: '#F2B83C', color: t.ink, border: `2px solid ${t.ink}`, borderRadius: 28,
            boxShadow: `3px 3px 0 ${t.ink}`, cursor: 'pointer'
          }}>Edit Project</button>
          <span style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.18em', padding: '6px 10px', background: '#3DA89B', color: t.surface, borderRadius: 20, textTransform: 'uppercase', border: `1.5px solid ${t.ink}` }}>● WORKING</span>
          <span style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.18em', padding: '6px 10px', background: t.surface, color: t.ink, borderRadius: 20, textTransform: 'uppercase', border: `1.5px solid ${t.ink}` }}>DRAFT v3</span>
        </div>
      </div>

      <AppliedSample tokens={t}>
        <div style={{ background: t.surface, color: t.ink, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `2px solid ${t.ink}` }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: t.accent, border: `2px solid ${t.ink}`, display: 'grid', placeItems: 'center', color: t.surface, fontFamily: t.displayFont, fontSize: 14 }}>D</div>
          <div style={{ fontFamily: t.displayFont, fontSize: 20, letterSpacing: '0.02em', color: t.ink }}>DIREKTA</div>
          <div style={{ marginLeft: 18, padding: '6px 14px', background: '#F2B83C', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 0, border: `2px solid ${t.ink}` }}>
            <div style={{ fontFamily: t.uiFont, fontSize: 12, fontWeight: 800 }}>The Lisbon Pact</div>
            <div style={{ fontFamily: t.monoFont, fontSize: 9, color: t.ink, letterSpacing: '0.14em', opacity: 0.8 }}>SHORT · 8 MIN</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontFamily: t.monoFont, fontSize: 9, color: '#3DA89B', letterSpacing: '0.18em', fontWeight: 700 }}>● SAVED</span>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#3DA89B', color: t.surface, fontFamily: t.uiFont, fontWeight: 800, fontSize: 11, display: 'grid', placeItems: 'center', border: `2px solid ${t.ink}` }}>MD</div>
          </div>
        </div>
        <div style={{ background: t.bg, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { n: '01', label: 'SCRIPT', sub: 'Bible built · 46 beats', pct: 100, color: '#3DA89B' },
            { n: '02', label: 'CASTING', sub: '4 of 6 souls trained', pct: 66, color: '#F2B83C' },
            { n: '03', label: 'BOARDS', sub: '15 of 47 frames', pct: 31, color: t.accent },
          ].map(s => (
            <div key={s.n} style={{ background: t.surface, border: `2px solid ${t.ink}`, padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 8, boxShadow: `3px 3px 0 ${t.ink}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.22em', color: t.mute, fontWeight: 600 }}>{s.n} / 05</span>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, border: `1.5px solid ${t.ink}` }}/>
              </div>
              <div style={{ fontFamily: t.displayFont, fontSize: 20, color: t.ink, letterSpacing: '0.02em' }}>{s.label}</div>
              <div style={{ fontFamily: t.uiFont, fontSize: 11, color: t.mute, fontWeight: 600 }}>{s.sub}</div>
              <div style={{ height: 8, background: '#EAD8B5', borderRadius: 4, overflow: 'hidden', border: `1px solid ${t.ink}` }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: s.color }}/>
              </div>
            </div>
          ))}
        </div>
      </AppliedSample>
    </ThemeCard>
  );
}

window.ThemePopcorn = ThemePopcorn;
