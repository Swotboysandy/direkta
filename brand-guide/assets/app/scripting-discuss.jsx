/* DIREKTA — Scripting · Discuss tab (NC-style chat) */

function ScriptingDiscuss({ threads, activeId, onSwitch }) {
  const active = threads.find(t => t.id === activeId) || threads[0];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '100%' }}>
      {/* Thread list */}
      <div style={{ borderRight: '1px solid var(--ink-30)', background: 'var(--ink-05)', overflowY: 'auto' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ink-30)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="eb muted">CONTINUE WHERE YOU LEFT OFF</span>
          <button className="btn btn-sm btn-ghost" style={{ padding: '4px 8px', fontSize: 10 }}><Icon.Plus size={10}/> NEW</button>
        </div>
        {threads.map(t => (
          <ThreadListItem key={t.id} thread={t} active={t.id === activeId} onClick={() => onSwitch(t.id)}/>
        ))}
        <div style={{ padding: 18, textAlign: 'center', borderTop: '1px solid var(--ink-25)' }}>
          <button className="btn btn-sm btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>See all threads</button>
        </div>
      </div>

      {/* Active thread */}
      <ThreadPanel thread={active}/>
    </div>
  );
}

function ThreadListItem({ thread, active, onClick }) {
  const agent = window.DK_DATA.AGENTS.find(a => a.id === thread.agent);
  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px 18px',
        cursor: 'pointer',
        borderLeft: '2px solid ' + (active ? 'var(--tungsten)' : 'transparent'),
        background: active ? 'var(--ink-10)' : 'transparent',
        borderBottom: '1px solid var(--ink-20)'
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--ink-10)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ color: 'var(--bone)', fontSize: 13, lineHeight: 1.4 }}>{thread.title}</div>
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--tungsten)', textTransform: 'uppercase' }}>{agent?.name?.toUpperCase()}</span>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--ink-60)' }}>· {thread.date}</span>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--ink-60)' }}>· {thread.count}</span>
        {thread.pinned && <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--tungsten)' }}>· PINNED</span>}
      </div>
    </div>
  );
}

function ThreadPanel({ thread }) {
  const agent = window.DK_DATA.AGENTS.find(a => a.id === thread.agent);
  const messages = thread.messages || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--ink-30)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="eb">{agent?.name?.toUpperCase()} · DISCUSS</div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 24, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--bone)', marginTop: 4, lineHeight: 1 }}>{thread.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm btn-ghost"><Icon.Flag size={12}/> PIN</button>
          <button className="btn btn-sm btn-ghost"><Icon.Refresh size={12}/></button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 32px', color: 'var(--ink-60)' }}>
            <div className="eb muted" style={{ marginBottom: 12 }}>NEW THREAD</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--bone)' }}>Start a conversation</div>
            <p style={{ marginTop: 8, fontSize: 14 }}>Ask any agent — Beat Writer, Bible Builder, Casting Director — for direction.</p>
          </div>
        ) : (
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {messages.map((m, i) => <Message key={i} message={m}/>)}
            {/* Agent presence indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-60)', fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--tungsten)' }} className="rec-dot"></span>
              BEAT WRITER IS THINKING
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '16px 32px 20px', borderTop: '1px solid var(--ink-30)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            background: 'var(--ink-05)',
            border: '1px solid var(--ink-30)',
            padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 10
          }}>
            <input
              type="text"
              placeholder="Talk to the Beat Writer…"
              style={{
                background: 'transparent', border: 0,
                color: 'var(--bone)', fontFamily: 'var(--f-ui)',
                fontSize: 14, outline: 'none', width: '100%'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid var(--ink-25)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm btn-ghost" style={{ padding: '4px 8px', fontSize: 10 }}>@ MENTION</button>
                <button className="btn btn-sm btn-ghost" style={{ padding: '4px 8px', fontSize: 10 }}>+ CONTEXT</button>
                <button className="btn btn-sm btn-ghost" style={{ padding: '4px 8px', fontSize: 10 }}>↻ PROMPT</button>
              </div>
              <button className="btn btn-sm btn-primary">Send <Icon.Arrow size={12}/></button>
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 12, fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>
            <span>⌘ ↵ TO SEND</span>
            <span>· ESC TO CLOSE</span>
            <span>· BIBLE + SCENE IN CONTEXT</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Message({ message }) {
  const isAgent = message.from === 'agent';
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isAgent ? '40px 1fr' : '1fr 40px',
      gap: 14,
      alignItems: 'flex-start'
    }}>
      {isAgent && (
        <div style={{
          width: 36, height: 36,
          background: 'var(--ink-20)', border: '1px solid var(--tungsten)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon.Aperture size={14} style={{ color: 'var(--tungsten)' }}/>
        </div>
      )}
      <div style={{ order: isAgent ? 2 : 1 }}>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: isAgent ? 'var(--tungsten)' : 'var(--ink-60)', textTransform: 'uppercase', marginBottom: 6 }}>
          {isAgent ? message.agent : 'YOU'}
        </div>
        <div style={{
          background: isAgent ? 'var(--ink-05)' : 'var(--ink-10)',
          border: '1px solid ' + (isAgent ? 'var(--ink-30)' : 'var(--ink-30)'),
          padding: '12px 16px',
          color: 'var(--bone)', fontSize: 14, lineHeight: 1.6
        }}>
          {message.text}
        </div>
      </div>
      {!isAgent && (
        <div style={{
          order: 2,
          width: 36, height: 36,
          background: 'var(--ink-10)', border: '1px solid var(--ink-40)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--bone)'
        }}>MD</div>
      )}
    </div>
  );
}

Object.assign(window, { ScriptingDiscuss });
