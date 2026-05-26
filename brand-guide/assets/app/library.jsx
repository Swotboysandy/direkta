/* DIREKTA — Library workspace */

const LIBRARY_TABS = [
  { id: 'generations', label: 'Generations',  note: 'Single beat variants' },
  { id: 'sequences',   label: 'Sequences',    note: 'Stitched animatics' },
  { id: 'soulids',     label: 'Soul IDs',     note: 'Reusable across projects' },
  { id: 'docs',        label: 'Scripts & Bibles', note: 'Saved manuscripts' },
  { id: 'exports',     label: 'Exports',      note: 'Delivered files' }
];

function Library({ library, onSwitchWorkspace }) {
  const [tab, setTab] = React.useState('generations');
  const [filter, setFilter] = React.useState('all'); // all | this-project
  const tabData = library[tab];
  const count = tab === 'docs' ? library.docs.length : library[tab].length;

  return (
    <div className="main-inner library">
      <header className="page-head">
        <div>
          <div className="crumb">06 / WORKSPACE · LIBRARY</div>
          <h1>Library</h1>
          <div className="sub">Everything Direkta has rendered, written, or shipped. <strong style={{color:'var(--bone)'}}>Reuse anything across any project.</strong></div>
        </div>
        <div className="actions">
          <button className="btn"><Icon.Save size={14}/> Bulk export</button>
          <button className="btn btn-primary" onClick={() => onSwitchWorkspace('storyboard')}>
            Back to Storyboard <Icon.Arrow size={14}/>
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div style={{ padding: '0 40px', borderBottom: '1px solid var(--ink-30)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex' }}>
          {LIBRARY_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: 'transparent', border: 0,
                padding: '14px 22px 16px',
                fontFamily: 'var(--f-display)', fontSize: 18, letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: tab === t.id ? 'var(--bone)' : 'var(--ink-60)',
                cursor: 'pointer',
                borderBottom: '2px solid ' + (tab === t.id ? 'var(--tungsten)' : 'transparent'),
                marginBottom: -1
              }}
              onMouseEnter={(e) => { if (tab !== t.id) e.currentTarget.style.color = 'var(--bone-60)'; }}
              onMouseLeave={(e) => { if (tab !== t.id) e.currentTarget.style.color = 'var(--ink-60)'; }}
            >{t.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
              padding: '6px 12px',
              background: filter === 'all' ? 'var(--tungsten)' : 'transparent',
              color: filter === 'all' ? 'var(--ink-00)' : 'var(--bone)',
              border: '1px solid ' + (filter === 'all' ? 'var(--tungsten)' : 'var(--ink-40)'),
              cursor: 'pointer'
            }}>ALL PROJECTS</button>
          <button
            onClick={() => setFilter('this')}
            style={{
              fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
              padding: '6px 12px',
              background: filter === 'this' ? 'var(--tungsten)' : 'transparent',
              color: filter === 'this' ? 'var(--ink-00)' : 'var(--bone)',
              border: '1px solid ' + (filter === 'this' ? 'var(--tungsten)' : 'var(--ink-40)'),
              cursor: 'pointer'
            }}>THIS PROJECT</button>
        </div>
      </div>

      {/* Sub-bar with description and search */}
      <div style={{ padding: '14px 40px', borderBottom: '1px solid var(--ink-25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-70)', textTransform: 'uppercase' }}>
          {LIBRARY_TABS.find(t => t.id === tab).note} · <span style={{ color: 'var(--tungsten)' }}>{count} ITEMS</span>
        </div>
        <input
          placeholder="Search…"
          style={{
            background: 'var(--ink-10)', border: '1px solid var(--ink-30)',
            color: 'var(--bone)', padding: '6px 10px',
            fontFamily: 'var(--f-ui)', fontSize: 12, outline: 'none', minWidth: 240
          }}
        />
      </div>

      <div className="page-body">
        {tab === 'generations' && <GenerationsGrid items={library.generations} beats={window.DK_DATA.BEATS}/>}
        {tab === 'sequences'   && <SequencesList items={library.sequences}/>}
        {tab === 'soulids'     && <SoulIdGrid items={library.soulids}/>}
        {tab === 'docs'        && <DocsList items={library.docs}/>}
        {tab === 'exports'     && <ExportsList items={library.exports}/>}
      </div>
    </div>
  );
}

/* ============================================
   GENERATIONS GRID
   ============================================ */
function GenerationsGrid({ items, beats }) {
  const beatMap = Object.fromEntries(beats.map(b => [b.n, b]));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {items.map(it => {
        const beat = beatMap[it.beat];
        return (
          <div key={it.id} style={{
            background: 'var(--ink-05)', border: '1px solid var(--ink-30)',
            cursor: 'pointer'
          }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--ink-60)'}
             onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--ink-30)'}>
            <div className={`film-frame mood-${it.mood === 'warehouse' ? 'cold' : it.mood === 'apartment' ? 'amber' : it.mood === 'precinct' ? 'neutral' : it.mood === 'riverside' ? 'dawn' : it.mood === 'cafe' ? 'sun' : 'neutral'}`} style={{ aspectRatio: '2.39/1', position: 'relative' }}>
              <div className="letterbox-t"/><div className="letterbox-b"/>
              <div className="corner-tick tl"/><div className="corner-tick br"/>
              <div style={{
                position: 'absolute', left: '40%', bottom: '15%', width: '30%', height: '50%',
                background: 'rgba(0,0,0,0.55)', filter: 'blur(2px)',
                clipPath: 'polygon(40% 0, 60% 0, 70% 25%, 80% 100%, 20% 100%, 30% 25%)'
              }}/>
              {it.picked && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 22, height: 22, background: 'var(--tungsten)', color: 'var(--ink-00)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}><Icon.Check size={12}/></div>
              )}
              {it.flag === 'continuity' && (
                <div style={{
                  position: 'absolute', top: 8, left: 8,
                  padding: '3px 6px', background: 'var(--cut)', color: 'var(--bone)',
                  fontFamily: 'var(--f-mono)', fontSize: 8, letterSpacing: '0.18em'
                }}>CONT.</div>
              )}
              <div className="stamp">{beat?.slug || it.title}</div>
              <div className="vnum">B{String(it.beat).padStart(2,'0')} · V0{it.variant}</div>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>{it.project}</div>
              <div style={{ color: 'var(--bone)', fontSize: 13, fontWeight: 500, marginTop: 4, lineHeight: 1.3 }}>{beat?.title || it.title}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>{it.date} · {it.size}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-ghost" style={{ padding: '4px 6px' }}><Icon.Zoom size={11}/></button>
                  <button className="btn btn-sm btn-ghost" style={{ padding: '4px 6px' }}><Icon.Save size={11}/></button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================
   SEQUENCES LIST (stitched animatics)
   ============================================ */
function SequencesList({ items }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map(s => (
        <div key={s.id} style={{
          display: 'grid', gridTemplateColumns: '220px 1fr auto', gap: 24,
          background: 'var(--ink-05)', border: '1px solid var(--ink-30)',
          padding: 0, alignItems: 'stretch'
        }}>
          {/* Filmstrip preview */}
          <div style={{ background: 'var(--ink-00)', padding: 16, display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
              {[0,1,2].map(i => (
                <div key={i} className={`film-frame ${i===0?'mood-cold':i===1?'mood-amber':'mood-neutral'}`} style={{ aspectRatio: '2.39/1', position: 'relative' }}>
                  <div className="letterbox-t"/><div className="letterbox-b"/>
                </div>
              ))}
            </div>
          </div>
          {/* Meta */}
          <div style={{ padding: '20px 24px 20px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--tungsten)', textTransform: 'uppercase' }}>{s.project}</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--bone)', lineHeight: 1 }}>{s.title}</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6, fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.06em', color: 'var(--ink-70)' }}>
              <span>{s.duration}</span>
              <span>· {s.clipCount} CLIPS</span>
              <span>· {s.size}</span>
              <span>· {s.date}</span>
            </div>
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, padding: 20 }}>
            <button className="btn btn-primary" style={{ justifyContent: 'center' }}><Icon.Play size={12}/> Play</button>
            <button className="btn btn-sm" style={{ justifyContent: 'center' }}><Icon.Save size={12}/> Download</button>
            <button className="btn btn-sm btn-ghost" style={{ justifyContent: 'center' }}>Open in Stitch</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================
   SOUL ID GRID (reusable)
   ============================================ */
function SoulIdGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {items.map(s => (
        <div key={s.id} style={{
          background: 'var(--ink-05)', border: '1px solid var(--ink-30)',
          padding: 22,
          display: 'flex', flexDirection: 'column', gap: 14
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>{s.project} {s.type === 'location' ? '· LOCATION' : ''}</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--bone)', marginTop: 4, lineHeight: 1 }}>{s.name}</div>
            </div>
            <SoulStateBadge state={s.state} consistency={s.consistency} progress={s.progress}/>
          </div>

          {/* Face / location preview */}
          {s.type === 'location' ? (
            <div className={`film-frame ${s.name === 'WAREHOUSE' ? 'mood-cold' : 'mood-amber'}`} style={{ aspectRatio: '16/10', position: 'relative' }}>
              <div className="letterbox-t"/><div className="letterbox-b"/>
              <div className="corner-tick tl"/><div className="corner-tick br"/>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  aspectRatio: '3/4',
                  background: ['radial-gradient(ellipse at 30% 40%, #2a2018 0%, #0a0805 75%)','radial-gradient(ellipse at 70% 50%, #1c2226 0%, #060709 75%)','radial-gradient(ellipse at 50% 35%, #261a14 0%, #08060a 75%)'][i],
                  position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: '32%', left: '30%', width: '40%', height: '30%', background: 'rgba(0,0,0,0.5)', borderRadius: '50% 50% 45% 45%', filter: 'blur(1.5px)' }}/>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>
            <span>{s.refsCount} REFS</span>
            <span>· REUSED {s.reused ?? 0}×</span>
            <span>· {s.date}</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, paddingTop: 8, borderTop: '1px solid var(--ink-25)' }}>
            <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Reuse in project</button>
            <button className="btn btn-sm btn-ghost">Test</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SoulStateBadge({ state, consistency, progress }) {
  if (state === 'training') {
    return <span className="pip-state" data-s="working">{Math.round((progress || 0) * 100)}%</span>;
  }
  return <span className="pip-state" data-s="done">{consistency || '—'} / 10</span>;
}

/* ============================================
   DOCS LIST (scripts & bibles)
   ============================================ */
function DocsList({ items }) {
  const groups = items.reduce((g, d) => { (g[d.kind] = g[d.kind] || []).push(d); return g; }, {});
  const kindLabel = { script: 'Screenplays', bible: 'Production Bibles', treatment: 'Treatments', beats: 'Beat Sheets' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {Object.entries(groups).map(([kind, docs]) => (
        <div key={kind}>
          <div className="eb" style={{ marginBottom: 12 }}>{(kindLabel[kind] || kind).toUpperCase()} · {docs.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {docs.map(d => (
              <div key={d.id} style={{
                display: 'grid', gridTemplateColumns: '60px 1fr 120px 120px 120px auto', gap: 16,
                padding: '14px 18px', background: 'var(--ink-05)',
                border: '1px solid var(--ink-30)', borderTop: 'none',
                alignItems: 'center'
              }}>
                <div style={{
                  width: 36, height: 48, background: 'var(--ink-10)', border: '1px solid var(--ink-30)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--bone-60)'
                }}>{d.format}</div>
                <div>
                  <div style={{ color: 'var(--bone)', fontSize: 14, fontWeight: 500 }}>{d.title}</div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase', marginTop: 4 }}>{d.project}</div>
                </div>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-70)' }}>{d.pages} PAGES</span>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-70)' }}>{d.words ? d.words.toLocaleString() + ' W' : '—'}</span>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-60)' }}>{d.date}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm">Open</button>
                  <button className="btn btn-sm btn-ghost"><Icon.Save size={11}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================
   EXPORTS LIST
   ============================================ */
function ExportsList({ items }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '60px 1fr 80px 120px 120px auto',
        gap: 16, padding: '12px 18px',
        background: 'var(--ink-00)',
        borderTop: '1px solid var(--ink-40)',
        borderBottom: '1px solid var(--ink-40)',
        fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em',
        color: 'var(--ink-60)', textTransform: 'uppercase'
      }}>
        <span>TYPE</span>
        <span>TITLE</span>
        <span>SIZE</span>
        <span>DOWNLOADS</span>
        <span>DATE</span>
        <span></span>
      </div>
      {items.map(e => (
        <div key={e.id} style={{
          display: 'grid', gridTemplateColumns: '60px 1fr 80px 120px 120px auto', gap: 16,
          padding: '14px 18px',
          borderBottom: '1px solid var(--ink-25)',
          alignItems: 'center'
        }}>
          <div style={{
            padding: '4px 8px', background: 'var(--ink-10)',
            border: '1px solid var(--ink-30)',
            fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em',
            color: 'var(--tungsten)', textAlign: 'center', textTransform: 'uppercase'
          }}>{e.kind}</div>
          <div>
            <div style={{ color: 'var(--bone)', fontSize: 14 }}>{e.title}</div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase', marginTop: 4 }}>{e.project}</div>
          </div>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-70)' }}>{e.size}</span>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--bone)' }}>{e.downloads}× ↓</span>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-60)' }}>{e.date}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm btn-primary"><Icon.Save size={11}/> DOWNLOAD</button>
            <button className="btn btn-sm btn-ghost">Share</button>
          </div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Library });
