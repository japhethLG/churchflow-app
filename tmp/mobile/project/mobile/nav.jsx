// ChurchFlow mobile navigation — 3 variants for the bottom bar.
// All variants render at the bottom of an iPhone-sized frame (390 × 844).
// They share the same Icon+label vocabulary from src/components/layout/sidebar/buildNav.ts.

const NAV_ITEMS = [
  { id: 'dashboard',    icon: 'home',     label: 'Dashboard' },
  { id: 'members',      icon: 'users',    label: 'Members'   },
  { id: 'campaigns',    icon: 'calendar', label: 'Campaigns' },
  { id: 'pledges',      icon: 'book',     label: 'Pledges'   },
];

const MORE_ITEMS = [
  { id: 'transactions', icon: 'receipt',  label: 'Transactions', sub: '128 this month', color: 'var(--info)' },
  { id: 'reports',      icon: 'chart',    label: 'Reports',      sub: 'Weekly digest ready', color: 'var(--success)' },
  { id: 'invitations',  icon: 'mail',     label: 'Invitations',  sub: '3 pending', color: 'var(--warning)' },
  { id: 'profile',      icon: 'user',     label: 'Profile',      sub: 'Japheth Gofredo', color: 'var(--primary)' },
  { id: 'settings',     icon: 'settings', label: 'Settings',     sub: 'Church preferences', color: 'var(--muted-foreground)' },
];

// ─── V1 — Conventional bottom tab bar (4 primary + More) ───────────────
function NavBottomTabs({ active = 'dashboard', onChange, onMore, moreActive }) {
  const tabs = [
    ...NAV_ITEMS,
    { id: 'more', icon: 'menu', label: 'More' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 22, paddingTop: 8,
      background: 'linear-gradient(180deg, rgba(11,13,17,0) 0%, var(--background) 35%)',
      pointerEvents: 'none',
      zIndex: 30,
    }}>
      <div style={{
        margin: '0 12px',
        background: 'rgba(22,25,34,0.88)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 22,
        padding: '6px 4px',
        boxShadow: 'var(--shadow-pill)',
        display: 'flex',
        pointerEvents: 'auto',
      }}>
        {tabs.map((t) => {
          const isActive = (t.id === 'more' && moreActive) || (t.id !== 'more' && t.id === active);
          return (
            <button
              key={t.id}
              onClick={() => t.id === 'more' ? onMore?.() : onChange?.(t.id)}
              className="press"
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 2,
                padding: '6px 0',
                color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
              }}
            >
              <div style={{
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 28, borderRadius: 10,
                background: isActive ? 'var(--primary-soft)' : 'transparent',
              }}>
                <Icon name={t.icon} size={20} strokeWidth={isActive ? 2.4 : 2} />
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '-0.005em',
              }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── V2 — FAB-centered tab bar (Record gift in middle) ────────────────
function NavFabCenter({ active = 'dashboard', onChange, onMore, onFab, moreActive }) {
  // 2 + FAB + 2
  const left  = [NAV_ITEMS[0], NAV_ITEMS[1]];
  const right = [NAV_ITEMS[2], NAV_ITEMS[3]];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 22,
      pointerEvents: 'none',
      zIndex: 30,
    }}>
      {/* FAB sits above the bar */}
      <div style={{
        position: 'absolute', left: '50%', bottom: 38, transform: 'translateX(-50%)',
        pointerEvents: 'auto', zIndex: 2,
      }}>
        <button
          onClick={onFab}
          className="press"
          style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary), #000 18%) 100%)',
            boxShadow: 'var(--shadow-fab)',
            color: 'var(--primary-foreground)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Record a gift"
        >
          <Icon name="plus" size={28} strokeWidth={2.5} />
        </button>
      </div>
      <div style={{
        margin: '0 12px',
        background: 'rgba(22,25,34,0.88)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 22,
        padding: '8px 6px',
        boxShadow: 'var(--shadow-pill)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 76px 1fr 1fr',
        alignItems: 'center',
        pointerEvents: 'auto',
      }}>
        {[...left, { id: '__spacer' }, ...right].map((t, i) => {
          if (t.id === '__spacer') return <div key={i} />;
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange?.(t.id)}
              className="press"
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 2, padding: '4px 0',
                color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
              }}
            >
              <Icon name={t.icon} size={20} strokeWidth={isActive ? 2.4 : 2} />
              <span style={{ fontSize: 10, fontWeight: 600 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
      {/* More button (pill above the bar's right corner) */}
      <button
        onClick={onMore}
        className="press"
        style={{
          position: 'absolute', right: 18, bottom: 96,
          pointerEvents: 'auto',
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(22,25,34,0.88)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: moreActive ? 'var(--primary)' : 'var(--muted-foreground)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="More"
      >
        <Icon name="menu" size={20} />
      </button>
    </div>
  );
}

// ─── V3 — Floating pill nav (icon-only, more compact) ──────────────────
function NavFloatingPill({ active = 'dashboard', onChange, onMore, moreActive }) {
  const tabs = [
    ...NAV_ITEMS,
    { id: 'more', icon: 'menu', label: 'More' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 30,
      display: 'flex', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 30,
    }}>
      <div style={{
        background: 'rgba(22,25,34,0.92)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 9999,
        padding: 6,
        display: 'flex', gap: 2,
        boxShadow: 'var(--shadow-pill)',
        pointerEvents: 'auto',
      }}>
        {tabs.map((t) => {
          const isActive = (t.id === 'more' && moreActive) || (t.id !== 'more' && t.id === active);
          return (
            <button
              key={t.id}
              onClick={() => t.id === 'more' ? onMore?.() : onChange?.(t.id)}
              className="press"
              style={{
                position: 'relative',
                width: 56, height: 44, borderRadius: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                transition: 'background 0.18s ease',
              }}
              aria-label={t.label}
            >
              <Icon name={t.icon} size={20} strokeWidth={2.2} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Convenience: pick a variant by name
function MobileNav({ variant = 'tabs', ...props }) {
  if (variant === 'fab')   return <NavFabCenter {...props} />;
  if (variant === 'pill')  return <NavFloatingPill {...props} />;
  return <NavBottomTabs {...props} />;
}

Object.assign(window, {
  NAV_ITEMS, MORE_ITEMS,
  NavBottomTabs, NavFabCenter, NavFloatingPill, MobileNav,
});
