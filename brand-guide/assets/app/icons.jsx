/* DIREKTA — Shared icon components */

const Icon = {
  // Workspaces
  Screenplay: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 18} height={p.size || 18} {...p}>
      <rect x="4" y="3" width="16" height="18"/>
      <rect x="6.5" y="6" width="11" height="2" fill="currentColor" stroke="none"/>
      <line x1="6.5" y1="10.5" x2="17.5" y2="10.5"/>
      <line x1="6.5" y1="13" x2="14" y2="13"/>
      <line x1="9" y1="16" x2="15" y2="16"/>
      <line x1="9" y1="18" x2="13" y2="18"/>
    </svg>
  ),
  Casting: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 18} height={p.size || 18} {...p}>
      <path d="M3 6 V3 H6"/><path d="M21 6 V3 H18"/>
      <path d="M3 18 V21 H6"/><path d="M21 18 V21 H18"/>
      <circle cx="12" cy="10" r="3"/>
      <path d="M6.5 19 C 7 14.5, 17 14.5, 17.5 19"/>
    </svg>
  ),
  Storyboard: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 18} height={p.size || 18} {...p}>
      <rect x="3" y="5" width="6" height="5"/>
      <rect x="10" y="5" width="6" height="5" fill="currentColor"/>
      <rect x="17" y="5" width="4" height="5"/>
      <rect x="3" y="14" width="6" height="5"/>
      <rect x="10" y="14" width="6" height="5"/>
      <rect x="17" y="14" width="4" height="5"/>
    </svg>
  ),
  Stitch: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 18} height={p.size || 18} {...p}>
      <rect x="2" y="9" width="6" height="6"/>
      <rect x="13" y="3" width="6" height="6"/>
      <rect x="13" y="15" width="6" height="6"/>
      <line x1="8" y1="11" x2="13" y2="6"/>
      <line x1="8" y1="13" x2="13" y2="18"/>
    </svg>
  ),
  Export: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 18} height={p.size || 18} {...p}>
      <rect x="4" y="3" width="16" height="11"/>
      <line x1="12" y1="10" x2="12" y2="20"/>
      <path d="M8 17 L 12 21 L 16 17"/>
      <line x1="4" y1="21.5" x2="20" y2="21.5"/>
    </svg>
  ),
  Dashboard: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 18} height={p.size || 18} {...p}>
      <rect x="3" y="3" width="8" height="8"/>
      <rect x="13" y="3" width="8" height="5"/>
      <rect x="13" y="10" width="8" height="11"/>
      <rect x="3" y="13" width="8" height="8"/>
    </svg>
  ),

  // Aperture (Direkta mark)
  Aperture: (p) => (
    <svg viewBox="0 0 200 200" fill="none" width={p.size || 24} height={p.size || 24} {...p}>
      <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="10"/>
      <g stroke="currentColor" strokeWidth="10" fill="none" strokeLinejoin="miter">
        <path d="M 100 28 L 100 60 L 138 82"/>
        <path d="M 162.4 64 L 138 82 L 138 126"/>
        <path d="M 162.4 136 L 138 126 L 100 148"/>
        <path d="M 100 172 L 100 148 L 62 126"/>
        <path d="M 37.6 136 L 62 126 L 62 82"/>
        <path d="M 37.6 64 L 62 82 L 100 60"/>
      </g>
      <circle cx="100" cy="104" r="12" fill="currentColor"/>
    </svg>
  ),

  // Generic
  Lock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 14} height={p.size || 14} {...p}>
      <rect x="5" y="11" width="14" height="9"/>
      <path d="M8 11 V7 a4 4 0 0 1 8 0 V11"/>
    </svg>
  ),
  Key: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 16} height={p.size || 16} {...p}>
      <circle cx="8" cy="14" r="4"/>
      <path d="M12 14 H21 M18 14 V18 M15 14 V17"/>
    </svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 14} height={p.size || 14} {...p}>
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" width={p.size || 14} height={p.size || 14} {...p}>
      <polyline points="4 12 10 18 20 6"/>
    </svg>
  ),
  X: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" width={p.size || 14} height={p.size || 14} {...p}>
      <line x1="6" y1="6" x2="18" y2="18"/>
      <line x1="18" y1="6" x2="6" y2="18"/>
    </svg>
  ),
  Refresh: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 14} height={p.size || 14} {...p}>
      <path d="M3 12 a9 9 0 0 1 15-6.7 L21 8 M21 3 V8 H16"/>
      <path d="M21 12 a9 9 0 0 1 -15 6.7 L3 16 M3 21 V16 H8"/>
    </svg>
  ),
  Zoom: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 14} height={p.size || 14} {...p}>
      <circle cx="11" cy="11" r="6"/>
      <line x1="16" y1="16" x2="20" y2="20"/>
    </svg>
  ),
  Flag: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 14} height={p.size || 14} {...p}>
      <path d="M5 3 V21"/>
      <path d="M5 4 H19 L16 8 L19 12 H5"/>
    </svg>
  ),
  Play: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width={p.size || 14} height={p.size || 14} {...p}>
      <polygon points="6 4 20 12 6 20"/>
    </svg>
  ),
  Pause: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width={p.size || 14} height={p.size || 14} {...p}>
      <rect x="6" y="5" width="4" height="14"/>
      <rect x="14" y="5" width="4" height="14"/>
    </svg>
  ),
  Chevron: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 14} height={p.size || 14} {...p}>
      <polyline points="9 6 15 12 9 18"/>
    </svg>
  ),
  ChevronDown: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 14} height={p.size || 14} {...p}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Arrow: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 14} height={p.size || 14} {...p}>
      <line x1="4" y1="12" x2="20" y2="12"/>
      <polyline points="14 6 20 12 14 18"/>
    </svg>
  ),
  Dot: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" width={p.size || 8} height={p.size || 8} {...p}>
      <circle cx="12" cy="12" r="6"/>
    </svg>
  ),
  Camera: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 14} height={p.size || 14} {...p}>
      <rect x="3" y="7" width="18" height="13"/>
      <circle cx="12" cy="13.5" r="3.5"/>
      <path d="M9 7 L11 4 H13 L15 7"/>
    </svg>
  ),
  Save: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={p.size || 14} height={p.size || 14} {...p}>
      <rect x="4" y="4" width="16" height="16"/>
      <rect x="8" y="4" width="8" height="6"/>
      <rect x="8" y="14" width="8" height="6"/>
    </svg>
  )
};

Object.assign(window, { Icon });
