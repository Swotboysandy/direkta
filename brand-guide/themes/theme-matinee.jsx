/* THEME 01 — MATINEE
   Reference: vintage tin cinema sign (cream / deep teal / red).
   Modern flat surfaces, restrained grain, pressed display type. */

const MATINEE_TOKENS = {
  bg: '#1E443F',
  fg: '#F4ECD8',
  surface: '#F4ECD8',
  accent: '#D63A2F',
  ink: '#1A2A28',
  mute: '#7A9690',
  border: '#0F2A27',
  radius: '4px',
  displayFont: '"Alfa Slab One", "Anton", serif',
  uiFont: '"DM Sans", system-ui, sans-serif',
  monoFont: '"JetBrains Mono", monospace',
  displayTracking: '0.01em',
  grain: 0.12,
  grainTint: '#000',
};

function ThemeMatinee() {
  const t = MATINEE_TOKENS;
  return (
    <ThemeCard tokens={t}>
      <ThemeHeader
        tokens={t}
        idx="1"
        name={<span>Matinee<span style={{ color: '#7BC0B3' }}>.</span></span>}
        tagline="Tin-sign cinema. Cream over deep teal, with a tomato-red call to action. Pressed slab headlines, restrained grain — vintage poster bones inside a flat modern layout."
      />

      <Swatches tokens={t} items={[
        { label: 'TEAL', hex: '#1E443F', fg: '#F4ECD8' },
        { label: 'CREAM', hex: '#F4ECD8', fg: '#1E443F' },
        { label: 'RED', hex: '#D63A2F', fg: '#F4ECD8' },
        { label: 'MINT', hex: '#7BC0B3', fg: '#1A2A28' },
        { label: 'INK', hex: '#0F2A27', fg: '#F4ECD8' },
      ]}/>

      {/* type specimen with cream card */}
      <div>
        <Label tokens={t}>TYPE</Label>
        <div style={{ marginTop: 10, padding: 22, background: t.surface, color: t.ink, borderRadius: t.radius, border: `1px solid ${t.border}`, position: 'relative' }}>
          {/* scallop strip */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: `linear-gradient(90deg, ${t.accent} 0 14px, transparent 14px 22px) repeat-x`, backgroundSize: '22px 8px' }}/>
          <div style={{ fontFamily: t.displayFont, fontSize: 56, lineHeight: 0.92, color: t.accent, textShadow: `2px 2px 0 #7BC0B3`, marginTop: 6 }}>
            NOW SHOWING
          </div>
          <div style={{ fontFamily: t.uiFont, fontSize: 13, marginTop: 8, color: t.ink, opacity: 0.85 }}>
            The quick brown fox jumps over the lazy dog — UI body
          </div>
          <div style={{ fontFamily: t.monoFont, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5C7975', marginTop: 6 }}>
            REEL 03 · 00:42 · TAKE 02
          </div>
        </div>
      </div>

      {/* Controls */}
      <div>
        <Label tokens={t}>CONTROLS</Label>
        <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={{
            fontFamily: t.displayFont, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '12px 22px', background: t.accent, color: t.fg, border: 'none', borderRadius: 20,
            boxShadow: `0 3px 0 #8C2620`,
            cursor: 'pointer'
          }}>Continue Working</button>
          <button style={{
            fontFamily: t.uiFont, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '10px 16px', background: 'transparent', color: t.fg, border: `1.5px solid ${t.fg}`, borderRadius: 20, cursor: 'pointer'
          }}>Edit project</button>
          <span style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.18em', padding: '6px 10px', background: '#7BC0B3', color: t.ink, borderRadius: 2, textTransform: 'uppercase' }}>WORKING</span>
          <span style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.18em', padding: '6px 10px', border: `1px solid ${t.fg}`, color: t.fg, borderRadius: 2, textTransform: 'uppercase' }}>DRAFT · v3</span>
        </div>
      </div>

      <AppliedSample tokens={t}>
        {/* top bar — dark teal */}
        <div style={{ background: t.bg, color: t.fg, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${t.border}` }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: t.accent, display: 'grid', placeItems: 'center', color: t.fg, fontFamily: t.displayFont, fontSize: 14 }}>D</div>
          <div style={{ fontFamily: t.displayFont, fontSize: 18, letterSpacing: '0.08em' }}>DIREKTA</div>
          <div style={{ marginLeft: 18, padding: '6px 12px', background: '#16332F', borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontFamily: t.uiFont, fontSize: 12, fontWeight: 600 }}>The Lisbon Pact</div>
            <div style={{ fontFamily: t.monoFont, fontSize: 9, color: t.mute, letterSpacing: '0.16em' }}>SHORT · 8 MIN</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: t.monoFont, fontSize: 9, color: '#7BC0B3', letterSpacing: '0.18em' }}>● SAVED</span>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#7BC0B3', color: t.ink, fontFamily: t.uiFont, fontWeight: 700, fontSize: 11, display: 'grid', placeItems: 'center' }}>MD</div>
          </div>
        </div>
        {/* pipeline strip */}
        <div style={{ background: t.surface, color: t.ink, padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { n: '01', label: 'SCRIPT', sub: 'Bible built · 46 beats', pct: 100, status: 'DONE' },
            { n: '02', label: 'CASTING', sub: '4 of 6 souls trained', pct: 66, status: 'WORKING' },
            { n: '03', label: 'BOARDS', sub: '15 of 47 frames', pct: 31, status: 'WORKING' },
          ].map(s => (
            <div key={s.n} style={{ background: t.fg, border: `1.5px solid ${t.bg}`, padding: 14, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.22em', color: '#5C7975' }}>{s.n} / 05</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.pct === 100 ? t.accent : '#7BC0B3' }}/>
              </div>
              <div style={{ fontFamily: t.displayFont, fontSize: 18, color: t.bg, letterSpacing: '0.04em' }}>{s.label}</div>
              <div style={{ fontFamily: t.uiFont, fontSize: 10.5, color: '#3D5651' }}>{s.sub}</div>
              <div style={{ height: 4, background: '#D8CFB8', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: t.accent }}/>
              </div>
            </div>
          ))}
        </div>
      </AppliedSample>
    </ThemeCard>
  );
}

window.ThemeMatinee = ThemeMatinee;
