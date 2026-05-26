/* DIREKTA — Tweaks app
   Mutates CSS custom properties on :root for live preview. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "tungsten",
  "grain": true,
  "density": "regular"
}/*EDITMODE-END*/;

const ACCENTS = {
  tungsten:   { hex: "#F2B53C", hot: "#FFC75A", deep: "#C48818", name: "Tungsten · Studio Lamp" },
  leader:     { hex: "#E63946", hot: "#FF5867", deep: "#B72635", name: "Film Leader · Red" },
  anamorphic: { hex: "#4A9EFF", hot: "#7DBAFF", deep: "#2E72CC", name: "Anamorphic · Lens Blue" },
  projector:  { hex: "#F0EBDC", hot: "#FFFAEC", deep: "#C8C2B3", name: "Projector · Bone White" }
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const r = document.documentElement;
    const a = ACCENTS[t.accent] || ACCENTS.tungsten;
    r.style.setProperty('--tungsten', a.hex);
    r.style.setProperty('--tungsten-hot', a.hot);
    r.style.setProperty('--tungsten-deep', a.deep);
    document.body.dataset.grain = t.grain ? 'on' : 'off';
    document.body.dataset.density = t.density;
    // also reflect the active hex on swatch labels
    document.querySelectorAll('[data-accent-hex]').forEach(el => { el.textContent = a.hex; });
    document.querySelectorAll('[data-accent-name]').forEach(el => { el.textContent = a.name.split(' · ')[0]; });
  }, [t.accent, t.grain, t.density]);

  return (
    <TweaksPanel>
      <TweakSection label="Accent" />
      <TweakColor
        label="Single accent"
        value={ACCENTS[t.accent]?.hex}
        options={Object.values(ACCENTS).map(a => a.hex)}
        onChange={(hex) => {
          const key = Object.keys(ACCENTS).find(k => ACCENTS[k].hex === hex) || 'tungsten';
          setTweak('accent', key);
        }}
      />
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.08em", color: "rgba(41,38,27,.55)", textTransform: "uppercase" }}>
        {ACCENTS[t.accent]?.name}
      </div>

      <TweakSection label="Texture" />
      <TweakToggle label="Film grain" value={t.grain} onChange={(v) => setTweak('grain', v)} />

      <TweakSection label="Layout" />
      <TweakRadio
        label="Density"
        value={t.density}
        options={['regular', 'dense']}
        onChange={(v) => setTweak('density', v)}
      />
    </TweaksPanel>
  );
}

const root = ReactDOM.createRoot(document.getElementById('tweaks-root'));
root.render(<App />);
