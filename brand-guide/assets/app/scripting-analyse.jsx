/* DIREKTA — Scripting · Analyse tab (NC-style review) */

function ScriptingAnalyse({ sceneWords, charDist }) {
  const total = sceneWords.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / sceneWords.length);
  const max = Math.max(...sceneWords);

  return (
    <div style={{ padding: '24px 36px 64px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Stat strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        border: '1px solid var(--ink-30)', background: 'var(--ink-05)',
        marginBottom: 28
      }}>
        <SmallStat label="TOTAL WORDS"        value={total.toLocaleString()}/>
        <SmallStat label="SCENES"             value={sceneWords.length}/>
        <SmallStat label="AVG WORDS / SCENE"  value={avg.toLocaleString()}/>
        <SmallStat label="EST. READ"          value="2h 14m"/>
        <SmallStat label="EST. SCREEN"        value="22 min"/>
      </div>

      {/* Word count chart */}
      <ChartCard
        title="Word Count by Scene"
        subtitle="Compare word counts across scenes to spot pacing changes."
      >
        <WordCountChart values={sceneWords} max={max} avg={avg}/>
      </ChartCard>

      {/* Character distribution */}
      <ChartCard
        title="Character Distribution"
        subtitle="See how many characters appear in each scene to balance your cast."
      >
        <CharDistChart data={charDist}/>
      </ChartCard>

      {/* Cast breakdown */}
      <ChartCard
        title="Cast Frequency"
        subtitle="Top characters by scene count across the manuscript."
      >
        <CastFrequency/>
      </ChartCard>

      {/* Pacing flags */}
      <div style={{ marginTop: 16, padding: 20, border: '1px solid var(--ink-30)', background: 'var(--ink-05)' }}>
        <div className="eb">SCRIPT READER · OBSERVATIONS</div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Observation icon={<Icon.Check size={12}/>} color="var(--green)" text="Scene 6 (Lisbon Café) is your densest beat — 2,640 words. This will be a strong cinematic moment."/>
          <Observation icon={<Icon.Flag size={12}/>} color="var(--tungsten)" text="Scenes 5 and 13 are below the running average. Consider expanding or merging."/>
          <Observation icon={<Icon.Flag size={12}/>} color="var(--cut)" text="MARCUS appears in 8 of 14 scenes — heavy lead presence. Make sure your Soul ID consistency holds."/>
        </div>
      </div>
    </div>
  );
}

function SmallStat({ label, value }) {
  return (
    <div style={{ padding: '20px 22px', borderRight: '1px solid var(--ink-30)' }}>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, letterSpacing: '0.02em', color: 'var(--bone)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase', marginTop: 6 }}>{label}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{
      border: '1px solid var(--ink-30)',
      background: 'var(--ink-05)',
      marginBottom: 16
    }}>
      <div style={{ padding: '20px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--bone)', lineHeight: 1 }}>{title}</div>
          <div style={{ color: 'var(--ink-70)', fontSize: 13, marginTop: 4 }}>{subtitle}</div>
        </div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase', display: 'flex', gap: 6 }}>
          <span style={{ color: 'var(--tungsten)' }}>SCENES</span>
          <span>·</span>
          <span>CHAPTERS</span>
        </div>
      </div>
      <div style={{ padding: '12px 24px 24px' }}>{children}</div>
    </div>
  );
}

function WordCountChart({ values, max, avg }) {
  const w = 1000, h = 260, pad = { l: 50, r: 20, t: 20, b: 40 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const barW = innerW / values.length;
  const yMax = Math.ceil(max / 1000) * 1000;
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* y axis grid */}
      {yTicks.map((t, i) => {
        const y = pad.t + innerH - (t / yMax) * innerH;
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--ink-25)" strokeWidth="1"/>
            <text x={pad.l - 10} y={y + 4} fill="var(--ink-60)" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="end" letterSpacing="0.06em">{t.toLocaleString()}</text>
          </g>
        );
      })}

      {/* avg line */}
      {(() => {
        const y = pad.t + innerH - (avg / yMax) * innerH;
        return (
          <g>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--tungsten)" strokeWidth="1" strokeDasharray="3 4"/>
            <text x={w - pad.r - 6} y={y - 6} fill="var(--tungsten)" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="end" letterSpacing="0.12em">AVG {avg.toLocaleString()}</text>
          </g>
        );
      })()}

      {/* bars */}
      {values.map((v, i) => {
        const x = pad.l + i * barW + barW * 0.18;
        const bw = barW * 0.64;
        const bh = (v / yMax) * innerH;
        const y = pad.t + innerH - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} fill="var(--tungsten)" opacity="0.85"/>
            <rect x={x} y={y} width={bw} height={2} fill="var(--tungsten-hot)"/>
            <text x={x + bw / 2} y={pad.t + innerH + 18} fill="var(--ink-60)" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="middle" letterSpacing="0.08em">B{String(i + 1).padStart(2, '0')}</text>
          </g>
        );
      })}

      {/* x baseline */}
      <line x1={pad.l} y1={pad.t + innerH} x2={w - pad.r} y2={pad.t + innerH} stroke="var(--ink-40)" strokeWidth="1"/>
    </svg>
  );
}

function CharDistChart({ data }) {
  const w = 1000, h = 240, pad = { l: 50, r: 20, t: 20, b: 40 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(...data.map(d => d.chars.length));
  const yMax = max + 1;
  const xStep = innerW / (data.length - 1);

  const points = data.map((d, i) => {
    const x = pad.l + i * xStep;
    const y = pad.t + innerH - (d.chars.length / yMax) * innerH;
    return { x, y, val: d.chars.length, scene: d.scene };
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const avg = data.reduce((s, d) => s + d.chars.length, 0) / data.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* grid */}
      {[0, 2, 4, 6, 8].map(t => {
        const y = pad.t + innerH - (t / yMax) * innerH;
        return (
          <g key={t}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--ink-25)" strokeWidth="1"/>
            <text x={pad.l - 10} y={y + 4} fill="var(--ink-60)" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="end">{t}</text>
          </g>
        );
      })}

      {/* avg line */}
      {(() => {
        const y = pad.t + innerH - (avg / yMax) * innerH;
        return (
          <g>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--tungsten)" strokeWidth="1" strokeDasharray="3 4"/>
            <text x={w - pad.r - 6} y={y - 6} fill="var(--tungsten)" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="end" letterSpacing="0.12em">AVG {avg.toFixed(1)}</text>
          </g>
        );
      })()}

      {/* line */}
      <path d={path} fill="none" stroke="var(--bone)" strokeWidth="1.5"/>

      {/* dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="var(--bone)" stroke="var(--ink-00)" strokeWidth="2"/>
          <text x={p.x} y={pad.t + innerH + 18} fill="var(--ink-60)" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="middle" letterSpacing="0.08em">B{String(p.scene).padStart(2, '0')}</text>
        </g>
      ))}

      {/* baseline */}
      <line x1={pad.l} y1={pad.t + innerH} x2={w - pad.r} y2={pad.t + innerH} stroke="var(--ink-40)" strokeWidth="1"/>
    </svg>
  );
}

function CastFrequency() {
  // Compute character → scene count
  const counts = {};
  window.DK_DATA.CHAR_DIST.forEach(d => {
    d.chars.forEach(c => { counts[c] = (counts[c] || 0) + 1; });
  });
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = rows[0][1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map(([name, n]) => (
        <div key={name} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', gap: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--bone)', textTransform: 'uppercase' }}>{name}</span>
          <div style={{ height: 18, background: 'var(--ink-15)', position: 'relative' }}>
            <div style={{ height: '100%', background: 'var(--tungsten)', width: `${(n / max) * 100}%` }}/>
          </div>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-70)', letterSpacing: '0.08em' }}>{n} SCENES</span>
        </div>
      ))}
    </div>
  );
}

function Observation({ icon, color, text }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '20px 1fr', gap: 10,
      padding: '10px 12px',
      background: 'var(--ink-10)', borderLeft: '2px solid ' + color
    }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ color: 'var(--bone)', fontSize: 13, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

Object.assign(window, { ScriptingAnalyse });
