/* POPCORN — Parameterized variant.
   All variations share structure; tokens vary palette, font, outline,
   shadow style, radius, and surface treatment. */

function PopcornVariant({ tokens: t, idx, name, tagline }) {
  const outlineW = t.outline ?? 2;
  const ink = t.ink;
  const ringStyle = outlineW > 0 ? `${outlineW}px solid ${ink}` : 'none';

  const shadowFor = (depth = 1) => {
    if (t.shadow === 'none') return 'none';
    if (t.shadow === 'soft') return `0 ${4 * depth}px ${10 * depth}px rgba(0,0,0,0.12), 0 ${1 * depth}px 0 rgba(0,0,0,0.05)`;
    if (t.shadow === 'sticker') return `0 ${2 * depth}px 0 rgba(0,0,0,0.18), 0 ${5 * depth}px ${8 * depth}px rgba(0,0,0,0.15)`;
    // 'offset' default
    return `${3 * depth}px ${3 * depth}px 0 ${ink}`;
  };

  const tilt = (n) => t.tilt ? `rotate(${n}deg)` : 'none';

  return (
    <ThemeCard tokens={t}>
      <ThemeHeader
        tokens={t}
        idx={idx}
        name={name}
        tagline={tagline}
      />

      <Swatches tokens={t} items={t.palette}/>

      {/* Type specimen */}
      <div>
        <Label tokens={t}>TYPE</Label>
        <div style={{
          marginTop: 10, padding: 22,
          background: t.surface, color: ink,
          borderRadius: t.radius,
          border: ringStyle,
          boxShadow: shadowFor(1.2),
          transform: tilt(-0.6),
        }}>
          <div style={{
            fontFamily: t.displayFont,
            fontSize: 56, lineHeight: 0.92,
            color: t.accent,
            WebkitTextStroke: t.strokeText ? `2px ${ink}` : '0',
            paintOrder: 'stroke fill',
          }}>
            {t.headline || 'Now Showing!'}
          </div>
          <div style={{ fontFamily: t.uiFont, fontSize: 13, marginTop: 10, color: ink, opacity: 0.85, fontWeight: 600 }}>
            The quick brown fox jumps over the lazy dog — UI body
          </div>
          <div style={{ fontFamily: t.monoFont, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.mute, marginTop: 6 }}>
            REEL 03 · 00:42 · TAKE 02
          </div>
        </div>
      </div>

      {/* Controls */}
      <div>
        <Label tokens={t}>CONTROLS</Label>
        <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={{
            fontFamily: t.displayFont, fontSize: 15, letterSpacing: '0.02em',
            padding: '12px 22px', background: t.accent, color: t.onAccent || t.surface,
            border: ringStyle, borderRadius: t.btnRadius || 28,
            boxShadow: shadowFor(1),
            cursor: 'pointer',
          }}>Continue Working →</button>
          <button style={{
            fontFamily: t.uiFont, fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
            padding: '11px 18px', background: t.accent2, color: t.onAccent2 || ink,
            border: ringStyle, borderRadius: t.btnRadius || 28,
            boxShadow: shadowFor(0.75),
            cursor: 'pointer',
          }}>Edit Project</button>
          <span style={{
            fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.18em',
            padding: '6px 10px', background: t.accent3, color: t.onAccent3 || t.surface,
            borderRadius: 20, textTransform: 'uppercase',
            border: outlineW > 0 ? `1.5px solid ${ink}` : 'none',
          }}>● WORKING</span>
          <span style={{
            fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.18em',
            padding: '6px 10px', background: t.surface, color: ink,
            borderRadius: 20, textTransform: 'uppercase',
            border: outlineW > 0 ? `1.5px solid ${ink}` : `1px solid ${t.mute}`,
          }}>DRAFT v3</span>
        </div>
      </div>

      <AppliedSample tokens={t}>
        {/* Top bar */}
        <div style={{
          background: t.surface, color: ink,
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
          borderBottom: outlineW > 0 ? `${outlineW}px solid ${ink}` : `1px solid ${t.border}`,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: t.accent,
            border: ringStyle,
            display: 'grid', placeItems: 'center',
            color: t.onAccent || t.surface,
            fontFamily: t.displayFont, fontSize: 14,
          }}>D</div>
          <div style={{ fontFamily: t.displayFont, fontSize: 20, letterSpacing: '0.02em', color: ink }}>DIREKTA</div>
          <div style={{
            marginLeft: 18, padding: '6px 14px',
            background: t.accent2, color: t.onAccent2 || ink,
            borderRadius: Math.min(parseInt(t.radius) || 12, 14),
            display: 'flex', flexDirection: 'column', gap: 0,
            border: ringStyle,
          }}>
            <div style={{ fontFamily: t.uiFont, fontSize: 12, fontWeight: 800 }}>The Lisbon Pact</div>
            <div style={{ fontFamily: t.monoFont, fontSize: 9, color: ink, letterSpacing: '0.14em', opacity: 0.75 }}>SHORT · 8 MIN</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontFamily: t.monoFont, fontSize: 9, color: t.accent3, letterSpacing: '0.18em', fontWeight: 700 }}>● SAVED</span>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', background: t.accent3,
              color: t.onAccent3 || t.surface,
              fontFamily: t.uiFont, fontWeight: 800, fontSize: 11,
              display: 'grid', placeItems: 'center',
              border: ringStyle,
            }}>MD</div>
          </div>
        </div>
        {/* Pipeline strip */}
        <div style={{ background: t.bg, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { n: '01', label: 'SCRIPT',  sub: 'Bible built · 46 beats', pct: 100, color: t.accent3, tilt: -0.8 },
            { n: '02', label: 'CASTING', sub: '4 of 6 souls trained',   pct: 66,  color: t.accent2, tilt: 0.6 },
            { n: '03', label: 'BOARDS',  sub: '15 of 47 frames',        pct: 31,  color: t.accent,  tilt: -0.4 },
          ].map(s => (
            <div key={s.n} style={{
              background: t.surface,
              border: ringStyle,
              padding: 14,
              borderRadius: t.radius,
              display: 'flex', flexDirection: 'column', gap: 8,
              boxShadow: shadowFor(0.9),
              transform: t.tilt ? `rotate(${s.tilt}deg)` : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: t.monoFont, fontSize: 9, letterSpacing: '0.22em', color: t.mute, fontWeight: 600 }}>{s.n} / 05</span>
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: s.color,
                  border: outlineW > 0 ? `1.5px solid ${ink}` : 'none',
                }}/>
              </div>
              <div style={{ fontFamily: t.displayFont, fontSize: 20, color: ink, letterSpacing: '0.02em' }}>{s.label}</div>
              <div style={{ fontFamily: t.uiFont, fontSize: 11, color: t.mute, fontWeight: 600 }}>{s.sub}</div>
              <div style={{
                height: 8, background: t.trackBg || '#EAD8B5',
                borderRadius: 4, overflow: 'hidden',
                border: outlineW > 0 ? `1px solid ${ink}` : 'none',
              }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: s.color }}/>
              </div>
            </div>
          ))}
        </div>
      </AppliedSample>
    </ThemeCard>
  );
}

/* ───── Variant token sets ───── */

const POP_CLASSIC = {
  bg: '#F5EDDC', surface: '#FFFBF1', fg: '#2A1A12', ink: '#2A1A12',
  accent: '#E84A35', accent2: '#F2B83C', accent3: '#3DA89B',
  mute: '#7A6855', border: '#2A1A12',
  trackBg: '#EAD8B5',
  radius: '14px', btnRadius: 28,
  outline: 2, shadow: 'offset',
  displayFont: '"Lilita One", "Alfa Slab One", serif',
  uiFont: '"Nunito", system-ui, sans-serif',
  monoFont: '"JetBrains Mono", monospace',
  palette: [
    { label: 'CREAM',    hex: '#F5EDDC', fg: '#2A1A12' },
    { label: 'TOMATO',   hex: '#E84A35', fg: '#FFFBF1' },
    { label: 'MUSTARD',  hex: '#F2B83C', fg: '#2A1A12' },
    { label: 'VIRIDIAN', hex: '#3DA89B', fg: '#FFFBF1' },
    { label: 'COCOA',    hex: '#2A1A12', fg: '#F5EDDC' },
  ],
};

const POP_SODA = {
  bg: '#EAF4F5', surface: '#FFFFFF', fg: '#1F2D38', ink: '#1F2D38',
  accent: '#4CB7DB', accent2: '#FFC857', accent3: '#5FD1C9',
  onAccent: '#FFFFFF', onAccent2: '#1F2D38', onAccent3: '#0F2F2D',
  mute: '#7A8B96', border: '#1F2D38',
  trackBg: '#D6E7EA',
  radius: '24px', btnRadius: 999,
  outline: 0, shadow: 'soft',
  displayFont: '"Fredoka", "Lilita One", sans-serif',
  uiFont: '"Nunito", system-ui, sans-serif',
  monoFont: '"JetBrains Mono", monospace',
  palette: [
    { label: 'SKY',     hex: '#EAF4F5', fg: '#1F2D38' },
    { label: 'POOL',    hex: '#4CB7DB', fg: '#FFFFFF' },
    { label: 'BUTTER',  hex: '#FFC857', fg: '#1F2D38' },
    { label: 'MINT',    hex: '#5FD1C9', fg: '#0F2F2D' },
    { label: 'NIGHT',   hex: '#1F2D38', fg: '#EAF4F5' },
  ],
};

const POP_MIDNIGHT = {
  bg: '#1B130E', surface: '#2A1F18', fg: '#F5EDDC', ink: '#0A0604',
  accent: '#FF6A3D', accent2: '#FFC857', accent3: '#5FD0A8',
  onAccent: '#0A0604', onAccent2: '#0A0604', onAccent3: '#0A0604',
  mute: '#A89682', border: '#FFC857',
  trackBg: '#0A0604',
  radius: '14px', btnRadius: 28,
  outline: 0, shadow: 'soft',
  displayFont: '"Lilita One", "Alfa Slab One", serif',
  uiFont: '"Nunito", system-ui, sans-serif',
  monoFont: '"JetBrains Mono", monospace',
  palette: [
    { label: 'COCOA BG',  hex: '#1B130E', fg: '#F5EDDC' },
    { label: 'TIN CAN',   hex: '#2A1F18', fg: '#F5EDDC' },
    { label: 'EMBER',     hex: '#FF6A3D', fg: '#0A0604' },
    { label: 'BULB',      hex: '#FFC857', fg: '#0A0604' },
    { label: 'NEON MINT', hex: '#5FD0A8', fg: '#0A0604' },
  ],
};

const POP_KRAFT = {
  bg: '#D9BE92', surface: '#F3E0BD', fg: '#1F1410', ink: '#1F1410',
  accent: '#D63A2F', accent2: '#1F8A8F', accent3: '#E8A33C',
  onAccent: '#F3E0BD', onAccent2: '#F3E0BD', onAccent3: '#1F1410',
  mute: '#7A604A', border: '#1F1410',
  trackBg: '#C5A576',
  radius: '6px', btnRadius: 4,
  outline: 2.5, shadow: 'offset',
  displayFont: '"Bagel Fat One", "Lilita One", serif',
  uiFont: '"Hanken Grotesk", system-ui, sans-serif',
  monoFont: '"JetBrains Mono", monospace',
  headline: 'NOW SHOWING',
  grain: 0.14, grainTint: '#000',
  palette: [
    { label: 'KRAFT',  hex: '#D9BE92', fg: '#1F1410' },
    { label: 'BUTTER', hex: '#F3E0BD', fg: '#1F1410' },
    { label: 'BARN',   hex: '#D63A2F', fg: '#F3E0BD' },
    { label: 'POOL',   hex: '#1F8A8F', fg: '#F3E0BD' },
    { label: 'INK',    hex: '#1F1410', fg: '#F3E0BD' },
  ],
};

const POP_STICKER = {
  bg: '#EEF1F5', surface: '#FFFFFF', fg: '#1A1A2E', ink: '#1A1A2E',
  accent: '#FF7F3F', accent2: '#FFD93D', accent3: '#6BCB77',
  onAccent: '#FFFFFF', onAccent2: '#1A1A2E', onAccent3: '#0A2410',
  mute: '#8189A8', border: '#1A1A2E',
  trackBg: '#E2E8F0',
  radius: '20px', btnRadius: 999,
  outline: 3, shadow: 'sticker',
  displayFont: '"Bagel Fat One", "Lilita One", serif',
  uiFont: '"Nunito", system-ui, sans-serif',
  monoFont: '"JetBrains Mono", monospace',
  tilt: true,
  palette: [
    { label: 'PAPER',  hex: '#EEF1F5', fg: '#1A1A2E' },
    { label: 'EMBER',  hex: '#FF7F3F', fg: '#FFFFFF' },
    { label: 'LEMON',  hex: '#FFD93D', fg: '#1A1A2E' },
    { label: 'CLOVER', hex: '#6BCB77', fg: '#0A2410' },
    { label: 'INK',    hex: '#1A1A2E', fg: '#EEF1F5' },
  ],
};

Object.assign(window, {
  PopcornVariant,
  POP_CLASSIC, POP_SODA, POP_MIDNIGHT, POP_KRAFT, POP_STICKER,
});
