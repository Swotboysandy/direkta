/* DIREKTA — Scripting · Codex tab (the Bible)
   Production Bible content — characters, locations, tone, world rules.
   This is where pre-production "trains the character" before Casting. */

function ScriptingCodex({ casting, snippets, beats, onSwitchWorkspace }) {
  const characters = casting.filter(c => c.type === 'character');
  const locations  = casting.filter(c => c.type === 'location');
  const tones      = snippets.filter(s => s.kind === 'Tone' || s.kind === 'World');
  const rules      = snippets.filter(s => s.kind === 'Character Rule' || s.kind === 'Format');

  return (
    <div style={{ padding: '24px 36px 64px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Bible header card */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'end',
        padding: '28px 32px',
        background: 'var(--ink-05)', border: '1px solid var(--ink-30)',
        marginBottom: 28
      }}>
        <div>
          <div className="eb">PRODUCTION BIBLE · BUILT BY BIBLE BUILDER</div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 48, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--bone)', lineHeight: 0.95, marginTop: 8 }}>The Lisbon Pact<br/>— Codex</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-70)', textTransform: 'uppercase' }}>
            <span>12 CHARACTERS</span>
            <span>· 8 LOCATIONS</span>
            <span>· 3,200 WORDS</span>
            <span>· 14 PAGES</span>
            <span style={{ color: 'var(--tungsten)' }}>· AUTOSAVED</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn"><Icon.Plus size={12}/> Add entry</button>
          <button className="btn"><Icon.Save size={12}/> Export Bible</button>
        </div>
      </div>

      {/* Characters */}
      <SectionHead n="01" label="Characters" count={characters.length}
        cta={<button className="btn btn-sm">Open in Casting <Icon.Arrow size={11}/></button>}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 40 }}>
        {characters.map(c => <CodexCharCard key={c.id} cast={c} onCast={() => onSwitchWorkspace('casting')}/>)}
      </div>

      {/* Locations */}
      <SectionHead n="02" label="Locations" count={locations.length}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 40 }}>
        {locations.map(l => <CodexLocCard key={l.id} loc={l}/>)}
      </div>

      {/* Tone + World */}
      <SectionHead n="03" label="Tone & World"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 40 }}>
        {tones.map(t => <CodexNoteCard key={t.id} note={t} accent/>)}
      </div>

      {/* World rules */}
      <SectionHead n="04" label="Character & Format Rules"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 40 }}>
        {rules.map(r => <CodexNoteCard key={r.id} note={r}/>)}
      </div>

      {/* Continuity flag */}
      <div style={{
        padding: 22, background: 'var(--ink-05)',
        border: '1px solid var(--cut)', borderLeft: '3px solid var(--cut)',
        display: 'flex', alignItems: 'flex-start', gap: 16
      }}>
        <Icon.Flag size={16} style={{ color: 'var(--cut)', marginTop: 2 }}/>
        <div style={{ flex: 1 }}>
          <div className="eb err">CONTINUITY CHECKER · 1 OPEN</div>
          <div style={{ color: 'var(--bone)', fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>
            Bible says <strong>MARCUS</strong> wears a worn leather jacket. <strong>Beat 03</strong> places him in a suit at the Precinct. Reconcile the wardrobe or accept the variance.
          </div>
        </div>
        <button className="btn btn-sm">Reconcile</button>
      </div>
    </div>
  );
}

function SectionHead({ n, label, count, cta }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '0 0 14px', marginBottom: 16,
      borderBottom: '1px solid var(--ink-30)'
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.24em', color: 'var(--tungsten)', textTransform: 'uppercase' }}>{n}</span>
        <span style={{ fontFamily: 'var(--f-display)', fontSize: 28, letterSpacing: '0.04em', color: 'var(--bone)', textTransform: 'uppercase', lineHeight: 1 }}>{label}</span>
        {count != null && <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>· {count} ENTRIES</span>}
      </div>
      {cta}
    </div>
  );
}

function CodexCharCard({ cast, onCast }) {
  const stateColor = { trained: 'var(--green)', training: 'var(--tungsten)', failed: 'var(--cut)', empty: 'var(--ink-50)' }[cast.state];

  return (
    <div style={{
      background: 'var(--ink-05)', border: '1px solid var(--ink-30)',
      padding: 18, display: 'flex', flexDirection: 'column', gap: 14
    }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 12, alignItems: 'center' }}>
        <div style={{
          width: 44, height: 44, background: 'var(--ink-20)', border: '1px solid var(--ink-30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--f-mono)', fontSize: 12, letterSpacing: '0.04em', color: 'var(--bone-60)',
          position: 'relative'
        }}>
          {cast.name.split(' ').map(s => s[0]).join('').slice(0, 2)}
          <span style={{
            position: 'absolute', top: -3, right: -3,
            width: 10, height: 10, borderRadius: '50%',
            background: stateColor, border: '1.5px solid var(--ink-05)'
          }}/>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--bone)', lineHeight: 1 }}>{toTitle(cast.name)}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
            <RoleTag>{cast.role}</RoleTag>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.14em', color: 'var(--ink-60)' }}>{cast.scenes} SCENES</span>
          </div>
        </div>
        <button className="btn btn-sm btn-ghost" style={{ padding: '4px 8px', fontSize: 10 }}><Icon.Chevron size={10}/></button>
      </div>

      {/* Soul ID training inline */}
      <CodexSoulRow cast={cast} onCast={onCast}/>

      {/* Brief — abbreviated */}
      {cast.brief && (
        <div style={{ paddingTop: 12, borderTop: '1px solid var(--ink-25)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <BibleRow lbl="Age" val={cast.brief.age}/>
          <BibleRow lbl="Build" val={cast.brief.build}/>
          {cast.brief.wardrobe && <BibleRow lbl="Wardrobe" val={cast.brief.wardrobe}/>}
          {cast.brief.personality && (
            <p style={{ fontStyle: 'italic', color: 'var(--bone-60)', fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>"{cast.brief.personality}"</p>
          )}
        </div>
      )}
      {!cast.brief && (
        <div style={{ paddingTop: 12, borderTop: '1px solid var(--ink-25)', color: 'var(--ink-60)', fontSize: 12, fontStyle: 'italic' }}>
          No casting brief yet. The Cinematographer will need this before generating frames.
        </div>
      )}
    </div>
  );
}

function CodexSoulRow({ cast, onCast }) {
  const state = cast.state;
  if (state === 'trained') {
    return (
      <div style={{ padding: '8px 12px', background: 'rgba(111,191,138,0.05)', borderLeft: '2px solid var(--green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--green)', textTransform: 'uppercase' }}>✓ SOUL ID · TRAINED · {cast.consistency} / 10</span>
        <button onClick={onCast} className="btn btn-sm btn-ghost" style={{ padding: '2px 6px', fontSize: 10 }}>EDIT</button>
      </div>
    );
  }
  if (state === 'training') {
    return (
      <div style={{ padding: '8px 12px', background: 'rgba(242,181,60,0.05)', borderLeft: '2px solid var(--tungsten)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--tungsten)', textTransform: 'uppercase' }}>SOUL ID · TRAINING · {Math.round((cast.progress || 0)*100)}%</span>
        </div>
        <div style={{ height: 2, background: 'var(--ink-25)', marginTop: 6 }}>
          <div style={{ height: '100%', background: 'var(--tungsten)', width: `${(cast.progress || 0)*100}%`, transition: 'width 600ms' }}/>
        </div>
      </div>
    );
  }
  if (state === 'failed') {
    return (
      <div style={{ padding: '8px 12px', background: 'rgba(217,67,67,0.05)', borderLeft: '2px solid var(--cut)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--cut)', textTransform: 'uppercase' }}>✗ SOUL ID · TRAINING FAILED</span>
        <button onClick={onCast} className="btn btn-sm btn-ghost" style={{ padding: '2px 6px', fontSize: 10 }}>RETRY</button>
      </div>
    );
  }
  return (
    <div style={{ padding: '8px 12px', background: 'var(--ink-10)', borderLeft: '2px solid var(--ink-50)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>SOUL ID · NOT STARTED</span>
      <button onClick={onCast} className="btn btn-sm" style={{ padding: '2px 6px', fontSize: 10 }}>CAST</button>
    </div>
  );
}

function CodexLocCard({ loc }) {
  const moodMap = { warehouse: 'mood-cold', apartment: 'mood-amber', precinct: 'mood-neutral', riverside: 'mood-dawn', cafe: 'mood-sun', rooftop: 'mood-noir' };
  const stateColor = { trained: 'var(--green)', training: 'var(--tungsten)', empty: 'var(--ink-50)' }[loc.state];

  return (
    <div style={{
      background: 'var(--ink-05)', border: '1px solid var(--ink-30)',
      display: 'flex', flexDirection: 'column'
    }}>
      <div className={`film-frame ${moodMap[loc.id] || 'mood-neutral'}`} style={{ aspectRatio: '16/10', position: 'relative' }}>
        <div className="letterbox-t"/><div className="letterbox-b"/>
        <div className="corner-tick tl"/><div className="corner-tick br"/>
        {loc.state === 'training' && <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,10,0.5)' }} className="shimmer"/>}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          padding: '3px 6px', background: 'var(--ink-00)', border: '1px solid var(--ink-30)',
          fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.16em', color: 'var(--bone-60)', textTransform: 'uppercase'
        }}>{loc.tag}</div>
        <span style={{
          position: 'absolute', bottom: 8, left: 8,
          width: 8, height: 8, borderRadius: '50%', background: stateColor
        }}/>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--bone)', textTransform: 'uppercase', lineHeight: 1.3 }}>
          {loc.name.split(' — ')[0]}
        </div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase', marginTop: 4 }}>
          {loc.scenes} SCENES · {loc.state === 'trained' ? 'SOUL ID ✓' : loc.state === 'training' ? `${Math.round((loc.progress||0)*100)}%` : 'NOT STARTED'}
        </div>
      </div>
    </div>
  );
}

function CodexNoteCard({ note, accent }) {
  return (
    <div style={{
      background: 'var(--ink-05)', border: '1px solid ' + (accent ? 'var(--ink-40)' : 'var(--ink-30)'),
      padding: 22, display: 'flex', flexDirection: 'column', gap: 8
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--bone)', lineHeight: 1 }}>{note.title.split(' — ')[1] || note.title}</div>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--tungsten)', textTransform: 'uppercase' }}>{note.kind}</span>
      </div>
      <p style={{ color: 'var(--bone-80)', fontSize: 14, lineHeight: 1.6, marginTop: 4 }}>{note.body}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--ink-25)' }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>REFERENCED IN {note.use} SCENES</span>
        <button className="btn btn-sm btn-ghost" style={{ padding: '2px 8px', fontSize: 10 }}>EDIT</button>
      </div>
    </div>
  );
}

function BibleRow({ lbl, val }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 10, alignItems: 'baseline' }}>
      <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>{lbl}</span>
      <span style={{ color: 'var(--bone-80)', fontSize: 12, lineHeight: 1.45 }}>{val}</span>
    </div>
  );
}

function RoleTag({ children }) {
  return (
    <span style={{
      fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: 'var(--bone-60)',
      padding: '2px 6px', background: 'var(--ink-25)'
    }}>{children}</span>
  );
}

function toTitle(s) {
  return s.split(/\s+/).map(w => w[0] + w.slice(1).toLowerCase()).join(' ');
}

Object.assign(window, { ScriptingCodex });
