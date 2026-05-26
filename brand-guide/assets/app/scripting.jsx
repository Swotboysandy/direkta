/* DIREKTA — Scripting workspace
   Top-level tabs: Outline / Script / Codex / Discuss / Analyse
   No left sidebar. Codex (Bible) is now a tab. */

const SCRIPTING_TABS = [
  { id: 'outline',  label: 'Outline'  },
  { id: 'script',   label: 'Script'   },
  { id: 'codex',    label: 'Codex'    },
  { id: 'discuss',  label: 'Discuss'  },
  { id: 'analyse',  label: 'Analyse'  }
];

function Scripting({ project, beats, casting, manuscript, acts, snippets, threads, sceneWords, charDist, onSwitchWorkspace }) {
  const [activeTab, setActiveTab] = React.useState('script');
  const [activeThread, setActiveThread] = React.useState(threads[0].id);

  return (
    <div className="scripting-root" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <header style={{
        display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center',
        padding: '20px 32px 0', gap: 24
      }}>
        <div>
          <div className="crumb" style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.24em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>02 / WORKSPACE · SCRIPTING</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginTop: 6, flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 36, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--bone)', lineHeight: 1 }}>Scripting</h1>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>The Lisbon Pact · v4 · 38 pages · 12,840 words</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="pip-state" data-s="working">BEAT WRITER · CLARIFICATION PENDING</span>
          <button className="btn btn-primary" onClick={() => onSwitchWorkspace('casting')}>Continue to Casting <Icon.Arrow size={14}/></button>
        </div>
      </header>

      {/* Tab bar */}
      <div style={{ padding: '20px 32px 0', borderBottom: '1px solid var(--ink-30)' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {SCRIPTING_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: 'transparent', border: 0,
                padding: '12px 24px 14px',
                fontFamily: 'var(--f-display)', fontSize: 18, letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: activeTab === t.id ? 'var(--bone)' : 'var(--ink-60)',
                cursor: 'pointer',
                borderBottom: '2px solid ' + (activeTab === t.id ? 'var(--tungsten)' : 'transparent'),
                marginBottom: -1
              }}
              onMouseEnter={(e) => { if (activeTab !== t.id) e.currentTarget.style.color = 'var(--bone-60)'; }}
              onMouseLeave={(e) => { if (activeTab !== t.id) e.currentTarget.style.color = 'var(--ink-60)'; }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Body — full width, no left sidebar */}
      <div style={{ flex: 1, overflow: 'hidden', background: 'var(--ink-00)' }}>
        {activeTab === 'outline'  && <ScrollWrap><ScriptingOutline acts={acts} beats={beats}/></ScrollWrap>}
        {activeTab === 'script'   && <ScriptingScript manuscript={manuscript} casting={casting}/>}
        {activeTab === 'codex'    && <ScrollWrap><ScriptingCodex casting={casting} snippets={snippets} beats={beats} onSwitchWorkspace={onSwitchWorkspace}/></ScrollWrap>}
        {activeTab === 'discuss'  && <ScriptingDiscuss threads={threads} activeId={activeThread} onSwitch={setActiveThread}/>}
        {activeTab === 'analyse'  && <ScrollWrap><ScriptingAnalyse sceneWords={sceneWords} charDist={charDist}/></ScrollWrap>}
      </div>
    </div>
  );
}

function ScrollWrap({ children }) {
  return <div style={{ height: '100%', overflowY: 'auto' }}>{children}</div>;
}

Object.assign(window, { Scripting });
