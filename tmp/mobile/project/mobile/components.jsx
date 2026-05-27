// ChurchFlow mobile primitives — adapted from src/components/primitives/*
// All styled to dark-theme tokens in mobile/tokens.css.

// ─── Icon ──────────────────────────────────────────────────────────────
// Lucide-style 24×24 line icons; matches src/components/primitives/Icon.tsx
// Stroke is currentColor → tint via CSS color.
const ICON_PATHS = {
  home:        'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z',
  users:       'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  user:        'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  calendar:    'M3 8h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2 M16 2v4 M8 2v4',
  receipt:     'M16 2H8a2 2 0 0 0-2 2v18l3-2 3 2 3-2 3 2V4a2 2 0 0 0-2-2zM9 8h6 M9 12h6 M9 16h4',
  chart:       'M3 3v18h18 M7 14l4-4 4 4 4-6',
  mail:        'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 7l8 6 8-6',
  book:        'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5a2.5 2.5 0 0 0 0 5H20 M20 2v18',
  settings:    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm9 3-1.7-.6-.5-1.2.7-1.6-1.5-1.5-1.6.7-1.2-.5L14 5h-2l-.6 1.7-1.2.5-1.6-.7-1.5 1.5.7 1.6-.5 1.2L5 12v2l1.7.6.5 1.2-.7 1.6 1.5 1.5 1.6-.7 1.2.5L10 19h2l.6-1.7 1.2-.5 1.6.7 1.5-1.5-.7-1.6.5-1.2L19 14z',
  bell:        'M6 8a6 6 0 1 1 12 0v3l2 3v2H4v-2l2-3z M10 19a2 2 0 0 0 4 0',
  search:      'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4-4',
  plus:        'M12 5v14 M5 12h14',
  x:           'M6 6l12 12 M18 6L6 18',
  close:       'M6 6l12 12 M18 6L6 18',
  chevronRight:'M9 6l6 6-6 6',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronDown: 'M6 9l6 6 6-6',
  chevronUp:   'M6 15l6-6 6 6',
  arrowRight:  'M5 12h14 M13 5l7 7-7 7',
  arrowUp:     'M12 19V5 M5 12l7-7 7 7',
  filter:      'M4 5h16 M7 11h10 M10 17h4',
  dots:        'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0-7a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  more:        'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm14 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  trendingUp:  'M3 17l6-6 4 4 8-8 M14 7h7v7',
  trendingDown:'M3 7l6 6 4-4 8 8 M14 17h7v-7',
  trendingFlat:'M5 12h14',
  triangleAlert:'M12 3l10 18H2L12 3z M12 10v5 M12 18v.5',
  circleCheck: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z M9 12l2 2 4-4',
  gift:        'M20 12v9H4v-9 M2 7h20v5H2zM12 7v14 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zm0 0h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
  cash:        'M2 6h20v12H2zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M5 9h.01M19 15h.01',
  bank:        'M3 22h18 M3 10h18 M5 6l7-4 7 4 M5 10v12 M9 10v12 M15 10v12 M19 10v12',
  heart:       'M19.5 13.5L12 21 4.5 13.5a5 5 0 0 1 7.5-6.5 5 5 0 0 1 7.5 6.5z',
  pin:         'M12 22s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  clock:       'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
  shield:      'M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10z M9 12l2 2 4-4',
  sparkles:    'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM5 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1z',
  logout:      'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  menu:        'M4 6h16 M4 12h16 M4 18h16',
  grid:        'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  inbox:       'M22 12h-6l-2 3h-4l-2-3H2 M5 5h14l3 7v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8z',
  link:        'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5 M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5',
  edit:        'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z',
  trash:       'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6',
  command:     'M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z',
  qrcode:      'M3 3h7v7H3zM3 14h7v7H3zM14 3h7v7h-7zM14 14h3v3h-3zM17 17h4v4 M21 14h-4 M14 17v4',
  refresh:     'M23 4v6h-6 M1 20v-6h6 M3.5 9a9 9 0 0 1 14.9-3.4L23 10 M20.5 15a9 9 0 0 1-14.9 3.4L1 14',
  download:    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  layers:      'M12 2 2 7l10 5 10-5zM2 17l10 5 10-5 M2 12l10 5 10-5',
};

function Icon({ name, size = 20, strokeWidth = 2, className = '', style = {} }) {
  const path = ICON_PATHS[name];
  if (!path) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {path.split(' M').map((d, i) => (
        <path key={i} d={i === 0 ? d : 'M' + d} />
      ))}
    </svg>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  '#8b86ee', '#efb585', '#5eead4', '#c9a4f2',
  '#6aa9f0', '#71d295', '#f5b74f', '#f4a09c',
];
function avatarColor(name = '') {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
function Avatar({ name = '', size = 36, color, square = false }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const bg = color || avatarColor(name);
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: square ? size * 0.3 : '50%',
        background: `${bg}22`,
        color: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: size * 0.4, letterSpacing: '-0.02em',
        flexShrink: 0,
      }}
    >
      {initials || '–'}
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────
function Card({ children, padding = 16, className = '', style = {}, accent = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={className + (onClick ? ' press' : '')}
      style={{
        background: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        padding,
        boxShadow: 'var(--shadow-card)',
        border: accent ? '1px solid rgba(245,183,79,0.25)' : '1px solid rgba(255,255,255,0.04)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────
// Adapted from primitives/Badge.tsx — colors map onto our dark palette.
const BADGE_COLORS = {
  neutral: { bg: 'rgba(255,255,255,0.06)', fg: 'var(--muted-foreground)', dot: 'var(--muted-foreground)' },
  indigo:  { bg: 'var(--primary-soft)', fg: 'var(--primary-soft-fg)', dot: '#8b86ee' },
  green:   { bg: 'var(--success-soft)', fg: 'var(--success-soft-fg)', dot: 'var(--success)' },
  blue:    { bg: 'var(--info-soft)', fg: 'var(--info-soft-fg)', dot: 'var(--info)' },
  amber:   { bg: 'var(--warning-soft)', fg: 'var(--warning-soft-fg)', dot: 'var(--warning)' },
  purple:  { bg: 'rgba(201,164,242,0.12)', fg: '#d6c1f7', dot: '#c9a4f2' },
  teal:    { bg: 'rgba(94,234,212,0.12)', fg: '#9af4e2', dot: '#5eead4' },
  clay:    { bg: 'rgba(239,181,133,0.12)', fg: '#f6d2b5', dot: '#efb585' },
  red:     { bg: 'var(--danger-soft)', fg: 'var(--danger-soft-fg)', dot: 'var(--danger)' },
  gray:    { bg: 'rgba(255,255,255,0.05)', fg: 'var(--muted-foreground)', dot: 'var(--muted-foreground)' },
};
function Badge({ children, color = 'neutral', dot, style = {} }) {
  const c = BADGE_COLORS[color] || BADGE_COLORS.neutral;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: c.bg, color: c.fg,
        padding: '3px 9px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 11, fontWeight: 600, letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />}
      {children}
    </span>
  );
}

// Transaction type → badge color
const TYPE_BADGE_COLOR = {
  'Tithe': 'indigo', 'Offering': 'green', 'Mission': 'blue',
  'First Fruit': 'amber', 'Commitment': 'purple', 'Donation': 'teal', 'Other': 'neutral',
};
function TypeBadge({ type }) {
  return <Badge color={TYPE_BADGE_COLOR[type] || 'neutral'} dot>{type}</Badge>;
}

// ─── Button ────────────────────────────────────────────────────────────
function Button({ children, role = 'primary', recipe, size = 'md', icon, iconRight, fullWidth, onClick, style = {} }) {
  const ROLE_STYLES = {
    primary: {
      filled: { bg: 'var(--primary)', fg: 'var(--primary-foreground)' },
      soft:   { bg: 'var(--primary-soft)', fg: 'var(--primary-soft-fg)' },
      tonal:  { bg: 'var(--primary-tonal)', fg: 'var(--primary-tonal-fg)' },
      ghost:  { bg: 'transparent', fg: 'var(--primary)' },
    },
    secondary: {
      filled: { bg: 'var(--muted)', fg: 'var(--foreground)' },
      soft:   { bg: 'rgba(255,255,255,0.04)', fg: 'var(--foreground)' },
      ghost:  { bg: 'transparent', fg: 'var(--foreground)' },
    },
    danger: {
      filled: { bg: 'var(--danger)', fg: '#2c0c0a' },
      soft:   { bg: 'var(--danger-soft)', fg: 'var(--danger-soft-fg)' },
      ghost:  { bg: 'transparent', fg: 'var(--danger)' },
    },
  };
  const r = ROLE_STYLES[role] || ROLE_STYLES.primary;
  const effectiveRecipe = recipe || (role === 'primary' ? 'filled' : 'soft');
  const s = r[effectiveRecipe] || r.filled;
  const sizeMap = {
    sm: { h: 32, px: 12, fs: 12, gap: 6 },
    md: { h: 40, px: 14, fs: 14, gap: 8 },
    lg: { h: 48, px: 18, fs: 15, gap: 10 },
  };
  const sz = sizeMap[size];
  return (
    <button
      onClick={onClick}
      className="press"
      style={{
        height: sz.h,
        padding: `0 ${sz.px}px`,
        fontSize: sz.fs,
        gap: sz.gap,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        background: s.bg,
        color: s.fg,
        borderRadius: 'var(--radius-md)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={sz.fs + 2} />}
      {children && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={sz.fs + 2} />}
    </button>
  );
}

// ─── ProgressBar ───────────────────────────────────────────────────────
function ProgressBar({ value, max = 100, segments, size = 'sm', overlay = true }) {
  const HEIGHT = { xs: 4, sm: 6, md: 8, lg: 10 };
  const h = HEIGHT[size];
  let segs = segments;
  if (!segs) segs = [{ value, color: 'var(--chart-current)' }];
  const safeTotal = Math.max(max, 1);
  return (
    <div
      style={{
        position: 'relative', height: h, width: '100%',
        background: 'var(--chart-track)', borderRadius: 9999, overflow: 'hidden',
      }}
    >
      {overlay
        ? segs.map((s, i) => {
            const w = Math.min(100, (s.value / safeTotal) * 100);
            return (
              <div key={i}
                style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${w}%`, background: s.color,
                  borderRadius: 9999,
                  zIndex: i + 1,
                }}
              />
            );
          })
        : (
          <div style={{ display: 'flex', height: '100%' }}>
            {segs.map((s, i) => (
              <div key={i} style={{ width: `${(s.value / safeTotal) * 100}%`, background: s.color }} />
            ))}
          </div>
        )}
    </div>
  );
}

// ─── StatCard (mobile-tuned: smaller value, tighter padding) ───────────
function StatCard({ label, value, caption, delta, deltaDirection, icon, accent, style = {}, compact = false }) {
  const dArrow = deltaDirection === 'up' ? 'trendingUp'
              : deltaDirection === 'down' ? 'trendingDown' : 'trendingFlat';
  const dColor = deltaDirection === 'up' ? 'green'
              : deltaDirection === 'down' ? 'red' : 'neutral';
  return (
    <Card padding={compact ? 14 : 16} style={style}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: compact ? 10 : 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && (
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'var(--primary-soft)', color: 'var(--primary-soft-fg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={icon} size={15} />
            </div>
          )}
          <span className="overline">{label}</span>
        </div>
        {delta && (
          <Badge color={dColor}>
            <Icon name={dArrow} size={11} style={{ marginRight: -2 }} />
            {delta}
          </Badge>
        )}
      </div>
      <div
        className="tabular"
        style={{
          fontSize: compact ? 26 : 32,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          background: accent ? 'linear-gradient(135deg, var(--primary) 0%, var(--ring) 100%)' : undefined,
          WebkitBackgroundClip: accent ? 'text' : undefined,
          WebkitTextFillColor: accent ? 'transparent' : undefined,
          color: accent ? undefined : 'var(--foreground)',
          marginBottom: caption ? 6 : 0,
        }}
      >
        {value}
      </div>
      {caption && (
        <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
          {caption}
        </div>
      )}
    </Card>
  );
}

// ─── SectionTitle ──────────────────────────────────────────────────────
function SectionTitle({ title, action, style = {} }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 12, padding: '0 2px', ...style,
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</h3>
      {action}
    </div>
  );
}

// ─── ListRow (tap-to-navigate row used in lists/sheets) ────────────────
function ListRow({ icon, iconBg, leading, title, subtitle, value, valueLine2, badge, trailing, onClick, dense = false }) {
  return (
    <button
      onClick={onClick}
      className="press"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', textAlign: 'left',
        padding: dense ? '10px 4px' : '12px 4px',
        borderRadius: 12,
      }}
    >
      {leading || (icon && (
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: iconBg || 'var(--muted)',
          color: 'var(--foreground)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={18} />
        </div>
      ))}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
            color: 'var(--foreground)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{title}</div>
          {value && (
            <div className="tabular" style={{ fontSize: 14, fontWeight: 700 }}>{value}</div>
          )}
        </div>
        {(subtitle || valueLine2 || badge) && (
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8,
            marginTop: 2,
          }}>
            <div style={{
              fontSize: 12, color: 'var(--muted-foreground)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              minWidth: 0,
            }}>
              {subtitle}
              {badge}
            </div>
            {valueLine2 && (
              <div className="tabular" style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>{valueLine2}</div>
            )}
          </div>
        )}
      </div>
      {trailing}
    </button>
  );
}

// ─── IconTile (square accented tile used for nav grids in More sheet) ──
function IconTile({ icon, label, sublabel, color = 'var(--primary)', onClick }) {
  return (
    <button
      onClick={onClick}
      className="press"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        gap: 10, padding: 14,
        background: 'var(--card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(255,255,255,0.04)',
        width: '100%', textAlign: 'left',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={18} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>{label}</div>
        {sublabel && (
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 1 }}>{sublabel}</div>
        )}
      </div>
    </button>
  );
}

// ─── Sheet (bottom-sheet container) ────────────────────────────────────
function Sheet({ children, height, fullHeight, padding = 0, style = {} }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      height: fullHeight ? '100%' : height || 'auto',
      background: 'var(--card)',
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      boxShadow: 'var(--shadow-pop)',
      padding,
      display: 'flex', flexDirection: 'column',
      ...style,
    }}>
      <div style={{
        width: 36, height: 4, borderRadius: 2,
        background: 'rgba(255,255,255,0.18)',
        margin: '10px auto 8px',
        flexShrink: 0,
      }} />
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }} className="no-scrollbar">
        {children}
      </div>
    </div>
  );
}

// ─── Scrim (modal backdrop above content) ──────────────────────────────
function Scrim({ children, blur = false, opacity = 0.55 }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `rgba(0,0,0,${opacity})`,
      backdropFilter: blur ? 'blur(6px)' : undefined,
      WebkitBackdropFilter: blur ? 'blur(6px)' : undefined,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      zIndex: 50,
    }}>
      {children}
    </div>
  );
}

// Expose globally for other Babel scripts.
Object.assign(window, {
  Icon, Avatar, Card, Badge, TypeBadge, Button, ProgressBar,
  StatCard, SectionTitle, ListRow, IconTile, Sheet, Scrim,
  avatarColor,
});
