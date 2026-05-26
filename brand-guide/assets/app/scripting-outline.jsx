/* DIREKTA — Scripting · Outline tab */

function ScriptingOutline({ acts, beats }) {
  const beatMap = Object.fromEntries(beats.map(b => [b.n, b]));
  const totalChapters = acts.reduce((s, a) => s + a.chapters.length, 0);
  const totalScenes = acts.reduce((s, a) => s + a.chapters.reduce((ss, c) => ss + c.scenes, 0), 0);
  const totalWords = acts.reduce((s, a) => s + a.chapters.reduce((ss, c) => ss + c.wordCount, 0), 0);

  return (
    <div style={{ padding: '24px 36px 64px' }}>
      {/* Summary strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0,
        border: '1px solid var(--ink-30)', background: 'var(--ink-05)',
        marginBottom: 28
      }}>
        <SummaryCell label="ACTS"     value={acts.length}/>
        <SummaryCell label="CHAPTERS" value={totalChapters}/>
        <SummaryCell label="SCENES"   value={totalScenes}/>
        <SummaryCell label="BEATS"    value={beats.length}/>
        <SummaryCell label="WORDS"    value={totalWords.toLocaleString()}/>
      </div>

      {/* Acts list */}
      {acts.map(act => (
        <ActSection key={act.n} act={act} beatMap={beatMap}/>
      ))}

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, border: '1px solid var(--ink-30)', background: 'var(--ink-05)' }}>
        <div>
          <div className="eb">SCRIPT READER</div>
          <div style={{ color: 'var(--bone)', fontSize: 14, marginTop: 4 }}>Outline is locked to the current script. Editing chapters here updates the breakdown.</div>
        </div>
        <button className="btn"><Icon.Plus size={12}/> Add chapter</button>
      </div>
    </div>
  );
}

function SummaryCell({ label, value }) {
  return (
    <div style={{ padding: '20px 22px', borderRight: '1px solid var(--ink-30)' }}>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 36, letterSpacing: '0.02em', color: 'var(--bone)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--ink-60)', textTransform: 'uppercase', marginTop: 6 }}>{label}</div>
    </div>
  );
}

function ActSection({ act, beatMap }) {
  return (
    <section style={{ marginBottom: 36 }}>
      {/* Act header */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20,
        alignItems: 'baseline',
        padding: '14px 0 16px',
        borderBottom: '1px solid var(--ink-40)',
        marginBottom: 16
      }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.24em', color: 'var(--tungsten)', textTransform: 'uppercase' }}>ACT {act.n} OF 3</span>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 32, letterSpacing: '0.04em', color: 'var(--bone)', textTransform: 'uppercase', lineHeight: 1 }}>{act.title}</h2>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>
          {act.chapters.length} CH · {act.chapters.reduce((s, c) => s + c.scenes, 0)} SCENES · {act.chapters.reduce((s, c) => s + c.wordCount, 0).toLocaleString()} W
        </span>
      </div>

      {/* Chapter cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {act.chapters.map(ch => <ChapterCard key={ch.n} chapter={ch} beatMap={beatMap}/>)}
      </div>
    </section>
  );
}

function ChapterCard({ chapter, beatMap }) {
  const [expanded, setExpanded] = React.useState(chapter.n === 1);
  return (
    <div style={{
      border: '1px solid ' + (chapter.flag === 'clarification' ? 'var(--tungsten)' : 'var(--ink-30)'),
      background: 'var(--ink-05)',
      transition: 'border-color 80ms'
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '14px 20px', cursor: 'pointer',
          display: 'grid', gridTemplateColumns: '56px 1fr auto auto', gap: 20, alignItems: 'center'
        }}
      >
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--tungsten)', textTransform: 'uppercase' }}>CH {String(chapter.n).padStart(2, '0')}</span>
        <div>
          <div style={{ color: 'var(--bone)', fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em' }}>{chapter.title}</div>
          <div style={{ marginTop: 4, fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>
            {chapter.scenes} SCENES · {chapter.beats.length} BEATS · {chapter.wordCount.toLocaleString()} WORDS
            {chapter.flashback && <span style={{ color: 'var(--tungsten)', marginLeft: 8 }}>· FLASHBACK</span>}
            {chapter.flag === 'clarification' && <span style={{ color: 'var(--tungsten)', marginLeft: 8 }}>· CLARIFICATION PENDING</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {chapter.beats.map(bn => (
            <span key={bn} style={{
              fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.14em',
              padding: '3px 6px', background: 'var(--ink-25)', color: 'var(--bone-60)',
              textTransform: 'uppercase'
            }}>B{String(bn).padStart(2, '0')}</span>
          ))}
        </div>
        <Icon.Chevron size={14} style={{ color: 'var(--ink-50)', transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 120ms' }}/>
      </div>

      {expanded && (
        <div style={{ padding: '0 20px 18px', borderTop: '1px solid var(--ink-25)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {chapter.beats.map(bn => {
            const b = beatMap[bn];
            if (!b) return null;
            return (
              <div key={bn} style={{
                display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 16,
                padding: '12px 14px', alignItems: 'center',
                background: 'var(--ink-10)', border: '1px solid var(--ink-25)'
              }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--tungsten)', textTransform: 'uppercase' }}>B {String(b.n).padStart(2, '0')}</span>
                <div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.06em', color: 'var(--ink-60)', textTransform: 'uppercase' }}>{b.slug}</div>
                  <div style={{ color: 'var(--bone)', fontSize: 13, fontWeight: 500, marginTop: 3 }}>{b.title}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {b.chars.slice(0, 3).map(c => (
                    <span key={c} style={{
                      fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.14em',
                      padding: '3px 6px', background: 'var(--ink-25)', color: 'var(--bone-60)'
                    }}>{c}</span>
                  ))}
                </div>
              </div>
            );
          })}
          {chapter.flag === 'clarification' && (
            <div style={{ padding: '12px 14px', background: 'rgba(242,181,60,0.06)', borderLeft: '2px solid var(--tungsten)' }}>
              <div className="eb">BEAT WRITER · ATTENTION</div>
              <div style={{ color: 'var(--bone)', fontSize: 13, marginTop: 4 }}>Beat 12 — "what happened in Lisbon" needs your call before the chapter resolves.</div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button className="btn btn-sm btn-primary">Resolve</button>
                <button className="btn btn-sm">Discuss</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ScriptingOutline });
