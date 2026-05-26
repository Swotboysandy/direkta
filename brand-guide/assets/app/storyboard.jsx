/* DIREKTA — Storyboard workspace */

function Storyboard({ beats, storyboard, onSwitchWorkspace }) {
  // selection state per beat (initial from data)
  const initSel = {};
  storyboard.forEach(r => { if (r.state === 'complete') initSel[r.beat] = r.selected; });
  const [selections, setSelections] = React.useState(initSel);
  const [lightbox, setLightbox] = React.useState(null);

  const beatMap = Object.fromEntries(beats.map(b => [b.n, b]));
  const completedCount = Object.values(selections).filter(v => v != null).length;

  return (
    <div className="main-inner storyboard">
      <header className="page-head">
        <div>
          <div className="crumb">04 / WORKSPACE · STORYBOARD</div>
          <h1>Storyboard</h1>
          <div className="sub">The Cinematographer rolls 4 variants per beat. <strong style={{color:'var(--bone)'}}>You pick the winner.</strong> Rejected variants disappear.</div>
        </div>
        <div className="actions">
          <span className="pip-state" data-s="working">CINEMATOGRAPHER · ROLLING</span>
          <button className="btn">Style direction</button>
          <button className="btn btn-primary" onClick={() => onSwitchWorkspace('stitch')}>
            Continue to Stitch <Icon.Arrow size={14}/>
          </button>
        </div>
      </header>

      <div className="page-body" style={{ paddingBottom: 200 }}>
        {/* Style settings strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: 0,
          border: '1px solid var(--ink-30)', background: 'var(--ink-05)', marginBottom: 24
        }}>
          <StyleCell label="Visual" value="Noir"/>
          <StyleCell label="Aspect" value="2.39:1 Anamorphic"/>
          <StyleCell label="Light" value="Low key"/>
          <StyleCell label="Temp" value="Cool"/>
          <StyleCell label="Camera" value="Mixed"/>
          <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center' }}>
            <button className="btn btn-sm btn-ghost">EDIT</button>
          </div>
        </div>

        {/* Beat rows */}
        <div className="eb" style={{ marginBottom: 14 }}>BEATS · {completedCount} OF {storyboard.length} SELECTED</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {storyboard.map(row => (
            <BeatRow
              key={row.beat}
              row={row}
              beat={beatMap[row.beat]}
              selected={selections[row.beat]}
              onSelect={(idx) => setSelections({ ...selections, [row.beat]: idx })}
              onLightbox={(idx) => setLightbox({ beat: row.beat, variant: idx })}
            />
          ))}
        </div>
      </div>

      {/* Bottom: selected frames strip */}
      <BottomStrip
        beats={beats}
        storyboard={storyboard}
        selections={selections}
      />

      {lightbox && <FrameLightbox info={lightbox} beat={beatMap[lightbox.beat]} onClose={() => setLightbox(null)}/>}
    </div>
  );
}

function StyleCell({ label, value }) {
  return (
    <div style={{ padding: '14px 18px', borderRight: '1px solid var(--ink-30)' }}>
      <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: 'var(--bone)', fontFamily: 'var(--f-mono)', fontSize: 12, letterSpacing: '0.06em', marginTop: 4 }}>{value}</div>
    </div>
  );
}

function BeatRow({ row, beat, selected, onSelect, onLightbox }) {
  const variantCount = 4;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '240px 1fr',
      border: '1px solid var(--ink-30)',
      background: 'var(--ink-05)',
      gap: 0
    }}>
      <BeatRowLabel beat={beat} row={row} selectedIdx={selected}/>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${variantCount}, 1fr)`, gap: 1, background: 'var(--ink-30)' }}>
        {Array.from({ length: variantCount }).map((_, i) => (
          <FrameSlot
            key={i}
            row={row}
            beat={beat}
            variant={i}
            isSelected={selected === i}
            anySelected={selected != null}
            onSelect={() => onSelect(i)}
            onLightbox={() => onLightbox(i)}
          />
        ))}
      </div>
    </div>
  );
}

function BeatRowLabel({ beat, row, selectedIdx }) {
  if (!beat) return <div style={{ padding: 16 }}/>;
  return (
    <div style={{ padding: 16, background: 'var(--ink-00)', borderRight: '1px solid var(--ink-30)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--tungsten)', textTransform: 'uppercase' }}>BEAT {String(beat.n).padStart(2, '0')}</span>
        {row.state === 'complete' && selectedIdx != null && <span className="pip-state" data-s="done">SELECTED</span>}
        {row.state === 'generating' && <span className="pip-state" data-s="working">ROLLING</span>}
        {row.state === 'waiting' && <span className="pip-state">WAITING</span>}
        {row.state === 'error' && <span className="pip-state" data-s="attention">ERROR</span>}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.05em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>{beat.slug}</div>
        <div style={{ color: 'var(--bone)', fontSize: 14, fontWeight: 500, marginTop: 4, lineHeight: 1.3 }}>{beat.title}</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 'auto' }}>
        {beat.chars.map(c => (
          <span key={c} style={{
            fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: 'var(--bone)',
            padding: '3px 6px', background: 'var(--ink-25)'
          }}>{c}</span>
        ))}
      </div>
      {row.flag === 'continuity' && (
        <div style={{ padding: '8px 10px', background: 'rgba(217,67,67,0.08)', borderLeft: '2px solid var(--cut)', marginTop: 4 }}>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.22em', color: 'var(--cut)', textTransform: 'uppercase' }}>CONTINUITY FLAG</div>
          <div style={{ color: 'var(--ink-70)', fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>Jacket inconsistent with Beat 03.</div>
        </div>
      )}
    </div>
  );
}

function FrameSlot({ row, beat, variant, isSelected, anySelected, onSelect, onLightbox }) {
  const [hover, setHover] = React.useState(false);
  if (!beat) return null;

  // mood by beat location
  const moodByLoc = { warehouse: 'mood-cold', apartment: 'mood-amber', precinct: 'mood-neutral', riverside: 'mood-dawn', cafe: 'mood-sun', rooftop: 'mood-noir' };
  const mood = moodByLoc[beat.loc] || 'mood-neutral';

  // waiting state
  if (row.state === 'waiting') {
    return (
      <div style={{
        aspectRatio: '2.39 / 1',
        background: 'var(--ink-00)',
        border: '1px dashed var(--ink-30)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.22em', color: 'var(--ink-50)', textTransform: 'uppercase' }}>WAITING</span>
      </div>
    );
  }

  // generating state — shimmer
  if (row.state === 'generating') {
    return (
      <div className="shimmer" style={{
        aspectRatio: '2.39 / 1',
        position: 'relative', overflow: 'hidden',
        border: '1px solid var(--ink-30)'
      }}>
        <div style={{
          position: 'absolute', bottom: 8, left: 12,
          fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.22em',
          color: 'var(--tungsten)', textTransform: 'uppercase'
        }}>COMPOSING · V0{variant + 1}</div>
      </div>
    );
  }

  // error state — one slot to demo
  if (row.state === 'error') {
    if (variant === 0) {
      return (
        <div style={{
          aspectRatio: '2.39 / 1',
          background: 'rgba(217,67,67,0.08)',
          border: '1px solid var(--cut)',
          padding: 14,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <div className="eb err">RENDER HALTED</div>
            <div style={{ color: 'var(--bone)', fontSize: 13, fontWeight: 500, marginTop: 6, lineHeight: 1.3 }}>Cut.<br/>Soul ID didn't load.</div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--ink-60)', marginTop: 6 }}>E—4180 · fal.ai · timeout 12.04 s</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm" style={{ padding: '4px 8px', fontSize: 11 }}>Re-roll</button>
            <button className="btn btn-sm btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }}>Skip</button>
          </div>
        </div>
      );
    }
    // other variants stay shimmering
    return (
      <div className="shimmer" style={{ aspectRatio: '2.39 / 1', border: '1px solid var(--ink-30)' }}/>
    );
  }

  // complete
  const isWinner = isSelected;
  const dimmed = anySelected && !isSelected;
  return (
    <div
      style={{
        aspectRatio: '2.39 / 1',
        position: 'relative',
        cursor: 'pointer',
        outline: isWinner ? '2px solid var(--tungsten)' : 'none',
        outlineOffset: isWinner ? '-2px' : 0,
        opacity: dimmed ? 0.4 : 1,
        transition: 'opacity 120ms, outline 120ms',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onSelect}
    >
      <FrameContent beat={beat} mood={mood} variant={variant}/>

      {isWinner && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 22, height: 22, background: 'var(--tungsten)', color: 'var(--ink-00)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon.Check size={12}/>
        </div>
      )}

      {hover && !isWinner && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(8,8,10,0.85), transparent 50%)',
          display: 'flex', alignItems: 'flex-end', padding: 10, gap: 6
        }}
        onClick={(e) => e.stopPropagation()}>
          <button title="Pick this variant" className="frame-tool" onClick={onSelect}><Icon.Check size={12}/></button>
          <button title="Zoom" className="frame-tool" onClick={onLightbox}><Icon.Zoom size={12}/></button>
          <button title="Regenerate" className="frame-tool"><Icon.Refresh size={12}/></button>
          <button title="Reject" className="frame-tool"><Icon.X size={12}/></button>
        </div>
      )}
    </div>
  );
}

/* Inline style for frame-tool buttons */
const _frameToolStyle = document.createElement('style');
_frameToolStyle.textContent = `
  .frame-tool {
    width: 26px; height: 26px;
    background: rgba(8,8,10,0.7); border: 1px solid rgba(237,231,217,0.3);
    color: var(--bone); cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    transition: background 80ms;
  }
  .frame-tool:hover { background: var(--tungsten); color: var(--ink-00); border-color: var(--tungsten); }
`;
if (!document.getElementById('frame-tool-style')) {
  _frameToolStyle.id = 'frame-tool-style';
  document.head.appendChild(_frameToolStyle);
}

function FrameContent({ beat, mood, variant }) {
  // Render a stylized cinematic frame based on beat
  // Use mood and a slight variation per variant for visual difference
  const variations = [
    { subjectX: 30, subjectW: 28, subjectScale: 0.6 },
    { subjectX: 50, subjectW: 36, subjectScale: 0.85 },
    { subjectX: 65, subjectW: 26, subjectScale: 0.55 },
    { subjectX: 40, subjectW: 50, subjectScale: 1.0 }
  ];
  const v = variations[variant];
  return (
    <div className={`film-frame ${mood}`} style={{ height: '100%' }}>
      <div className="letterbox-t"/><div className="letterbox-b"/>
      <div className="corner-tick tl"/><div className="corner-tick br"/>
      {/* subject silhouette */}
      <div style={{
        position: 'absolute',
        left: `${v.subjectX}%`, bottom: '10%',
        width: `${v.subjectW}%`, height: `${v.subjectScale * 70}%`,
        background: 'rgba(0,0,0,0.6)',
        filter: 'blur(2px)',
        clipPath: 'polygon(40% 0, 60% 0, 70% 25%, 80% 100%, 20% 100%, 30% 25%)'
      }}/>
      {/* highlight rim */}
      <div style={{
        position: 'absolute',
        left: `${v.subjectX + v.subjectW * 0.45}%`, bottom: '20%',
        width: '2px', height: `${v.subjectScale * 35}%`,
        background: 'rgba(242, 181, 60, 0.4)',
        filter: 'blur(0.5px)'
      }}/>
      <div className="stamp">{beat.slug} · V0{variant + 1}</div>
      <div className="vnum">B{String(beat.n).padStart(2,'0')} · V0{variant + 1}</div>
    </div>
  );
}

function BottomStrip({ beats, storyboard, selections }) {
  const beatMap = Object.fromEntries(beats.map(b => [b.n, b]));
  return (
    <div style={{
      position: 'sticky', bottom: 0,
      background: 'var(--ink-00)',
      borderTop: '1px solid var(--ink-40)',
      padding: '16px 40px 20px',
      display: 'flex', flexDirection: 'column', gap: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="eb">STORYBOARD SEQUENCE · {Object.values(selections).filter(v => v != null).length} / 47</span>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>SCROLL · DRAG TO REORDER</span>
      </div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
        {storyboard.map(row => {
          const beat = beatMap[row.beat];
          const idx = selections[row.beat];
          if (idx == null) {
            return (
              <div key={row.beat} style={{
                flex: '0 0 120px', aspectRatio: '2.39/1',
                background: 'var(--ink-05)', border: '1px dashed var(--ink-30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.22em', color: 'var(--ink-50)' }}>B{String(row.beat).padStart(2,'0')}</span>
              </div>
            );
          }
          const moodByLoc = { warehouse: 'mood-cold', apartment: 'mood-amber', precinct: 'mood-neutral', riverside: 'mood-dawn', cafe: 'mood-sun', rooftop: 'mood-noir' };
          return (
            <div key={row.beat} style={{ flex: '0 0 120px', aspectRatio: '2.39/1', position: 'relative', overflow: 'hidden', outline: '1px solid var(--ink-30)' }}>
              <FrameContent beat={beat} mood={moodByLoc[beat.loc] || 'mood-neutral'} variant={idx}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FrameLightbox({ info, beat, onClose }) {
  const moodByLoc = { warehouse: 'mood-cold', apartment: 'mood-amber', precinct: 'mood-neutral', riverside: 'mood-dawn', cafe: 'mood-sun', rooftop: 'mood-noir' };
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(8,8,10,0.92)',
      zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 40, flexDirection: 'column', gap: 16
    }} onClick={onClose}>
      <div style={{ width: '80%', maxWidth: 1200, aspectRatio: '2.39/1', border: '1px solid var(--ink-40)' }}>
        <FrameContent beat={beat} mood={moodByLoc[beat.loc] || 'mood-neutral'} variant={info.variant}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%', maxWidth: 1200, color: 'var(--bone)', alignItems: 'center' }}>
        <div>
          <div className="eb">BEAT {String(beat.n).padStart(2,'0')} · V0{info.variant + 1}</div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--bone)', marginTop: 4 }}>{beat.title}</div>
        </div>
        <button className="btn" onClick={onClose}>Close <Icon.X size={12}/></button>
      </div>
    </div>
  );
}

Object.assign(window, { Storyboard });
