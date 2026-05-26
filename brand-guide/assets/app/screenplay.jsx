/* DIREKTA — Screenplay workspace */

const spStyles = {
  split: {
    display: 'grid',
    gridTemplateColumns: '1.15fr 1fr',
    height: 'calc(100vh - 56px - 116px)',
    borderTop: '1px solid var(--ink-30)'
  },
  left: { overflowY: 'auto', borderRight: '1px solid var(--ink-30)', background: 'var(--ink-05)' },
  right: { overflowY: 'auto', background: 'var(--ink-00)' }
};

function Screenplay({ project, beats, onSwitchWorkspace }) {
  const [expandedBeat, setExpandedBeat] = React.useState(4);
  const [clarificationResolved, setClarificationResolved] = React.useState(false);

  return (
    <div className="main-inner screenplay">
      <header className="page-head">
        <div>
          <div className="crumb">02 / WORKSPACE · SCREENPLAY</div>
          <h1>Screenplay</h1>
          <div className="sub">
            Script Reader completed analysis. Beat Writer has paused on <strong style={{color:'var(--bone)'}}>Beat 12</strong> for one clarification. Bible is built.
          </div>
        </div>
        <div className="actions">
          <span className="pip-state" data-s="done">47 BEATS · COMPLETE</span>
          <button className="btn">View Bible</button>
          <button className="btn btn-primary" onClick={() => onSwitchWorkspace('casting')}>Continue to Casting <Icon.Arrow size={14}/></button>
        </div>
      </header>

      <div style={spStyles.split}>
        {/* LEFT — Script */}
        <div style={spStyles.left}>
          <div style={{ padding: '20px 32px 12px', borderBottom: '1px solid var(--ink-25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--ink-05)', zIndex: 5 }}>
            <div>
              <div className="eb muted">SCRIPT · 38 PAGES · READ-ONLY</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--bone)', marginTop: 2 }}>The Lisbon Pact</div>
            </div>
            <button className="btn btn-sm">Edit script</button>
          </div>
          <ScriptPanel script={window.DK_DATA.SCRIPT} />
        </div>

        {/* RIGHT — Breakdown */}
        <div style={spStyles.right}>
          {/* Progress strip */}
          <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--ink-25)', position: 'sticky', top: 0, background: 'var(--ink-00)', zIndex: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="eb">BREAKDOWN · 46 OF 47 BEATS</div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>1 PAUSED FOR INPUT</div>
            </div>
            <div style={{ height: 3, background: 'var(--ink-25)', marginTop: 10 }}>
              <div style={{ height: '100%', background: 'var(--tungsten)', width: '97.8%' }}/>
            </div>
          </div>

          <div style={{ padding: '24px 32px 80px' }}>
            {/* Bible summary */}
            <div style={{
              border: '1px solid var(--ink-30)',
              background: 'var(--ink-10)',
              padding: 22, marginBottom: 20
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="eb">BIBLE BUILDER · COMPLETE</div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--bone)', marginTop: 6 }}>Production Bible — built</div>
                </div>
                <Icon.Check size={16} style={{ color: 'var(--green)' }}/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--ink-30)' }}>
                <BibleStat n="12" lbl="Characters"/>
                <BibleStat n="8" lbl="Locations"/>
                <BibleStat n="3,200" lbl="Words"/>
                <BibleStat n="47" lbl="Scenes"/>
              </div>
              <button className="btn btn-sm" style={{ marginTop: 16 }}>View full bible</button>
            </div>

            {/* Clarification card */}
            {!clarificationResolved && (
              <ClarificationCard onResolve={() => setClarificationResolved(true)} />
            )}
            {clarificationResolved && (
              <div style={{ border: '1px solid var(--ink-30)', background: 'var(--ink-05)', padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon.Check size={14} style={{ color: 'var(--green)' }}/>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-70)', textTransform: 'uppercase' }}>BEAT 12 · CLARIFICATION RESOLVED</span>
                <button className="btn-ghost btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setClarificationResolved(false)}>Undo</button>
              </div>
            )}

            {/* Beats */}
            <div className="eb muted" style={{ marginBottom: 12 }}>BEATS · 1 — 7 OF 47</div>
            {beats.map(b => (
              <BeatCard
                key={b.n}
                beat={b}
                expanded={expandedBeat === b.n}
                onToggle={() => setExpandedBeat(expandedBeat === b.n ? null : b.n)}
              />
            ))}

            {/* Generating row at bottom */}
            <div style={{
              border: '1px solid var(--ink-30)',
              background: 'var(--ink-05)',
              padding: 16, marginTop: 12,
              display: 'flex', alignItems: 'center', gap: 14
            }}>
              <span className="pip-state" data-s="working"></span>
              <div>
                <div style={{ color: 'var(--bone)', fontSize: 14, fontWeight: 500 }}>Beat Writer is on Beat 13.</div>
                <div style={{ color: 'var(--ink-70)', fontSize: 13, marginTop: 2 }}>Building the next 34 beats — pace varies with scene density.</div>
              </div>
              <div style={{ marginLeft: 'auto', fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>~ 4 MIN REMAINING</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BibleStat({ n, lbl }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 32, letterSpacing: '0.02em', color: 'var(--bone)', lineHeight: 1 }}>{n}</div>
      <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase', marginTop: 4 }}>{lbl}</div>
    </div>
  );
}

function ScriptPanel({ script }) {
  // assign beat numbers to scene headings
  let sceneCount = 0;
  return (
    <div style={{ padding: '24px 32px 80px', fontFamily: 'var(--f-mono)', fontSize: 13, lineHeight: 1.7, color: 'var(--ink-70)', letterSpacing: '0.01em' }}>
      {script.map((line, i) => {
        if (line.type === 'scene') {
          sceneCount += 1;
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '52px 1fr', gap: 16, marginTop: 32, alignItems: 'baseline' }}>
              <div style={{
                fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em',
                color: 'var(--tungsten)', padding: '4px 6px',
                border: '1px solid var(--tungsten)', textAlign: 'center'
              }}>B {String(sceneCount).padStart(2, '0')}</div>
              <div style={{
                color: 'var(--bone)', fontFamily: 'var(--f-mono)', fontSize: 13,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                background: 'rgba(242, 181, 60, 0.06)',
                padding: '6px 10px',
                borderLeft: '2px solid var(--tungsten)'
              }}>{line.text}</div>
            </div>
          );
        }
        if (line.type === 'action') {
          return <p key={i} style={{ marginTop: 14, color: 'var(--ink-70)' }}>{line.text}</p>;
        }
        if (line.type === 'char') {
          return <p key={i} style={{ marginTop: 14, marginLeft: '14em', color: 'var(--bone)', textTransform: 'uppercase' }}>{line.text}</p>;
        }
        if (line.type === 'paren') {
          return <p key={i} style={{ marginLeft: '12em', color: 'var(--ink-60)' }}>{line.text}</p>;
        }
        if (line.type === 'dialogue') {
          return <p key={i} style={{ marginLeft: '6em', maxWidth: '28em' }}>{line.text}</p>;
        }
        return null;
      })}
    </div>
  );
}

function ClarificationCard({ onResolve }) {
  const [picked, setPicked] = React.useState(null);
  const handlePick = (opt) => {
    setPicked(opt);
    setTimeout(onResolve, 380);
  };

  return (
    <div style={{
      border: '1px solid var(--tungsten)',
      background: 'var(--ink-05)',
      padding: 22, marginBottom: 20,
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Icon.Flag size={16} style={{ color: 'var(--tungsten)', marginTop: 4 }}/>
        <div style={{ flex: 1 }}>
          <div className="eb">BEAT WRITER · CLARIFICATION</div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--bone)', marginTop: 6, lineHeight: 1.0 }}>
            Beat 12 — "What happened in Lisbon."
          </div>
          <p style={{ color: 'var(--ink-70)', fontSize: 14, marginTop: 12, lineHeight: 1.55 }}>
            Marcus refers to <strong style={{color:'var(--bone)'}}>"what happened in Lisbon"</strong> — this event isn't defined anywhere in the script. <strong style={{color:'var(--bone)'}}>How should I treat it?</strong>
          </p>
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <ClarOpt
          label="Add as backstory"
          desc="Note as implied backstory in the Bible."
          picked={picked === 'backstory'}
          onClick={() => handlePick('backstory')}
        />
        <ClarOpt
          label="Flag as a plot gap"
          desc="Mark for the writer's attention."
          picked={picked === 'gap'}
          onClick={() => handlePick('gap')}
        />
        <ClarOpt
          label="It's intentionally vague"
          desc="Treat as a deliberate mystery."
          picked={picked === 'vague'}
          onClick={() => handlePick('vague')}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <input
          type="text"
          placeholder="Or tell me more…"
          style={{
            width: '100%',
            background: 'var(--ink-00)', border: '1px solid var(--ink-30)',
            color: 'var(--bone)', padding: '10px 14px',
            fontFamily: 'var(--f-ui)', fontSize: 13, letterSpacing: 0,
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--tungsten)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--ink-30)'}
        />
      </div>
    </div>
  );
}

function ClarOpt({ label, desc, picked, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '12px 14px',
        background: picked ? 'var(--tungsten)' : 'var(--ink-10)',
        border: '1px solid ' + (picked ? 'var(--tungsten)' : 'var(--ink-30)'),
        color: picked ? 'var(--ink-00)' : 'var(--bone)',
        cursor: 'pointer', transition: 'all 80ms'
      }}
      onMouseEnter={(e) => { if (!picked) e.currentTarget.style.borderColor = 'var(--tungsten)'; }}
      onMouseLeave={(e) => { if (!picked) e.currentTarget.style.borderColor = 'var(--ink-30)'; }}
    >
      <div style={{ fontFamily: 'var(--f-ui)', fontWeight: 500, fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 12, marginTop: 4, color: picked ? 'rgba(8,8,10,0.7)' : 'var(--ink-70)' }}>{desc}</div>
    </button>
  );
}

function BeatCard({ beat, expanded, onToggle }) {
  return (
    <div style={{
      border: '1px solid var(--ink-30)',
      background: 'var(--ink-05)',
      marginBottom: 8, transition: 'border-color 80ms'
    }}>
      <div
        onClick={onToggle}
        style={{
          padding: '14px 18px',
          cursor: 'pointer',
          display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 16, alignItems: 'center'
        }}
      >
        <div style={{
          fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em',
          color: 'var(--tungsten)', textTransform: 'uppercase'
        }}>BEAT {String(beat.n).padStart(2, '0')}</div>
        <div>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.06em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>{beat.slug}</div>
          <div style={{ color: 'var(--bone)', fontSize: 15, fontWeight: 500, marginTop: 4 }}>{beat.title}</div>
          {beat.note && <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.22em', color: 'var(--cut)', textTransform: 'uppercase', marginTop: 4 }}>{beat.note}</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {beat.chars.slice(0, 2).map(c => <CharPill key={c} name={c}/>)}
          {beat.chars.length > 2 && <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ink-60)' }}>+{beat.chars.length - 2}</span>}
          <span style={{ marginLeft: 8, transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 120ms', color: 'var(--ink-60)' }}>
            <Icon.Chevron size={14}/>
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{
          padding: '0 18px 18px',
          borderTop: '1px solid var(--ink-25)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
          paddingTop: 16
        }}>
          <div>
            <div className="eb muted">CAST PRESENT</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {beat.chars.map(c => <CharPill key={c} name={c}/>)}
            </div>
            <div className="eb muted" style={{ marginTop: 14 }}>EMOTIONAL REGISTER</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {beat.mood.map(m => (
                <span key={m} style={{
                  fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.22em',
                  textTransform: 'uppercase', color: 'var(--tungsten)',
                  padding: '4px 8px', border: '1px solid var(--tungsten)', borderColor: 'rgba(242, 181, 60, 0.4)'
                }}>{m}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="eb muted">LOCATION</div>
            <div style={{ color: 'var(--bone)', fontFamily: 'var(--f-mono)', fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 8 }}>{beat.slug}</div>
            {beat.props && (
              <>
                <div className="eb muted" style={{ marginTop: 14 }}>PROPS NOTED</div>
                <div style={{ color: 'var(--ink-70)', fontSize: 13, marginTop: 8 }}>{beat.props.join(' · ')}</div>
              </>
            )}
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--ink-25)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon.Camera size={14} style={{ color: 'var(--tungsten)' }}/>
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-70)', textTransform: 'uppercase' }}>WILL GENERATE STORYBOARD FRAMES</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CharPill({ name }) {
  return (
    <span style={{
      fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.16em',
      textTransform: 'uppercase', color: 'var(--bone)',
      padding: '4px 8px', background: 'var(--ink-25)', border: '1px solid var(--ink-30)'
    }}>{name}</span>
  );
}

Object.assign(window, { Screenplay });
