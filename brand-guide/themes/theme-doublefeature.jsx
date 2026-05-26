/* THEME 05 — DOUBLE FEATURE
   Reference: hand-drawn cinema doodles + grindhouse newsprint posters.
   Newsprint cream + ink black + single signal red. High contrast, halftone, condensed sans. */

const DOUBLE_TOKENS = {
  bg: '#EFE6D2',
  fg: '#15110C',
  surface: '#FFFFFF',
  accent: '#C92F2A',
  ink: '#15110C',
  mute: '#6E6657',
  border: '#15110C',
  radius: '0px',
  displayFont: '"Oswald", "Anton", sans-serif',
  uiFont: '"Inter", system-ui, sans-serif',
  monoFont: '"JetBrains Mono", monospace',
  displayTracking: '0.01em',
  grain: 0.1,
  grainTint: '#000',
};

function HalftoneStrip({ height = 16, color = '#15110C' }) {
  const dots = Array.from({ length: 30 });
  return (
    <div style={{ height, display: 'flex', alignItems: 'center', gap: 4 }}>
      {dots.map((_, i) => {
        const r = 2 + (i % 5) * 1.4;
        return <span key={i} style={{ width: r * 2, height: r * 2, borderRadius: '50%', background: color, opacity: 0.6 + (i % 3) * 0.13 }}/>;
      })}
    </div>
  );
}

function ThemeDoubleFeature() {
  const t = DOUBLE_TOKENS;
  return (
    <ThemeCard tokens={t}>
      <ThemeHeader
        tokens={t}
        idx="5"
        name={<span>Double<span style={{ color: t.accent }}>·</span>Feature</span>}
        tagline="Newsprint grindhouse. Ivory paper, ink-black rules, one signal red. Condensed display type, halftone dots, ticket-stub edges. Brutal contrast, modern restraint."
      />

      <Swatches tokens={t} items={[
        { label: 'NEWSPRINT', hex: '#EFE6D2', fg: '#15110C' },
        { label: 'PAPER', hex: '#FFFFFF', fg: '#15110C' },
        { label: 'INK', hex: '#15110C', fg: '#EFE6D2' },
        { label: 'SIGNAL', hex: '#C92F2A', fg: '#EFE6D2' },
        { label: 'MUTE', hex: '#6E6657', fg: '#EFE6D2' },
      ]}/>

      <div>
        <Label tokens={t}>TYPE</Label>
        <div style={{ marginTop: 10, padding: 22, background: t.surface, border: `2px solid ${t.ink}`, position: 'relative' }}>
          <HalftoneStrip color={t.ink}/>
          <div style={{ fontFamily: t.displayFont, fontSize: 64, lineHeight: 0.88, color: t.ink, letterSpacing: '0.01em', fontWeight: 700, marginTop: 8 }}>
            NOW SHOWING
          </div>
          <div style={{ fontFamily: t.displayFont, fontSize: 22, color: t.accent, letterSpacing: '0.06em', fontWeight: 500 }}>
            + ONE MORE — DOUBLE FEATURE
          </div>
          <div style={{ fontFamily: t.uiFont, fontSize: 13, marginTop: 10, color: t.ink, opacity: 0.85 }}>
            The quick brown fox jumps over the lazy dog — UI body
          </div>
          <div style={{ fontFamily: t.monoFont, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.mute, marginTop: 6 }}>
            REEL 03 · 00:42 · TAKE 02
          </div>
        </div>
      </div>

      <div>
        <Label tokens={t}>CONTROLS</Label>
        <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={{
            fontFamily: t.displayFont, fontWeight: 700, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '12px 22px', background: t.accent, color: t.surface, border: `2px solid ${t.ink}`, borderRadius: 0,
            cursor: 'pointer'
          }}>Continue Working ▸</button>
          <button style={{
            fontFamily: t.displayFont, fontWeight: 500, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '11px 18px', background: t.surface, color: t.ink, border: `2px solid ${t.ink}`, borderRadius: 0, cursor: 'pointer'
          }}>Edit Project</button>
          {/* ticket stub status */}
          <span style={{ position: 'relative', fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.22em', padding: '6px 14px', background: t.accent, color: t.surface, textTransform: 'uppercase' }}>
            WORKING
          </span>
          <span style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.22em', padding: '6px 10px', background: t.surface, color: t.ink, textTransform: 'uppercase', border: `1.5px solid ${t.ink}` }}>DRAFT · v3</span>
        </div>
      </div>

      <AppliedSample tokens={t}>
        <div style={{ background: t.surface, color: t.ink, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `2px solid ${t.ink}` }}>
          <div style={{ width: 28, height: 28, background: t.ink, display: 'grid', placeItems: 'center', color: t.accent, fontFamily: t.displayFont, fontSize: 18, fontWeight: 700 }}>D</div>
          <div style={{ fontFamily: t.displayFont, fontSize: 22, letterSpacing: '0.06em', color: t.ink, fontWeight: 700 }}>DIREKTA</div>
          <div style={{ marginLeft: 18, padding: '4px 12px', background: t.bg, display: 'flex', flexDirection: 'column', gap: 0, border: `1.5px solid ${t.ink}` }}>
            <div style={{ fontFamily: t.uiFont, fontSize: 12, fontWeight: 700 }}>The Lisbon Pact</div>
            <div style={{ fontFamily: t.monoFont, fontSize: 9, color: t.mute, letterSpacing: '0.16em' }}>SHORT · 8 MIN</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: t.monoFont, fontSize: 9, color: t.ink, letterSpacing: '0.22em', fontWeight: 700 }}>● SAVED</span>
            <div style={{ width: 28, height: 28, background: t.accent, color: t.surface, fontFamily: t.uiFont, fontWeight: 800, fontSize: 11, display: 'grid', placeItems: 'center' }}>MD</div>
          </div>
        </div>
        <div style={{ background: t.bg, padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { n: '01', label: 'SCRIPT', sub: 'Bible built · 46 beats', pct: 100, status: 'DONE' },
            { n: '02', label: 'CASTING', sub: '4 of 6 souls trained', pct: 66, status: 'LIVE' },
            { n: '03', label: 'BOARDS', sub: '15 of 47 frames', pct: 31, status: 'LIVE' },
          ].map(s => (
            <div key={s.n} style={{ background: t.surface, border: `2px solid ${t.ink}`, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.22em', color: t.mute, fontWeight: 700 }}>{s.n} / 05</span>
                <span style={{ fontFamily: t.monoFont, fontSize: 8, letterSpacing: '0.18em', background: s.status === 'DONE' ? t.ink : t.accent, color: t.surface, padding: '2px 6px' }}>{s.status}</span>
              </div>
              <div style={{ fontFamily: t.displayFont, fontSize: 22, color: t.ink, letterSpacing: '0.04em', fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontFamily: t.uiFont, fontSize: 11, color: t.mute }}>{s.sub}</div>
              <div style={{ height: 6, background: t.bg, border: `1px solid ${t.ink}`, overflow: 'hidden' }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: t.accent }}/>
              </div>
            </div>
          ))}
        </div>
      </AppliedSample>
    </ThemeCard>
  );
}

window.ThemeDoubleFeature = ThemeDoubleFeature;
