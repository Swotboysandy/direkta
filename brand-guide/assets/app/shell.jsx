/* DIREKTA — Shell: TopNav + Sidebar */

function TopNav({ project, agents, onOpenKeyVault, kvOpen, onSwitchWorkspace }) {
  return (
    <header className="topnav">
      <div className="tn-brand" onClick={() => onSwitchWorkspace('dashboard')} style={{ cursor: 'pointer' }}>
        <Icon.Aperture size={22} />
        <span className="word">DIREKTA</span>
      </div>

      <div className="tn-mid">
        <div className="tn-proj" title="Switch project">
          <div>
            <div className="name">{project.title}</div>
            <div className="crumb">{project.format} · {project.lengthEstimate}</div>
          </div>
          <Icon.ChevronDown size={12} />
        </div>

        <div className="tn-agents" title="Crew status">
          {agents.map(a => (
            <div className="agent-dot" data-state={a.state} key={a.id}>
              <span className="d"></span>
              <div className="tip"><b>{a.name}</b><em>{agentStateLabel(a.state)}</em></div>
            </div>
          ))}
        </div>
      </div>

      <div className="tn-right">
        <div className="tn-save">
          <span className="pip"></span>
          <span>Saved · just now</span>
        </div>
        <button
          className="tn-icon-btn"
          data-active={kvOpen}
          onClick={onOpenKeyVault}
          title="Key Vault — API keys"
        >
          <Icon.Key size={16} />
        </button>
        <div className="tn-avatar" title="Account">MD</div>
      </div>
    </header>
  );
}

function agentStateLabel(state) {
  return { idle: "Idle", working: "Working", done: "Complete", attention: "Needs attention" }[state] || state;
}

function Sidebar({ projects, activeProjectId, workspaces, activeWorkspace, onSwitchWorkspace, onSwitchProject, onNewProject }) {
  return (
    <aside className="sidebar">
      <div className="sb-head">
        <span className="lbl">Projects</span>
        <button className="sb-new" onClick={onNewProject}><Icon.Plus size={10}/> NEW</button>
      </div>
      <div className="sb-projects">
        {projects.map(p => {
          const stages = p.stages || {};
          const pipKeys = ['screenplay','casting','storyboard','stitch','export'];
          return (
            <div
              key={p.id}
              className="sb-proj"
              data-active={p.id === activeProjectId}
              onClick={() => onSwitchProject(p.id)}
            >
              <div className="title">{p.title}</div>
              <div className="meta">
                <span>{p.format || '—'}</span>
                <span>·</span>
                <span>{p.lastEdited}</span>
              </div>
              <div className="progress">
                {pipKeys.map(k => {
                  const v = stages[k] ?? 0;
                  const flag = v >= 1 ? 'true' : v > 0 ? 'partial' : 'false';
                  return <div className="pip" key={k} data-on={flag}></div>;
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sb-ws">
        <div className="head">Workspaces</div>
        {workspaces.map(w => {
          const I = {
            dashboard: Icon.Dashboard,
            scripting: Icon.Screenplay,
            screenplay: Icon.Screenplay,
            casting: Icon.Casting,
            storyboard: Icon.Storyboard,
            stitch: Icon.Stitch,
            library: Icon.Save,
            export: Icon.Export
          }[w.id];
          return (
            <div
              key={w.id}
              className="sb-ws-item"
              data-active={w.id === activeWorkspace}
              data-locked={!w.unlocked}
              onClick={() => w.unlocked && onSwitchWorkspace(w.id)}
            >
              <span className="icn"><I size={18}/></span>
              <div className="lbl">
                {w.label}
                {w.note && <small>{w.note}</small>}
              </div>
              {w.id === 'dashboard' ? null :
                !w.unlocked ? <Icon.Lock size={12}/> :
                <span className="indicator" data-status={w.status}></span>
              }
              {!w.unlocked && w.lockReason && (
                <div className="lock-tip">
                  <span className="lt-head">SEQUENTIAL · LOCKED</span>
                  {w.lockReason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function KeyVaultPanel({ onClose }) {
  return (
    <div className="kv-overlay" onClick={onClose}>
      <div className="kv-panel" onClick={(e) => e.stopPropagation()}>
        <div className="kv-head">
          <div>
            <div className="eb muted" style={{ marginBottom: 6 }}>Bring Your Own Keys</div>
            <h2>Key Vault</h2>
          </div>
          <button className="btn btn-ghost" onClick={onClose}><Icon.X/></button>
        </div>
        <div className="kv-body">
          <div className="kv-key">
            <div className="label">
              <span className="name">Fal.ai · Image</span>
              <span className="pip-state" data-s="done">CONNECTED</span>
            </div>
            <div className="field">fal_••••••••••••••••••••••••8e2c</div>
            <div className="actions">
              <button className="btn btn-sm">Edit</button>
              <button className="btn btn-sm">Test connection</button>
            </div>
          </div>

          <div className="kv-key">
            <div className="label">
              <span className="name">Higgsfield · Video</span>
              <span className="pip-state" data-s="done">CONNECTED</span>
            </div>
            <div className="field">hgf_••••••••••••••••••••••••a410</div>
            <div className="actions">
              <button className="btn btn-sm">Edit</button>
              <button className="btn btn-sm">Test connection</button>
            </div>
          </div>

          <div className="kv-cost">
            <div className="eb">This Project · Estimated Spend</div>
            <div className="amount" style={{ marginTop: 8 }}>$4.20</div>
            <div className="lbl">at current generation rate</div>
            <div style={{ borderTop: '1px solid var(--ink-30)', marginTop: 16, paddingTop: 14, fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-70)', letterSpacing: '0.04em' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Beat 03 · 4 variants</span><span>$0.32</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Beat 02 · 4 variants</span><span>$0.32</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Soul ID · REYES training</span><span>$0.84</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Beat 01 · 4 variants</span><span>$0.32</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Soul ID · MARCUS training</span><span>$1.40</span></div>
            </div>
          </div>

          <button className="btn">
            <Icon.Plus size={12}/> Add another key
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div className={`toast ${t.kind || ''}`} key={t.id}>
          <div className="icon">
            {t.kind === 'success' ? <Icon.Check/> : t.kind === 'error' ? <Icon.Flag/> : <Icon.Dot/>}
          </div>
          <div className="body">
            <div className="agent">{t.agent}</div>
            <div className="msg">{t.msg}</div>
          </div>
          <button className="close" onClick={() => onDismiss(t.id)}><Icon.X size={12}/></button>
        </div>
      ))}
    </div>
  );
}

function ConfirmModal({ title, eyebrow, body, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <span className="corner-tick tl"/><span className="corner-tick tr"/>
        <span className="corner-tick bl"/><span className="corner-tick br"/>
        <div className="head">
          {eyebrow && <div className="eb">{eyebrow}</div>}
          <h3>{title}</h3>
        </div>
        <div className="body">{body}</div>
        <div className="footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={danger ? "btn btn-danger" : "btn btn-primary"} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TopNav, Sidebar, KeyVaultPanel, ToastStack, ConfirmModal });
