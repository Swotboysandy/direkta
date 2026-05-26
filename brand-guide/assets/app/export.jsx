/* DIREKTA — Export workspace */

function ExportWorkspace({ project, onSwitchWorkspace }) {
  const [progress, setProgress] = React.useState({}); // { animatic: 0.42 } etc.
  const [downloads, setDownloads] = React.useState({}); // completed exports

  const startExport = (key) => {
    if (progress[key] != null) return;
    setProgress({ ...progress, [key]: 0.05 });
    const id = setInterval(() => {
      setProgress(prev => {
        const cur = prev[key] || 0;
        if (cur >= 1) {
          clearInterval(id);
          setDownloads(d => ({ ...d, [key]: true }));
          return prev;
        }
        return { ...prev, [key]: Math.min(1, cur + 0.07 + Math.random() * 0.05) };
      });
    }, 300);
  };

  return (
    <div className="main-inner export">
      <header className="page-head">
        <div>
          <div className="crumb">06 / WORKSPACE · EXPORT</div>
          <h1>Export</h1>
          <div className="sub">Pitch deck, production brief, client deliverable. <strong style={{color:'var(--bone)'}}>Pick the cut you need.</strong></div>
        </div>
        <div className="actions">
          <button className="btn">Export all</button>
        </div>
      </header>

      <div className="page-body">
        {/* status banner */}
        <div style={{
          padding: 22, border: '1px solid var(--ink-30)', background: 'var(--ink-05)',
          display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24
        }}>
          <div style={{ flex: 1 }}>
            <div className="eb">EXPORT AGENT · READY</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--bone)', marginTop: 4, lineHeight: 1.0 }}>
              The Lisbon Pact — packaged for delivery.
            </div>
          </div>
          <Stat label="ANIMATIC" value="3 : 42"/>
          <Stat label="FRAMES" value="15 / 47"/>
          <Stat label="BIBLE" value="3,200 W"/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>

          {/* ANIMATIC */}
          <ExportCard
            icon={<Icon.Play size={20}/>}
            num="01"
            title="Animatic Video"
            sub="Selected frames + generated transitions stitched by FFmpeg."
            progress={progress.animatic}
            done={downloads.animatic}
            onStart={() => startExport('animatic')}
          >
            <OptionRow label="Format">
              <Pill active>MP4</Pill>
              <Pill>MOV</Pill>
            </OptionRow>
            <OptionRow label="Resolution">
              <Pill>1080p</Pill>
              <Pill active>4K</Pill>
            </OptionRow>
            <OptionRow label="Overlay">
              <Pill active>Beat titles</Pill>
              <Pill>Timecode</Pill>
              <Pill>None</Pill>
            </OptionRow>
          </ExportCard>

          {/* STORYBOARD PDF */}
          <ExportCard
            icon={<Icon.Storyboard size={20}/>}
            num="02"
            title="Storyboard PDF"
            sub="Printable storyboard sheet. For directors, DPs, ADs."
            progress={progress.pdf}
            done={downloads.pdf}
            onStart={() => startExport('pdf')}
          >
            <OptionRow label="Layout">
              <Pill>1-up</Pill>
              <Pill active>2-up</Pill>
              <Pill>4-up</Pill>
            </OptionRow>
            <OptionRow label="Include">
              <Pill active>Beat description</Pill>
              <Pill active>Character tags</Pill>
              <Pill active>Scene heading</Pill>
            </OptionRow>
          </ExportCard>

          {/* SHOT LIST */}
          <ExportCard
            icon={<Icon.Camera size={20}/>}
            num="03"
            title="Shot List"
            sub="Auto-generated from every beat. For the AD on set."
            progress={progress.shots}
            done={downloads.shots}
            onStart={() => startExport('shots')}
          >
            <OptionRow label="Format">
              <Pill active>PDF</Pill>
              <Pill>CSV</Pill>
              <Pill>Spreadsheet</Pill>
            </OptionRow>
            <OptionRow label="Columns">
              <Pill active>Beat</Pill>
              <Pill active>Slug</Pill>
              <Pill active>Cast</Pill>
              <Pill active>Props</Pill>
            </OptionRow>
          </ExportCard>

          {/* PRODUCTION BIBLE */}
          <ExportCard
            icon={<Icon.Save size={20}/>}
            num="04"
            title="Production Bible"
            sub="Character profiles, locations, world rules, tone document."
            progress={progress.bible}
            done={downloads.bible}
            onStart={() => startExport('bible')}
          >
            <OptionRow label="Format">
              <Pill active>PDF</Pill>
              <Pill>DOCX</Pill>
              <Pill>Markdown</Pill>
            </OptionRow>
            <OptionRow label="Sections">
              <Pill active>Characters</Pill>
              <Pill active>Locations</Pill>
              <Pill active>Tone</Pill>
              <Pill active>World rules</Pill>
            </OptionRow>
          </ExportCard>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ borderLeft: '1px solid var(--ink-30)', paddingLeft: 20 }}>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 32, letterSpacing: '0.02em', color: 'var(--bone)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function ExportCard({ icon, num, title, sub, progress, done, onStart, children }) {
  const inProgress = progress != null && progress < 1;
  const completed = done === true;
  return (
    <div style={{
      background: 'var(--ink-05)', border: '1px solid ' + (inProgress ? 'var(--tungsten)' : completed ? 'var(--green)' : 'var(--ink-30)'),
      padding: 26,
      display: 'flex', flexDirection: 'column', gap: 16,
      transition: 'border-color 200ms'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--tungsten)', textTransform: 'uppercase' }}>EXPORT · {num}</div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 32, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--bone)', marginTop: 6, lineHeight: 1.0 }}>{title}</div>
          <p style={{ color: 'var(--ink-70)', fontSize: 13, marginTop: 8, lineHeight: 1.5, maxWidth: '38ch' }}>{sub}</p>
        </div>
        <span style={{ color: 'var(--tungsten)' }}>{icon}</span>
      </div>

      <div style={{ borderTop: '1px solid var(--ink-25)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>

      <div style={{ marginTop: 'auto' }}>
        {inProgress && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--tungsten)', textTransform: 'uppercase' }}>EXPORTING · {Math.round(progress*100)}%</span>
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>~ {Math.max(2, Math.round((1 - progress) * 12))} S REMAINING</span>
            </div>
            <div style={{ height: 3, background: 'var(--ink-25)' }}>
              <div style={{ height: '100%', background: 'var(--tungsten)', width: `${progress*100}%`, transition: 'width 200ms' }}/>
            </div>
          </div>
        )}
        {completed ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon.Save size={14}/> Download · 24 MB
            </button>
            <button className="btn">Share link</button>
            <button className="btn btn-ghost" title="Open in new tab"><Icon.Zoom size={14}/></button>
          </div>
        ) : !inProgress ? (
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onStart}>
            Export {title} <Icon.Arrow size={14}/>
          </button>
        ) : (
          <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={onStart}>
            Cancel export
          </button>
        )}
      </div>
    </div>
  );
}

function OptionRow({ label, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 14, alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
    </div>
  );
}

function Pill({ active, children }) {
  return (
    <span style={{
      fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.16em',
      textTransform: 'uppercase',
      padding: '5px 10px',
      border: '1px solid ' + (active ? 'var(--tungsten)' : 'var(--ink-30)'),
      background: active ? 'var(--tungsten)' : 'transparent',
      color: active ? 'var(--ink-00)' : 'var(--ink-70)',
      cursor: 'pointer'
    }}>{children}</span>
  );
}

Object.assign(window, { ExportWorkspace });
