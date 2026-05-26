/* DIREKTA — Scripting · Script tab (manuscript view) */

function ScriptingScript({ manuscript, casting }) {
  const [collapsedBeats, setCollapsedBeats] = React.useState({});
  const [selectedScene, setSelectedScene] = React.useState(1);

  const toggleBeat = (sceneN) => setCollapsedBeats({ ...collapsedBeats, [sceneN]: !collapsedBeats[sceneN] });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: '100%', overflow: 'hidden' }}>
      {/* Manuscript */}
      <div style={{ overflowY: 'auto', padding: '0 0 64px' }}>
        {/* Sticky meta bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 5,
          background: 'var(--ink-00)',
          padding: '12px 56px 16px',
          borderBottom: '1px solid var(--ink-30)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
            <button className="btn btn-sm">EVERYTHING · FULL MANUSCRIPT <Icon.ChevronDown size={12}/></button>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--ink-70)', textTransform: 'uppercase' }}>12,840 WORDS · 38 PAGES · 2h 14m READ</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm btn-ghost"><Icon.Save size={12}/> FORMAT</button>
            <button className="btn btn-sm btn-ghost"><Icon.Zoom size={12}/> FOCUS</button>
          </div>
        </div>

        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 56px' }}>
          {manuscript.map((line, i) => {
            if (line.kind === 'act') {
              return (
                <div key={i} style={{
                  textAlign: 'center',
                  padding: '48px 0 36px',
                  marginTop: 48
                }}>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.24em', color: 'var(--tungsten)', textTransform: 'uppercase' }}>ACT {line.n}</div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 56, letterSpacing: '0.04em', color: 'var(--bone)', textTransform: 'uppercase', lineHeight: 1, marginTop: 12 }}>{line.title}</div>
                </div>
              );
            }
            if (line.kind === 'chapter') {
              return (
                <div key={i} style={{ padding: '28px 0 18px', marginTop: 32 }}>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>CHAPTER {line.n} · {line.wordCount.toLocaleString()} WORDS</div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 36, letterSpacing: '0.03em', color: 'var(--bone)', textTransform: 'uppercase', lineHeight: 1, marginTop: 6 }}>{line.title}</div>
                </div>
              );
            }
            if (line.kind === 'scene') {
              return <SceneBlock
                key={i} scene={line}
                collapsed={collapsedBeats[line.n] != null ? collapsedBeats[line.n] : line.sceneBeatCollapsed}
                onToggleBeat={() => toggleBeat(line.n)}
                isSelected={selectedScene === line.n}
                onSelect={() => setSelectedScene(line.n)}
              />;
            }
            return null;
          })}
        </div>
      </div>

      {/* Context panel — codex references for selected scene */}
      <ContextPanel sceneN={selectedScene} manuscript={manuscript} casting={casting}/>
    </div>
  );
}

function SceneBlock({ scene, collapsed, onToggleBeat, isSelected, onSelect }) {
  return (
    <div onClick={onSelect} style={{
      marginTop: 24, paddingLeft: 16,
      borderLeft: '2px solid ' + (isSelected ? 'var(--tungsten)' : 'transparent'),
      cursor: 'pointer'
    }}>
      {/* Scene heading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 13, letterSpacing: '0.06em', color: 'var(--bone)', textTransform: 'uppercase' }}>{scene.slug}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>B {String(scene.n).padStart(2, '0')} · {scene.wordCount} W</span>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--tungsten)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon.Dot size={6}/> AI · INCLUDED
          </span>
        </div>
      </div>

      {/* Scene Beat box */}
      <SceneBeatBox scene={scene} collapsed={collapsed} onToggle={onToggleBeat}/>

      {/* Prose */}
      <div style={{ marginTop: 16, color: 'var(--bone-80)', fontSize: 16, lineHeight: 1.75, fontFamily: 'Georgia, "Iowan Old Style", serif' }}>
        {scene.prose.map((p, i) => <ProseLine key={i} line={p}/>)}
      </div>
    </div>
  );
}

function SceneBeatBox({ scene, collapsed, onToggle }) {
  return (
    <div style={{
      border: '1px solid var(--tungsten)',
      borderRadius: 0,
      background: 'rgba(242, 181, 60, 0.04)',
      overflow: 'hidden',
      transition: 'background 80ms'
    }}>
      <div
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        style={{
          padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon.Storyboard size={14} style={{ color: 'var(--tungsten)' }}/>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--tungsten)', textTransform: 'uppercase' }}>SCENE BEAT</span>
        </div>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {collapsed ? 'SHOW' : 'HIDE'} <Icon.Chevron size={10} style={{ transform: collapsed ? 'rotate(0)' : 'rotate(90deg)' }}/>
        </span>
      </div>
      {!collapsed && (
        <div style={{ padding: '0 14px 14px', color: 'var(--bone)', fontSize: 14, lineHeight: 1.55 }}>
          {scene.sceneBeat}
        </div>
      )}
    </div>
  );
}

function ProseLine({ line }) {
  // line may contain {CHAR} mentions and \n for char/dialogue breaks
  // The format from data:
  //   "{CHAR}\n(paren)\nDialogue"  or just paragraph text
  if (line.startsWith('{')) {
    // dialogue block
    const lines = line.split('\n');
    return (
      <div style={{ margin: '14px 0 14px 6em', maxWidth: '32em' }}>
        {lines.map((l, i) => {
          if (l.startsWith('{') && l.endsWith('}')) {
            const charId = l.slice(1, -1);
            return <div key={i} style={{ color: 'var(--bone)', textTransform: 'uppercase', fontFamily: 'var(--f-mono)', fontSize: 14, letterSpacing: '0.06em', marginLeft: '6em' }}>{charId}</div>;
          }
          if (l.match(/\{[A-Z]+\}/)) {
            // char with (O.S.) etc — replace token
            const replaced = l.replace(/\{([A-Z]+)\}/, '$1');
            return <div key={i} style={{ color: 'var(--bone)', textTransform: 'uppercase', fontFamily: 'var(--f-mono)', fontSize: 14, letterSpacing: '0.06em', marginLeft: '6em' }}>{replaced}</div>;
          }
          if (l.startsWith('(') && l.endsWith(')')) {
            return <div key={i} style={{ color: 'var(--ink-60)', fontFamily: 'var(--f-mono)', fontSize: 13, marginLeft: '4em' }}>{l}</div>;
          }
          return <div key={i} style={{ color: 'var(--bone-80)' }}>{l}</div>;
        })}
      </div>
    );
  }
  // action paragraph — may contain inline {CHAR} mentions
  const parts = line.split(/(\{[A-Z]+\})/g).map((p, i) => {
    if (p.startsWith('{') && p.endsWith('}')) {
      return <CodexMention key={i} name={p.slice(1, -1)}/>;
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
  return <p style={{ margin: '14px 0' }}>{parts}</p>;
}

function CodexMention({ name }) {
  return (
    <span style={{
      textDecoration: 'underline',
      textUnderlineOffset: '3px',
      textDecorationColor: 'rgba(242, 181, 60, 0.4)',
      textDecorationThickness: '1px',
      color: 'var(--bone)',
      cursor: 'pointer',
      fontFamily: 'var(--f-mono)',
      fontSize: '0.92em',
      letterSpacing: '0.04em'
    }} title={`Codex: ${name}`}>{name}</span>
  );
}

function ContextPanel({ sceneN, manuscript, casting }) {
  // Find current scene
  const scene = manuscript.find(m => m.kind === 'scene' && m.n === sceneN);
  if (!scene) {
    return <div style={{ borderLeft: '1px solid var(--ink-30)', background: 'var(--ink-05)', padding: 24 }}/>;
  }

  // extract mentioned chars
  const mentioned = new Set();
  scene.prose.forEach(p => {
    const m = p.match(/\{([A-Z]+)\}/g);
    if (m) m.forEach(x => mentioned.add(x.slice(1, -1)));
  });

  // Map to casting entries by first word match
  const linkedChars = casting.filter(c =>
    c.type === 'character' && [...mentioned].some(name => c.name.split(' ').includes(name) || c.name === name)
  );

  return (
    <div style={{
      borderLeft: '1px solid var(--ink-30)',
      background: 'var(--ink-05)',
      padding: '24px 20px',
      overflowY: 'auto'
    }}>
      <div className="eb">SCENE CONTEXT · B{String(sceneN).padStart(2, '0')}</div>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--bone)', marginTop: 8, lineHeight: 1 }}>{scene.beatTitle}</div>
      <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.06em', color: 'var(--ink-60)', textTransform: 'uppercase', marginTop: 6 }}>{scene.slug}</div>

      {/* Mentioned chars */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--ink-25)' }}>
        <div className="eb muted" style={{ marginBottom: 10 }}>MENTIONED · {linkedChars.length}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {linkedChars.map(c => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'center', padding: '6px 8px', background: 'var(--ink-10)' }}>
              <div style={{
                width: 28, height: 28, background: 'var(--ink-20)', border: '1px solid var(--ink-30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--f-mono)', fontSize: 9, color: 'var(--bone-60)', letterSpacing: '0.04em'
              }}>{c.name.split(' ').map(s => s[0]).join('').slice(0, 2)}</div>
              <div>
                <div style={{ color: 'var(--bone)', fontSize: 12, fontWeight: 500 }}>{c.name.split(' ').map(w => w[0]+w.slice(1).toLowerCase()).join(' ')}</div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.14em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>{c.role}</div>
              </div>
              <SoulIdMini state={c.state} consistency={c.consistency} progress={c.progress}/>
            </div>
          ))}
        </div>
      </div>

      {/* AI included */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--ink-25)' }}>
        <div className="eb muted" style={{ marginBottom: 10 }}>AI CONTEXT</div>
        <div style={{ background: 'var(--ink-10)', padding: 12, color: 'var(--ink-70)', fontSize: 12, lineHeight: 1.55 }}>
          {linkedChars.length} characters + 1 location + tone snippet + scene beat will be sent to the Cinematographer when this beat is generated.
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--ink-25)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn btn-sm" style={{ justifyContent: 'space-between' }}>
          Send to Storyboard <Icon.Arrow size={12}/>
        </button>
        <button className="btn btn-sm btn-ghost" style={{ justifyContent: 'space-between' }}>
          Discuss this beat <Icon.Chevron size={12}/>
        </button>
      </div>
    </div>
  );
}

function SoulIdMini({ state, consistency, progress }) {
  if (state === 'trained') return <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--green)' }}>✓ {consistency}</span>;
  if (state === 'training') return <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--tungsten)' }}>{Math.round(progress*100)}%</span>;
  if (state === 'failed') return <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--cut)' }}>FAILED</span>;
  return <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--ink-60)' }}>—</span>;
}

Object.assign(window, { ScriptingScript });
