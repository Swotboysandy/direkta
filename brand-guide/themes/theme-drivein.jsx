/* THEME 02 — DRIVE-IN
   Reference: drive-in marquee + retro neon. Midnight indigo + hot pink + amber bulbs.
   Modern flat layout, glowing accents, marquee bulb motifs. */

const DRIVEIN_TOKENS = {
  bg: '#0F1640',
  fg: '#F2E4C4',
  surface: '#1A2358',
  accent: '#FF3D7F',
  ink: '#06092A',
  mute: '#7A86C8',
  border: '#252F6E',
  radius: '6px',
  displayFont: '"Monoton", "Anton", sans-serif',
  uiFont: '"Outfit", system-ui, sans-serif',
  monoFont: '"JetBrains Mono", monospace',
  displayTracking: '0.08em',
  grain: 0.06,
  grainTint: '#000',
};

function MarqueeBulbs() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 4, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '0 14px' }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#FFB347', boxShadow: '0 0 6px #FFB347' }}/>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '0 14px' }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#FFB347', boxShadow: '0 0 6px #FFB347' }}/>
        ))}
      </div>
    </div>
  );
}

function ThemeDriveIn() {
  const t = DRIVEIN_TOKENS;
  return (
    <ThemeCard tokens={t}>
      <ThemeHeader
        tokens={t}
        idx="2"
        name={<span>Drive<span style={{ color: '#FFB347' }}>·</span>In</span>}
        tagline="Marquee at dusk. Midnight indigo with hot-pink neon and incandescent amber bulbs. Modern UI bones — the retro lives in the glow."
      />

      <Swatches tokens={t} items={[
        { label: 'MIDNIGHT', hex: '#0F1640', fg: '#F2E4C4' },
        { label: 'INDIGO', hex: '#1A2358', fg: '#F2E4C4' },
        { label: 'NEON PINK', hex: '#FF3D7F', fg: '#F2E4C4' },
        { label: 'AMBER', hex: '#FFB347', fg: '#06092A' },
        { label: 'CREAM', hex: '#F2E4C4', fg: '#06092A' },
      ]}/>

      <div>
        <Label tokens={t}>TYPE</Label>
        <div style={{ marginTop: 10, padding: 24, background: t.surface, borderRadius: t.radius, border: `1px solid ${t.border}`, position: 'relative', overflow: 'hidden' }}>
          <MarqueeBulbs/>
          <div style={{ fontFamily: t.displayFont, fontSize: 52, lineHeight: 1.0, letterSpacing: '0.06em', color: '#FFB347', textShadow: '0 0 24px rgba(255,179,71,0.7), 0 0 4px rgba(255,179,71,1)', marginTop: 6 }}>
            NOW SHOWING
          </div>
          <div style={{ fontFamily: t.uiFont, fontSize: 13, marginTop: 12, color: t.fg, opacity: 0.9 }}>
            The quick brown fox jumps over the lazy dog — UI body
          </div>
          <div style={{ fontFamily: t.monoFont, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.accent, marginTop: 6 }}>
            REEL 03 · 00:42 · TAKE 02
          </div>
        </div>
      </div>

      <div>
        <Label tokens={t}>CONTROLS</Label>
        <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={{
            fontFamily: t.uiFont, fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '12px 22px', background: t.accent, color: t.fg, border: 'none', borderRadius: 28,
            boxShadow: '0 0 24px rgba(255,61,127,0.55), inset 0 -3px 0 rgba(0,0,0,0.2)',
            cursor: 'pointer'
          }}>Continue working →</button>
          <button style={{
            fontFamily: t.uiFont, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '10px 16px', background: 'transparent', color: '#FFB347', border: `1.5px solid #FFB347`, borderRadius: 28, cursor: 'pointer'
          }}>Edit project</button>
          <span style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.18em', padding: '6px 10px', background: 'transparent', color: '#FFB347', borderRadius: 3, textTransform: 'uppercase', border: '1px solid #FFB347', boxShadow: '0 0 12px rgba(255,179,71,0.4)' }}>● WORKING</span>
          <span style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.18em', padding: '6px 10px', color: t.mute, borderRadius: 3, textTransform: 'uppercase', border: `1px solid ${t.border}` }}>DRAFT · v3</span>
        </div>
      </div>

      <AppliedSample tokens={t}>
        <div style={{ background: t.ink, color: t.fg, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${t.border}` }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: t.accent, boxShadow: '0 0 12px rgba(255,61,127,0.7)', display: 'grid', placeItems: 'center', color: t.fg, fontFamily: t.displayFont, fontSize: 12 }}>D</div>
          <div style={{ fontFamily: t.displayFont, fontSize: 16, letterSpacing: '0.18em', color: '#FFB347', textShadow: '0 0 10px rgba(255,179,71,0.7)' }}>DIREKTA</div>
          <div style={{ marginLeft: 18, padding: '6px 12px', background: t.surface, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 2, border: `1px solid ${t.border}` }}>
            <div style={{ fontFamily: t.uiFont, fontSize: 12, fontWeight: 600 }}>The Lisbon Pact</div>
            <div style={{ fontFamily: t.monoFont, fontSize: 9, color: t.mute, letterSpacing: '0.16em' }}>SHORT · 8 MIN</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: t.monoFont, fontSize: 9, color: '#5BC994', letterSpacing: '0.18em' }}>● SAVED</span>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#FFB347', color: t.ink, fontFamily: t.uiFont, fontWeight: 700, fontSize: 11, display: 'grid', placeItems: 'center' }}>MD</div>
          </div>
        </div>
        <div style={{ background: t.bg, padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { n: '01', label: 'SCRIPT', sub: 'Bible built · 46 beats', pct: 100 },
            { n: '02', label: 'CASTING', sub: '4 of 6 souls trained', pct: 66 },
            { n: '03', label: 'BOARDS', sub: '15 of 47 frames', pct: 31 },
          ].map(s => (
            <div key={s.n} style={{ background: t.surface, border: `1px solid ${t.border}`, padding: 14, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.22em', color: t.mute }}>{s.n} / 05</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.accent, boxShadow: '0 0 8px rgba(255,61,127,0.7)' }}/>
              </div>
              <div style={{ fontFamily: t.displayFont, fontSize: 16, color: '#FFB347', letterSpacing: '0.1em', textShadow: '0 0 8px rgba(255,179,71,0.5)' }}>{s.label}</div>
              <div style={{ fontFamily: t.uiFont, fontSize: 10.5, color: t.fg, opacity: 0.85 }}>{s.sub}</div>
              <div style={{ height: 4, background: t.ink, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: 'linear-gradient(90deg, #FF3D7F, #FFB347)' }}/>
              </div>
            </div>
          ))}
        </div>
      </AppliedSample>
    </ThemeCard>
  );
}

window.ThemeDriveIn = ThemeDriveIn;
