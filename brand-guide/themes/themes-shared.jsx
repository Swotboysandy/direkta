/* Shared building blocks for theme cards.
   Each theme renders an artboard with:
     - eyebrow + title + tagline
     - palette swatches
     - type specimen
     - control samples (buttons, pip, tag)
     - applied UI slice (top bar + pipeline strip + quick card)
   All variable styling comes from a `tokens` object so themes can swap looks
   without rewriting the layout.
*/

function ThemeCard({ tokens, children }) {
  // tokens: { bg, fg, accent, ink, mute, surface, border, displayFont, uiFont, monoFont, radius, grain }
  const t = tokens;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: t.bg,
        color: t.fg,
        fontFamily: t.uiFont,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {t.grain && <GrainOverlay opacity={t.grain} tint={t.grainTint || '#000'} />}
      <div style={{ position: 'relative', zIndex: 2, padding: 40, display: 'flex', flexDirection: 'column', gap: 32, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

function GrainOverlay({ opacity = 0.08, tint = '#000' }) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;
  return (
    <div
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`,
        opacity,
        mixBlendMode: 'multiply',
      }}
    />
  );
}

function ThemeHeader({ tokens, idx, name, tagline }) {
  const t = tokens;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
      <div>
        <div style={{ fontFamily: t.monoFont, fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: t.mute, marginBottom: 10 }}>
          THEME · 0{idx} / 05
        </div>
        <div style={{ fontFamily: t.displayFont, fontSize: 56, lineHeight: 0.92, letterSpacing: t.displayTracking || '0.02em', textTransform: t.displayCase || 'uppercase', color: t.accent }}>
          {name}
        </div>
        <div style={{ fontFamily: t.uiFont, fontSize: 14, marginTop: 14, color: t.fg, opacity: 0.85, maxWidth: '54ch', lineHeight: 1.45 }}>
          {tagline}
        </div>
      </div>
    </div>
  );
}

function Swatches({ tokens, items }) {
  const t = tokens;
  return (
    <div>
      <Label tokens={t}>PALETTE</Label>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 0, marginTop: 10, border: `1px solid ${t.border}` }}>
        {items.map((c, i) => (
          <div key={i} style={{ background: c.hex, height: 88, padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: i < items.length - 1 ? `1px solid ${t.border}` : 'none' }}>
            <div style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.fg }}>{c.label}</div>
            <div style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.12em', color: c.fg, opacity: 0.7 }}>{c.hex}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Label({ tokens, children }) {
  const t = tokens;
  return (
    <div style={{ fontFamily: t.monoFont, fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: t.mute }}>
      {children}
    </div>
  );
}

function TypeSpecimen({ tokens }) {
  const t = tokens;
  return (
    <div>
      <Label tokens={t}>TYPE</Label>
      <div style={{ marginTop: 10, padding: 18, background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radius }}>
        <div style={{ fontFamily: t.displayFont, fontSize: 48, lineHeight: 0.9, letterSpacing: t.displayTracking || '0.02em', textTransform: t.displayCase || 'uppercase', color: t.fg }}>
          Now Showing
        </div>
        <div style={{ fontFamily: t.uiFont, fontSize: 13, marginTop: 10, color: t.fg, opacity: 0.85 }}>
          The quick brown fox jumps over the lazy dog — UI body
        </div>
        <div style={{ fontFamily: t.monoFont, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.mute, marginTop: 8 }}>
          REEL 03 · 00:42 · TAKE 02
        </div>
      </div>
    </div>
  );
}

// Re-usable applied UI sample: top bar + pipeline strip + quick card
function AppliedSample({ tokens, children }) {
  const t = tokens;
  return (
    <div style={{ marginTop: 'auto' }}>
      <Label tokens={t}>APPLIED · DIREKTA</Label>
      <div style={{ marginTop: 10, border: `1px solid ${t.border}`, background: t.surface, borderRadius: t.radius, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { ThemeCard, ThemeHeader, Swatches, TypeSpecimen, AppliedSample, Label, GrainOverlay });
