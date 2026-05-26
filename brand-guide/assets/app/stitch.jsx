/* DIREKTA — Stitch workspace (node canvas) */

function Stitch({ beats, nodes, edges, onSwitchWorkspace }) {
  const beatMap = Object.fromEntries(beats.map(b => [b.n, b]));
  const [selectedNode, setSelectedNode] = React.useState('n4');
  const [edgesState, setEdgesState] = React.useState(edges);

  // canvas size
  const canvasW = 1720, canvasH = 460;

  const onGenerateEdge = (i) => {
    const next = edgesState.map((e, idx) => idx === i ? { ...e, state: 'generating', est: 18 } : e);
    setEdgesState(next);
  };

  return (
    <div className="main-inner stitch">
      <header className="page-head">
        <div>
          <div className="crumb">05 / WORKSPACE · STITCH</div>
          <h1>Stitch</h1>
          <div className="sub">Frames as nodes. Clips as the lines between. <strong style={{color:'var(--bone)'}}>Generate transitions. Preview the animatic.</strong></div>
        </div>
        <div className="actions">
          <span className="pip-state" data-s="working">VIDEO DIRECTOR · GENERATING</span>
          <button className="btn"><Icon.Play size={12}/> Preview animatic</button>
          <button className="btn btn-primary" onClick={() => onSwitchWorkspace('export')}>
            Continue to Export <Icon.Arrow size={14}/>
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: 'calc(100vh - 56px - 116px - 88px)', borderTop: '1px solid var(--ink-30)' }}>
        {/* CANVAS */}
        <div style={{
          background: 'var(--ink-00)',
          overflow: 'auto',
          position: 'relative',
          backgroundImage: 'radial-gradient(circle, var(--ink-25) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}>
          <div style={{ width: canvasW, height: canvasH, position: 'relative' }}>
            <svg width={canvasW} height={canvasH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <defs>
                <marker id="arrow-done" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--tungsten)"/>
                </marker>
                <marker id="arrow-pending" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--ink-50)"/>
                </marker>
                <marker id="arrow-gen" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--tungsten-hot)"/>
                </marker>
              </defs>
              {edgesState.map((e, i) => {
                const a = nodes.find(n => n.id === e.from);
                const b = nodes.find(n => n.id === e.to);
                const x1 = a.x + 180, y1 = a.y + 110;
                const x2 = b.x, y2 = b.y + 110;
                const colorByState = {
                  complete: 'var(--tungsten)',
                  generating: 'var(--tungsten-hot)',
                  pending: 'var(--ink-50)'
                };
                const dash = e.state === 'pending' ? '6 6' : e.state === 'generating' ? '10 6' : null;
                const marker = e.state === 'complete' ? 'arrow-done' : e.state === 'generating' ? 'arrow-gen' : 'arrow-pending';
                return (
                  <g key={i}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={colorByState[e.state]} strokeWidth="2"
                      strokeDasharray={dash}
                      markerEnd={`url(#${marker})`}
                      style={e.state === 'generating' ? { animation: 'dashflow 1s linear infinite' } : null}
                    />
                  </g>
                );
              })}
            </svg>

            {/* edge midpoint controls */}
            {edgesState.map((e, i) => {
              const a = nodes.find(n => n.id === e.from);
              const b = nodes.find(n => n.id === e.to);
              const mx = (a.x + 180 + b.x) / 2;
              const my = (a.y + 110 + b.y + 110) / 2;
              return <EdgeControl key={i} x={mx} y={my} edge={e} onGenerate={() => onGenerateEdge(i)} />;
            })}

            {/* nodes */}
            {nodes.map(n => {
              const beat = beatMap[n.beat];
              return (
                <StitchNode
                  key={n.id}
                  node={n} beat={beat}
                  selected={selectedNode === n.id}
                  onClick={() => setSelectedNode(n.id)}
                />
              );
            })}
          </div>

          {/* zoom controls */}
          <div style={{
            position: 'absolute', bottom: 16, right: 16,
            background: 'var(--ink-10)', border: '1px solid var(--ink-30)',
            display: 'flex', flexDirection: 'column'
          }}>
            <button className="tn-icon-btn" style={{ borderColor: 'transparent', borderBottom: '1px solid var(--ink-30)' }}>+</button>
            <button className="tn-icon-btn" style={{ borderColor: 'transparent', borderBottom: '1px solid var(--ink-30)' }}>−</button>
            <button className="tn-icon-btn" style={{ borderColor: 'transparent', fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em' }}>FIT</button>
          </div>
          <div style={{ position: 'absolute', top: 16, left: 16, fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase', background: 'var(--ink-00)', padding: '6px 10px', border: '1px solid var(--ink-30)' }}>
            CANVAS · {nodes.length} NODES · {edges.length} EDGES
          </div>
        </div>

        {/* RIGHT PANEL */}
        <NodeDetailPanel
          node={nodes.find(n => n.id === selectedNode)}
          beat={beatMap[nodes.find(n => n.id === selectedNode).beat]}
        />
      </div>

      {/* TIMELINE SCRUBBER */}
      <TimelineScrubber nodes={nodes} edges={edgesState} beats={beats}/>
    </div>
  );
}

// dashflow animation
const _stitchAnim = document.createElement('style');
_stitchAnim.textContent = `
  @keyframes dashflow {
    to { stroke-dashoffset: -16; }
  }
`;
if (!document.getElementById('stitch-anim')) {
  _stitchAnim.id = 'stitch-anim';
  document.head.appendChild(_stitchAnim);
}

function StitchNode({ node, beat, selected, onClick }) {
  const moodByLoc = { warehouse: 'mood-cold', apartment: 'mood-amber', precinct: 'mood-neutral', riverside: 'mood-dawn', cafe: 'mood-sun', rooftop: 'mood-noir' };
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: node.x, top: node.y,
        width: 180, height: 220,
        background: 'var(--ink-10)',
        border: '1px solid ' + (selected ? 'var(--tungsten)' : 'var(--ink-30)'),
        boxShadow: selected ? '0 0 0 1px var(--tungsten)' : 'none',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        transition: 'border-color 80ms, box-shadow 80ms',
        zIndex: selected ? 3 : 2
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/9' }}>
        <div className={`film-frame ${moodByLoc[beat.loc] || 'mood-neutral'}`} style={{ height: '100%' }}>
          <div className="letterbox-t"/><div className="letterbox-b"/>
          <div className="corner-tick tl"/><div className="corner-tick br"/>
          <div style={{
            position: 'absolute', left: '40%', bottom: '15%', width: '30%', height: '50%',
            background: 'rgba(0,0,0,0.55)', filter: 'blur(2px)',
            clipPath: 'polygon(40% 0, 60% 0, 70% 25%, 80% 100%, 20% 100%, 30% 25%)'
          }}/>
          <div className="stamp">{beat.slug.split(' — ')[1] || beat.slug}</div>
        </div>
      </div>
      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.22em', color: 'var(--tungsten)', textTransform: 'uppercase' }}>BEAT {String(beat.n).padStart(2,'0')}</span>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ink-70)' }}>{node.duration}s</span>
        </div>
        <div style={{ color: 'var(--bone)', fontSize: 12, fontWeight: 500, lineHeight: 1.3 }}>{beat.title}</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 'auto' }}>
          {beat.chars.slice(0, 2).map(c => (
            <span key={c} style={{ fontFamily: 'var(--f-mono)', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bone)', padding: '2px 5px', background: 'var(--ink-25)' }}>{c}</span>
          ))}
        </div>
      </div>
      {/* ports */}
      <div style={{ position: 'absolute', left: -5, top: 110, width: 10, height: 10, borderRadius: '50%', background: 'var(--ink-25)', border: '1px solid var(--ink-40)' }}/>
      <div style={{ position: 'absolute', right: -5, top: 110, width: 10, height: 10, borderRadius: '50%', background: selected ? 'var(--tungsten)' : 'var(--ink-25)', border: '1px solid var(--ink-40)' }}/>
    </div>
  );
}

function EdgeControl({ x, y, edge, onGenerate }) {
  if (edge.state === 'pending') {
    return (
      <button
        onClick={onGenerate}
        style={{
          position: 'absolute', left: x - 70, top: y - 14,
          padding: '5px 12px',
          background: 'var(--ink-10)', border: '1px solid var(--ink-40)',
          color: 'var(--bone)', cursor: 'pointer',
          fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.16em',
          textTransform: 'uppercase', zIndex: 5
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--tungsten)'; e.currentTarget.style.color = 'var(--ink-00)'; e.currentTarget.style.borderColor = 'var(--tungsten)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ink-10)'; e.currentTarget.style.color = 'var(--bone)'; e.currentTarget.style.borderColor = 'var(--ink-40)'; }}
      >GENERATE VIDEO</button>
    );
  }
  if (edge.state === 'generating') {
    return (
      <div style={{
        position: 'absolute', left: x - 90, top: y - 30,
        background: 'var(--ink-10)', border: '1px solid var(--tungsten)',
        padding: '8px 12px', minWidth: 180, zIndex: 5
      }}>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.22em', color: 'var(--tungsten)', textTransform: 'uppercase' }}>VIDEO DIRECTOR</div>
        <div style={{ color: 'var(--bone)', fontSize: 11, marginTop: 2 }}>Generating · {edge.style}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--ink-60)' }}>
          <span>EST {edge.est}s</span>
          <button style={{ background: 'transparent', border: 0, color: 'var(--ink-70)', cursor: 'pointer', fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase' }}>CANCEL</button>
        </div>
      </div>
    );
  }
  // complete
  return (
    <button
      style={{
        position: 'absolute', left: x - 18, top: y - 18,
        width: 36, height: 36, borderRadius: '50%',
        background: 'var(--tungsten)', color: 'var(--ink-00)',
        border: 0, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 5
      }}
      title={`Play transition · ${edge.style || 'hard cut'}`}
    >
      <Icon.Play size={14}/>
    </button>
  );
}

function NodeDetailPanel({ node, beat }) {
  const [duration, setDuration] = React.useState(node.duration);
  React.useEffect(() => { setDuration(node.duration); }, [node.id]);
  const moodByLoc = { warehouse: 'mood-cold', apartment: 'mood-amber', precinct: 'mood-neutral', riverside: 'mood-dawn', cafe: 'mood-sun', rooftop: 'mood-noir' };
  return (
    <div style={{ borderLeft: '1px solid var(--ink-30)', background: 'var(--ink-05)', padding: 22, overflowY: 'auto' }}>
      <div className="eb">NODE DETAIL</div>
      <div style={{ marginTop: 14, aspectRatio: '16/9', border: '1px solid var(--ink-30)', position: 'relative' }}>
        <div className={`film-frame ${moodByLoc[beat.loc] || 'mood-neutral'}`} style={{ height: '100%' }}>
          <div className="letterbox-t"/><div className="letterbox-b"/>
          <div className="corner-tick tl"/><div className="corner-tick br"/>
          <div style={{ position: 'absolute', left: '40%', bottom: '15%', width: '30%', height: '50%', background: 'rgba(0,0,0,0.55)', filter: 'blur(2px)', clipPath: 'polygon(40% 0, 60% 0, 70% 25%, 80% 100%, 20% 100%, 30% 25%)' }}/>
          <div className="stamp">{beat.slug}</div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>BEAT {String(beat.n).padStart(2,'0')}</div>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--bone)', marginTop: 6, lineHeight: 1.0 }}>{beat.title}</div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.06em', color: 'var(--ink-60)', textTransform: 'uppercase', marginTop: 6 }}>{beat.slug}</div>
      </div>

      {/* Duration slider */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--ink-25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="eb muted">HOLD DURATION</span>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--tungsten)' }}>{duration.toFixed(1)}s</span>
        </div>
        <input
          type="range" min="0.5" max="30" step="0.1"
          value={duration}
          onChange={(e) => setDuration(parseFloat(e.target.value))}
          style={{ width: '100%', marginTop: 10, accentColor: 'var(--tungsten)' }}
        />
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--ink-25)' }}>
        <div className="eb muted">CAST PRESENT</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {beat.chars.map(c => (
            <span key={c} style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bone)', padding: '4px 8px', background: 'var(--ink-25)' }}>{c}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
        <button className="btn btn-sm">Replace frame</button>
        <button className="btn btn-sm">Generate video for this clip</button>
        <button className="btn btn-sm btn-danger">Remove from canvas</button>
      </div>
    </div>
  );
}

function TimelineScrubber({ nodes, edges, beats }) {
  const totalDuration = nodes.reduce((sum, n) => sum + n.duration, 0)
    + edges.filter(e => e.state === 'complete').reduce((sum, e) => sum + (e.duration || 0), 0);
  const completeEdges = edges.filter(e => e.state === 'complete').length;
  const beatMap = Object.fromEntries(beats.map(b => [b.n, b]));
  const moodByLoc = { warehouse: 'mood-cold', apartment: 'mood-amber', precinct: 'mood-neutral', riverside: 'mood-dawn', cafe: 'mood-sun', rooftop: 'mood-noir' };

  return (
    <div style={{
      borderTop: '1px solid var(--ink-40)',
      background: 'var(--ink-00)',
      padding: '16px 32px',
      height: 88
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'baseline' }}>
          <button className="btn btn-sm btn-primary"><Icon.Play size={12}/> PLAY</button>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--bone)', letterSpacing: '0.06em' }}>00:00:00 / 00:00:{String(Math.floor(totalDuration)).padStart(2,'0')}</span>
          <span className="eb muted">ANIMATIC · {completeEdges} / {edges.length} CLIPS RENDERED</span>
        </div>
        <div style={{ display: 'flex', gap: 14, fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>
          <span>0.5×</span><span style={{ color: 'var(--tungsten)' }}>1×</span><span>1.5×</span><span>2×</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2, height: 28 }}>
        {nodes.map(n => {
          const w = (n.duration / 30) * 100; // relative width based on duration capped at 30
          return (
            <div key={n.id} className={`${moodByLoc[beatMap[n.beat].loc] || 'mood-neutral'}`} style={{
              flex: `0 0 ${w * 2}px`, minWidth: 40, position: 'relative',
              border: '1px solid var(--ink-30)', cursor: 'pointer'
            }} title={`Beat ${beatMap[n.beat].n} · ${n.duration}s`}>
              <div className="letterbox-t" style={{ height: '12%' }}/>
              <div className="letterbox-b" style={{ height: '12%' }}/>
              <div style={{ position: 'absolute', top: 4, left: 4, fontFamily: 'var(--f-mono)', fontSize: 8, letterSpacing: '0.18em', color: 'rgba(237,231,217,0.6)' }}>B{String(beatMap[n.beat].n).padStart(2,'0')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { Stitch });
