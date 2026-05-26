/* THEME 04 — SATURDAY 70s
   Reference: 70s cinema posters (Saul Bass / ITC Avant Garde era).
   Burnt orange + mustard + cocoa + cream. Curved geometric type, concentric reels. */

const SATURDAY_TOKENS = {
  bg: '#ECDDC2',
  fg: '#2B1A10',
  surface: '#F7EFDD',
  accent: '#C4521F',
  ink: '#2B1A10',
  mute: '#8A6F50',
  border: '#2B1A10',
  radius: '0px',
  displayFont: '"Righteous", "Bowlby One SC", sans-serif',
  uiFont: '"Hanken Grotesk", system-ui, sans-serif',
  monoFont: '"JetBrains Mono", monospace',
  displayTracking: '0.02em',
  displayCase: 'uppercase',
  grain: 0.08,
  grainTint: '#000',
};

function ConcentricReel({ size = 64, palette = ['#C4521F', '#D9A03B', '#2B1A10', '#ECDDC2'] }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="30" fill={palette[0]}/>
      <circle cx="32" cy="32" r="22" fill={palette[1]}/>
      <circle cx="32" cy="32" r="14" fill={palette[2]}/>
      <circle cx="32" cy="32" r="6" fill={palette[3]}/>
    </svg>
  );
}

function ThemeSaturday() {
  const t = SATURDAY_TOKENS;
  return (
    <ThemeCard tokens={t}>
      <ThemeHeader
        tokens={t}
        idx="4"
        name={<span>Saturday<span style={{ color: '#D9A03B' }}>·</span>70s</span>}
        tagline="Saul-Bass-meets-Avant-Garde. Burnt orange, mustard, and cocoa over warm cream. Curved geometric headlines and concentric reel motifs. Earthy, confident, decade-perfect."
      />

      <Swatches tokens={t} items={[
        { label: 'CREAM', hex: '#ECDDC2', fg: '#2B1A10' },
        { label: 'BURNT', hex: '#C4521F', fg: '#F7EFDD' },
        { label: 'MUSTARD', hex: '#D9A03B', fg: '#2B1A10' },
        { label: 'COCOA', hex: '#2B1A10', fg: '#ECDDC2' },
        { label: 'SAGE', hex: '#5C7252', fg: '#F7EFDD' },
      ]}/>

      <div>
        <Label tokens={t}>TYPE</Label>
        <div style={{ marginTop: 10, padding: 22, background: t.surface, border: `1.5px solid ${t.ink}`, position: 'relative', display: 'flex', gap: 18, alignItems: 'center' }}>
          <ConcentricReel size={80}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: t.displayFont, fontSize: 50, lineHeight: 0.92, color: t.accent, letterSpacing: '0.02em' }}>
              NOW SHOWING
            </div>
            <div style={{ fontFamily: t.uiFont, fontSize: 13, marginTop: 8, color: t.ink, opacity: 0.85, fontWeight: 500 }}>
              The quick brown fox jumps over the lazy dog — UI body
            </div>
            <div style={{ fontFamily: t.monoFont, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.mute, marginTop: 6 }}>
              REEL 03 · 00:42 · TAKE 02
            </div>
          </div>
        </div>
      </div>

      <div>
        <Label tokens={t}>CONTROLS</Label>
        <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={{
            fontFamily: t.displayFont, fontSize: 14, letterSpacing: '0.04em',
            padding: '14px 26px', background: t.accent, color: t.surface, border: 'none', borderRadius: 0,
            cursor: 'pointer', textTransform: 'uppercase'
          }}>Continue Working</button>
          <button style={{
            fontFamily: t.uiFont, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '12px 18px', background: 'transparent', color: t.ink, border: `1.5px solid ${t.ink}`, borderRadius: 0, cursor: 'pointer'
          }}>Edit Project</button>
          <span style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.2em', padding: '6px 10px', background: '#D9A03B', color: t.ink, borderRadius: 0, textTransform: 'uppercase' }}>WORKING</span>
          <span style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.2em', padding: '6px 10px', background: 'transparent', color: t.ink, borderRadius: 0, textTransform: 'uppercase', border: `1px solid ${t.ink}` }}>DRAFT · v3</span>
        </div>
      </div>

      <AppliedSample tokens={t}>
        <div style={{ background: t.ink, color: t.surface, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <ConcentricReel size={26}/>
          <div style={{ fontFamily: t.displayFont, fontSize: 18, letterSpacing: '0.06em', color: '#D9A03B' }}>DIREKTA</div>
          <div style={{ marginLeft: 18, padding: '6px 12px', background: 'rgba(217,160,59,0.15)', display: 'flex', flexDirection: 'column', gap: 0, borderLeft: `2px solid #D9A03B` }}>
            <div style={{ fontFamily: t.uiFont, fontSize: 12, fontWeight: 700 }}>The Lisbon Pact</div>
            <div style={{ fontFamily: t.monoFont, fontSize: 9, color: '#D9A03B', letterSpacing: '0.16em' }}>SHORT · 8 MIN</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: t.monoFont, fontSize: 9, color: '#9ACB8E', letterSpacing: '0.18em' }}>● SAVED</span>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: t.accent, color: t.surface, fontFamily: t.uiFont, fontWeight: 700, fontSize: 11, display: 'grid', placeItems: 'center' }}>MD</div>
          </div>
        </div>
        <div style={{ background: t.bg, padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: `1.5px solid ${t.ink}` }}>
          {[
            { n: '01', label: 'SCRIPT', sub: 'Bible built · 46 beats', pct: 100, color: t.accent },
            { n: '02', label: 'CASTING', sub: '4 of 6 souls trained', pct: 66, color: '#D9A03B' },
            { n: '03', label: 'BOARDS', sub: '15 of 47 frames', pct: 31, color: '#5C7252' },
          ].map((s, i) => (
            <div key={s.n} style={{ background: t.surface, borderRight: i < 2 ? `1.5px solid ${t.ink}` : 'none', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.22em', color: t.mute, fontWeight: 600 }}>{s.n} / 05</span>
                <ConcentricReel size={20} palette={[s.color, t.surface, t.ink, s.color]}/>
              </div>
              <div style={{ fontFamily: t.displayFont, fontSize: 18, color: t.ink, letterSpacing: '0.04em' }}>{s.label}</div>
              <div style={{ fontFamily: t.uiFont, fontSize: 10.5, color: t.mute, fontWeight: 500 }}>{s.sub}</div>
              <div style={{ height: 4, background: '#D8C5A3', overflow: 'hidden' }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: s.color }}/>
              </div>
            </div>
          ))}
        </div>
      </AppliedSample>
    </ThemeCard>
  );
}

window.ThemeSaturday = ThemeSaturday;
