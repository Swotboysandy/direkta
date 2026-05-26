/* DIREKTA — Casting workspace */

function Casting({ casting, onSwitchWorkspace }) {
  const [expandedId, setExpandedId] = React.useState('reyes');

  const characters = casting.filter(c => c.type === 'character');
  const locations  = casting.filter(c => c.type === 'location');

  return (
    <div className="main-inner casting">
      <header className="page-head">
        <div>
          <div className="crumb">03 / WORKSPACE · CASTING</div>
          <h1>Casting</h1>
          <div className="sub">Train a <strong style={{color:'var(--bone)'}}>Soul ID</strong> for every character and key location. Consistency starts here.</div>
        </div>
        <div className="actions">
          <span className="pip-state" data-s="working">4 / 6 SOUL IDS</span>
          <button className="btn"><Icon.Plus size={12}/> Add manually</button>
          <button className="btn btn-primary" onClick={() => onSwitchWorkspace('storyboard')}>
            Continue to Storyboard <Icon.Arrow size={14}/>
          </button>
        </div>
      </header>

      <div className="page-body">
        {/* CHARACTERS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div className="eb">CHARACTERS · 6 OF 12 CAST</div>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>SHOWING ALL FOUR STATES</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {characters.map(c => (
            <SoulCard
              key={c.id}
              cast={c}
              expanded={expandedId === c.id}
              onExpand={() => setExpandedId(c.id)}
            />
          ))}
        </div>

        {/* LOCATIONS */}
        <div className="eb" style={{ marginTop: 40, marginBottom: 14 }}>LOCATIONS · 8 IDENTIFIED</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {locations.map(l => (
            <LocationCard key={l.id} loc={l} />
          ))}
        </div>

        {/* footer */}
        <div style={{ marginTop: 40, padding: 22, border: '1px solid var(--ink-30)', background: 'var(--ink-05)', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div className="eb">CASTING DIRECTOR</div>
            <div style={{ color: 'var(--bone)', fontSize: 15, marginTop: 6 }}>
              4 Soul IDs ready. Train <strong>RAFA</strong> and resolve <strong>CAPT. HALL</strong> before Storyboard generates frames containing them.
            </div>
          </div>
          <button className="btn">Skip — generate without them</button>
          <button className="btn btn-primary">Train remaining</button>
        </div>
      </div>
    </div>
  );
}

function SoulCard({ cast, expanded, onExpand }) {
  const state = cast.state;

  // Empty
  if (state === 'empty') {
    return (
      <div style={cardBase}>
        <CardHeader cast={cast} status={<span className="pip-state">NOT STARTED</span>} />
        <div style={{
          minHeight: 120, marginTop: 14,
          border: '1px dashed var(--ink-40)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, color: 'var(--ink-60)', padding: 16, textAlign: 'center'
        }}>
          <Icon.Plus size={18}/>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase' }}>ADD REFERENCE PHOTOS</div>
        </div>
        <button className="btn" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>
          Begin casting
        </button>
      </div>
    );
  }

  // Training
  if (state === 'training') {
    return (
      <div style={{ ...cardBase, borderColor: 'var(--tungsten)' }}>
        <CardHeader cast={cast} status={<span className="pip-state" data-s="working">TRAINING · {Math.round(cast.progress*100)}%</span>} />
        <PhotoStrip count={cast.refsCount || 6} />
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 3, background: 'var(--ink-25)' }}>
            <div style={{ height: '100%', background: 'var(--tungsten)', width: `${cast.progress*100}%`, transition: 'width 600ms' }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>
            <span>EXTRACTING FEATURES</span>
            <span>~ 2 MIN REMAINING</span>
          </div>
        </div>
        {expanded && cast.brief && <ExpandedDetails cast={cast} />}
        {!expanded && <button className="btn btn-sm btn-ghost" style={{ marginTop: 14, alignSelf: 'flex-start' }} onClick={onExpand}>Show brief</button>}
      </div>
    );
  }

  // Failed
  if (state === 'failed') {
    return (
      <div style={{ ...cardBase, borderColor: 'var(--cut)' }}>
        <CardHeader cast={cast} status={<span className="pip-state" data-s="attention">TRAINING FAILED</span>} />
        <div style={{
          marginTop: 14, padding: 14, background: 'rgba(217, 67, 67, 0.06)',
          borderLeft: '2px solid var(--cut)', color: 'var(--ink-70)', fontSize: 13, lineHeight: 1.5
        }}>
          {cast.error}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}><Icon.Refresh size={12}/> Retry</button>
          <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}><Icon.Plus size={12}/> Add references</button>
        </div>
      </div>
    );
  }

  // Trained
  return (
    <div style={cardBase}>
      <CardHeader cast={cast} status={<span className="pip-state" data-s="done">TRAINED · {cast.consistency} / 10</span>} />
      <FaceGrid name={cast.name} />
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Test consistency</button>
        <button className="btn btn-sm btn-ghost">Edit</button>
      </div>
      {expanded && cast.brief && <ExpandedDetails cast={cast} />}
    </div>
  );
}

const cardBase = {
  background: 'var(--ink-05)',
  border: '1px solid var(--ink-30)',
  padding: 20,
  display: 'flex', flexDirection: 'column',
  transition: 'border-color 80ms'
};

function CardHeader({ cast, status }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
      <div>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 26, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--bone)', lineHeight: 1 }}>{cast.name}</div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase', marginTop: 6 }}>
          {cast.role} · {cast.scenes} SCENES{cast.dialogue ? ' · SPEAKING' : ''}
        </div>
      </div>
      <div>{status}</div>
    </div>
  );
}

function PhotoStrip({ count }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
      {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
        <div key={i} style={{
          flex: 1, aspectRatio: '3/4',
          background: 'var(--ink-15)',
          border: '1px solid var(--ink-30)',
          position: 'relative', overflow: 'hidden'
        }} className={i === count - 1 ? 'shimmer' : ''}>
          <div style={{
            position: 'absolute', inset: '20% 25%',
            background: `radial-gradient(ellipse at center, rgba(237,231,217,0.12) 0%, transparent 70%)`
          }}/>
          <div style={{
            position: 'absolute', top: '40%', left: '30%', width: '40%', height: '30%',
            background: 'rgba(0,0,0,0.4)', borderRadius: '50% 50% 45% 45%'
          }}/>
        </div>
      ))}
    </div>
  );
}

function FaceGrid({ name }) {
  // 3 consistent face variants — different lighting/angle hint
  const moods = ['radial-gradient(ellipse at 30% 40%, #2a2018 0%, #0a0805 75%)',
                 'radial-gradient(ellipse at 70% 50%, #1c2226 0%, #060709 75%)',
                 'radial-gradient(ellipse at 50% 35%, #261a14 0%, #08060a 75%)'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 16 }}>
      {moods.map((bg, i) => (
        <div key={i} style={{
          aspectRatio: '3/4', background: bg, position: 'relative', overflow: 'hidden',
          border: '1px solid var(--ink-30)'
        }}>
          <div style={{
            position: 'absolute', top: '32%', left: '30%', width: '40%', height: '30%',
            background: 'rgba(0,0,0,0.5)', borderRadius: '50% 50% 45% 45%', filter: 'blur(1.5px)'
          }}/>
          <div style={{
            position: 'absolute', top: '58%', left: '20%', width: '60%', height: '40%',
            background: 'rgba(0,0,0,0.45)', filter: 'blur(2px)'
          }}/>
          <div style={{
            position: 'absolute', bottom: 4, left: 6,
            fontFamily: 'var(--f-mono)', fontSize: 8, letterSpacing: '0.16em',
            color: 'rgba(237,231,217,0.5)', textTransform: 'uppercase'
          }}>V0{i+1}</div>
        </div>
      ))}
    </div>
  );
}

function ExpandedDetails({ cast }) {
  const b = cast.brief;
  return (
    <div style={{
      marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--ink-25)',
      display: 'flex', flexDirection: 'column', gap: 10
    }}>
      <div className="eb muted">CASTING BRIEF</div>
      <BriefRow lbl="AGE"      val={b.age}/>
      <BriefRow lbl="BUILD"    val={b.build}/>
      <BriefRow lbl="FEATURES" val={b.features}/>
      <BriefRow lbl="WARDROBE" val={b.wardrobe}/>
      <BriefRow lbl="REGISTER" val={b.register}/>
      <p style={{ color: 'var(--ink-70)', fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>"{b.personality}"</p>
    </div>
  );
}

function BriefRow({ lbl, val }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12, alignItems: 'baseline' }}>
      <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>{lbl}</span>
      <span style={{ color: 'var(--bone)', fontSize: 13 }}>{val}</span>
    </div>
  );
}

function LocationCard({ loc }) {
  const isTrained = loc.state === 'trained';
  const isTraining = loc.state === 'training';
  const moodMap = { warehouse: 'mood-cold', apartment: 'mood-amber', precinct: 'mood-neutral', riverside: 'mood-dawn', cafe: 'mood-sun', rooftop: 'mood-noir' };
  return (
    <div style={{
      background: 'var(--ink-05)', border: '1px solid var(--ink-30)',
      padding: 16, display: 'flex', flexDirection: 'column', gap: 12
    }}>
      <div className={`film-frame ${moodMap[loc.id] || 'mood-neutral'}`} style={{ aspectRatio: '16/10', position: 'relative', minHeight: 100 }}>
        <div className="letterbox-t"/><div className="letterbox-b"/>
        <div className="corner-tick tl"/><div className="corner-tick br"/>
        {isTraining && <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,10,0.5)' }} className="shimmer"/>}
        <div className="stamp">{loc.tag} · LOCATION</div>
      </div>
      <div>
        <div style={{ color: 'var(--bone)', fontFamily: 'var(--f-mono)', fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.3 }}>{loc.name}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>{loc.scenes} SCENES</span>
          {isTrained && <span className="pip-state" data-s="done">TRAINED</span>}
          {isTraining && <span className="pip-state" data-s="working">{Math.round(loc.progress*100)}%</span>}
          {loc.state === 'empty' && <span className="pip-state">NOT STARTED</span>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Casting });
