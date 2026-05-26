/* DIREKTA — Dashboard workspace */

const dashStyles = {
  pipeline: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    border: '1px solid var(--ink-30)',
    background: 'var(--ink-05)',
    position: 'relative'
  },
  stage: {
    padding: '24px 22px',
    borderRight: '1px solid var(--ink-30)',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    cursor: 'pointer',
    transition: 'background 80ms'
  },
  stageLast: { borderRight: 'none' }
};

function Dashboard({ project, workspaces, activity, onSwitchWorkspace }) {
  const pipeKeys = ['scripting','casting','storyboard','stitch','export'];
  const wsMap = Object.fromEntries(workspaces.map(w => [w.id, w]));

  return (
    <div className="main-inner dashboard">
      {/* HEADER */}
      <header className="page-head">
        <div>
          <div className="crumb">DASHBOARD · {project.title.toUpperCase()}</div>
          <h1>{project.title}</h1>
          <p className="sub" style={{ marginTop: 12, color: 'var(--bone)', fontFamily: 'var(--f-display)', fontSize: 20, letterSpacing: '0.03em', textTransform: 'uppercase', maxWidth: '64ch', lineHeight: 1.2 }}>
            {project.logline}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <Tag>{project.format}</Tag>
            <Tag>{project.lengthEstimate}</Tag>
            {(project.tone || []).map(t => <Tag key={t}>{t}</Tag>)}
            <Tag>{project.sceneCount} scenes</Tag>
            <Tag>{project.charCount} characters</Tag>
          </div>
        </div>
        <div className="actions">
          <button className="btn"><Icon.Save size={14}/> Edit project</button>
          <button className="btn btn-primary" onClick={() => onSwitchWorkspace('screenplay')}>
            Continue working <Icon.Arrow size={14}/>
          </button>
        </div>
      </header>

      <div className="page-body">
        {/* PIPELINE */}
        <div className="eb" style={{ marginBottom: 14 }}>PRODUCTION PIPELINE · 5 STAGES</div>
        <div style={dashStyles.pipeline}>
          {pipeKeys.map((k, i) => {
            const w = wsMap[k];
            const stage = project.stages[k === 'scripting' ? 'screenplay' : k] ?? 0;
            const Icn = { scripting: Icon.Screenplay, casting: Icon.Casting, storyboard: Icon.Storyboard, stitch: Icon.Stitch, export: Icon.Export }[k];
            const statusLabel = stage >= 1 ? 'COMPLETE' : stage > 0 ? 'IN PROGRESS' : 'NOT STARTED';
            const statusS = stage >= 1 ? 'done' : stage > 0 ? 'working' : null;
            return (
              <div
                key={k}
                style={{ ...dashStyles.stage, ...(i === 4 ? dashStyles.stageLast : {}) }}
                onClick={() => onSwitchWorkspace(k)}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ink-10)'}
                onMouseLeave={(e) => e.currentTarget.style.background = ''}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>0{i+1} / 05</span>
                  <span style={{ color: stage > 0 ? 'var(--tungsten)' : 'var(--ink-50)' }}><Icn size={20}/></span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--bone)' }}>{w.label}</div>
                  {w.note && <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase', marginTop: 4 }}>{w.note}</div>}
                </div>
                {/* progress bar */}
                <div style={{ height: 3, background: 'var(--ink-25)', position: 'relative', marginTop: 'auto' }}>
                  <div style={{ height: '100%', background: 'var(--tungsten)', width: `${Math.max(stage * 100, 0)}%`, transition: 'width 400ms' }}/>
                </div>
                {statusS ? (
                  <span className="pip-state" data-s={statusS}>{statusLabel}</span>
                ) : (
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-50)', textTransform: 'uppercase' }}>{statusLabel}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* QUICK ACCESS CARDS */}
        <div style={{ marginTop: 36 }}>
          <div className="eb" style={{ marginBottom: 14 }}>QUICK ACCESS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
            <QuickCard ws="scripting" title="Scripting" cta="Review beats" status="46 / 47 beats · Bible built" stage="working" lastActivity="58 min ago" onClick={() => onSwitchWorkspace('scripting')} />
            <QuickCard ws="casting" title="Casting" cta="Manage Soul IDs" status="4 of 6 Soul IDs trained" stage="working" lastActivity="12 min ago" onClick={() => onSwitchWorkspace('casting')} />
            <QuickCard ws="storyboard" title="Storyboard" cta="Generate frames" status="15 of 47 frames selected" stage="working" lastActivity="4 min ago" onClick={() => onSwitchWorkspace('storyboard')} />
            <QuickCard ws="stitch" title="Stitch" cta="Build animatic" status="6 nodes · 2 clips rendered" stage="working" lastActivity="just now" onClick={() => onSwitchWorkspace('stitch')} />
            <QuickCard ws="library" title="Library" cta="Browse outputs" status="31 items across 4 projects" stage="done" lastActivity="4 min ago" onClick={() => onSwitchWorkspace('library')} />
            <QuickCard ws="export" title="Export" cta="Export project" status="Locked — waiting on animatic" stage="locked" lastActivity="—" onClick={() => onSwitchWorkspace('export')} />
          </div>
        </div>

        {/* ACTIVITY FEED */}
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
          <div>
            <div className="eb" style={{ marginBottom: 14 }}>ACTIVITY FEED · CREW LOG</div>
            <div style={{ border: '1px solid var(--ink-30)', background: 'var(--ink-05)' }}>
              {activity.map((a, i) => <ActivityRow key={i} item={a}/>)}
            </div>
          </div>

          <div>
            <div className="eb" style={{ marginBottom: 14 }}>OPEN ITEMS · 2</div>
            <div className="card" style={{ background: 'var(--ink-05)', borderColor: 'var(--cut)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Icon.Flag size={16} style={{ color: 'var(--cut)', marginTop: 2 }}/>
                <div>
                  <div className="eb err">CONTINUITY CHECKER</div>
                  <div style={{ color: 'var(--bone)', fontSize: 15, marginTop: 8, lineHeight: 1.45 }}>
                    Marcus wears a leather jacket in <strong>Beat 05</strong>, but he was in a suit in <strong>Beat 03</strong> — same night.
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button className="btn btn-sm" onClick={() => onSwitchWorkspace('storyboard')}>Open Beat 05</button>
                    <button className="btn btn-sm btn-ghost">Dismiss</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="card" style={{ background: 'var(--ink-05)', marginTop: 12, borderColor: 'var(--tungsten)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Icon.Flag size={16} style={{ color: 'var(--tungsten)', marginTop: 2 }}/>
                <div>
                  <div className="eb">BEAT WRITER</div>
                  <div style={{ color: 'var(--bone)', fontSize: 15, marginTop: 8, lineHeight: 1.45 }}>
                    <strong>Beat 12</strong> — Marcus refers to "what happened in Lisbon." How should I treat it?
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button className="btn btn-sm btn-primary" onClick={() => onSwitchWorkspace('scripting')}>Resolve</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span style={{
      fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em',
      textTransform: 'uppercase', color: 'var(--ink-70)',
      padding: '5px 10px', border: '1px solid var(--ink-30)',
      whiteSpace: 'nowrap'
    }}>{children}</span>
  );
}

function QuickCard({ ws, title, cta, status, stage, lastActivity, onClick }) {
  const Icn = { scripting: Icon.Screenplay, casting: Icon.Casting, storyboard: Icon.Storyboard, stitch: Icon.Stitch, library: Icon.Save, export: Icon.Export }[ws];
  const locked = stage === 'locked';
  return (
    <div
      style={{
        background: 'var(--ink-05)', border: '1px solid var(--ink-30)',
        padding: 22, cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked ? 0.5 : 1,
        display: 'flex', flexDirection: 'column', gap: 14, minHeight: 200
      }}
      onClick={!locked ? onClick : undefined}
      onMouseEnter={(e) => !locked && (e.currentTarget.style.borderColor = 'var(--ink-60)')}
      onMouseLeave={(e) => !locked && (e.currentTarget.style.borderColor = 'var(--ink-30)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ color: stage === 'done' ? 'var(--tungsten)' : 'var(--bone)' }}><Icn size={22}/></span>
        {locked && <Icon.Lock size={14} style={{ color: 'var(--ink-60)' }}/>}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--bone)' }}>{title}</div>
        <div style={{ color: 'var(--ink-70)', fontSize: 12, marginTop: 6, lineHeight: 1.4 }}>{status}</div>
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>{lastActivity}</span>
        {!locked && (
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--tungsten)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
            {cta} <Icon.Chevron size={12}/>
          </span>
        )}
      </div>
    </div>
  );
}

function ActivityRow({ item }) {
  const ag = window.DK_DATA.AGENTS.find(a => a.id === item.agent);
  const time = item.time;
  // render simple bold parsing for **text**
  const parts = item.text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--bone)', fontWeight: 500 }}>{p.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
  return (
    <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--ink-25)', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'baseline' }}>
      <span style={{
        fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em',
        color: ag?.state === 'attention' ? 'var(--cut)' : 'var(--tungsten)',
        textTransform: 'uppercase', minWidth: 160
      }}>{ag?.name?.toUpperCase()}</span>
      <span style={{ color: 'var(--ink-70)', fontSize: 14, lineHeight: 1.45 }}>{parts}</span>
      <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>{time}</span>
    </div>
  );
}

Object.assign(window, { Dashboard });
