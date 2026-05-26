/* DIREKTA — App root */

function App() {
  const data = window.DK_DATA;
  const [activeWorkspace, setActiveWorkspace] = React.useState('dashboard');
  const [activeProjectId, setActiveProjectId] = React.useState('lisbon');
  const [kvOpen, setKvOpen] = React.useState(false);
  const [toasts, setToasts] = React.useState([
    { id: 1, agent: "Cinematographer", msg: "4 variants ready for Beat 03 — waiting for your pick.", kind: "" },
    { id: 2, agent: "Continuity Checker", msg: "Flagged Beat 05 — leather jacket inconsistent with Beat 03.", kind: "error" }
  ]);
  const [confirm, setConfirm] = React.useState(null);

  const dismissToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  // auto-dismiss toasts after 8 seconds
  React.useEffect(() => {
    if (toasts.length === 0) return;
    const ids = toasts.map(t => t.id);
    const timer = setTimeout(() => {
      setToasts(t => t.filter(x => !ids.includes(x.id)));
    }, 8000);
    return () => clearTimeout(timer);
  }, [toasts.length]);

  const activeProject = data.PROJECTS.find(p => p.id === activeProjectId) || data.PROJECTS[0];

  const onSwitchWorkspace = (ws) => setActiveWorkspace(ws);

  // Open project (sidebar)
  const onSwitchProject = (id) => {
    setActiveProjectId(id);
    setActiveWorkspace('dashboard');
  };

  // New project — show confirm-style modal as placeholder
  const onNewProject = () => {
    setConfirm({
      eyebrow: "PRODUCER",
      title: "Start a new project?",
      body: <>This opens the <strong>New Project</strong> setup — project details and API keys. Your current project, <strong>The Lisbon Pact</strong>, stays exactly where you left it.</>,
      confirmLabel: "Open setup",
      onConfirm: () => { setConfirm(null); setToasts([...toasts, { id: Date.now(), agent: "Producer", msg: "New project setup is queued. (Mock — flow not built in this prototype.)", kind: "" }]); }
    });
  };

  // Workspace switch with optional confirm for destructive — here only for Continue actions
  return (
    <>
      <TopNav
        project={activeProject}
        agents={data.AGENTS}
        kvOpen={kvOpen}
        onOpenKeyVault={() => setKvOpen(true)}
        onSwitchWorkspace={setActiveWorkspace}
      />
      <div className="app-body">
        <Sidebar
          projects={data.PROJECTS}
          activeProjectId={activeProjectId}
          workspaces={data.WORKSPACES}
          activeWorkspace={activeWorkspace}
          onSwitchWorkspace={onSwitchWorkspace}
          onSwitchProject={onSwitchProject}
          onNewProject={onNewProject}
        />
        <main className="main">
          {activeWorkspace === 'dashboard' && (
            <Dashboard
              project={activeProject}
              workspaces={data.WORKSPACES.filter(w => w.id !== 'dashboard')}
              activity={data.ACTIVITY}
              onSwitchWorkspace={onSwitchWorkspace}
            />
          )}
          {activeWorkspace === 'scripting' && (
            <Scripting
              project={activeProject}
              beats={data.BEATS}
              casting={data.CASTING}
              manuscript={data.MANUSCRIPT}
              acts={data.ACTS}
              snippets={data.SNIPPETS}
              threads={data.CHAT_THREADS}
              sceneWords={data.SCENE_WORDS}
              charDist={data.CHAR_DIST}
              onSwitchWorkspace={onSwitchWorkspace}
            />
          )}
          {activeWorkspace === 'casting' && (
            <Casting
              casting={data.CASTING}
              onSwitchWorkspace={onSwitchWorkspace}
            />
          )}
          {activeWorkspace === 'storyboard' && (
            <Storyboard
              beats={data.BEATS}
              storyboard={data.STORYBOARD}
              onSwitchWorkspace={onSwitchWorkspace}
            />
          )}
          {activeWorkspace === 'stitch' && (
            <Stitch
              beats={data.BEATS}
              nodes={data.STITCH_NODES}
              edges={data.STITCH_EDGES}
              onSwitchWorkspace={onSwitchWorkspace}
            />
          )}
          {activeWorkspace === 'export' && (
            <ExportWorkspace
              project={activeProject}
              onSwitchWorkspace={onSwitchWorkspace}
            />
          )}
          {activeWorkspace === 'library' && (
            <Library
              library={data.LIBRARY}
              onSwitchWorkspace={onSwitchWorkspace}
            />
          )}
        </main>
      </div>

      {kvOpen && <KeyVaultPanel onClose={() => setKvOpen(false)}/>}

      <ToastStack toasts={toasts} onDismiss={dismissToast}/>

      {confirm && (
        <ConfirmModal
          eyebrow={confirm.eyebrow}
          title={confirm.title}
          body={confirm.body}
          confirmLabel={confirm.confirmLabel || "Confirm"}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

const _root = ReactDOM.createRoot(document.getElementById('root'));
_root.render(<App/>);
