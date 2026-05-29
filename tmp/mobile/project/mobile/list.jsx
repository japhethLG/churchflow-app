// ChurchFlow mobile · List-page table equivalent
// ════════════════════════════════════════════════════════════════════
// Mobile counterpart to the desktop <DataTableShell>. The desktop table
// owns: search · a Filters popover · a date-range toolbar slot · a
// State (Active/Deleted/All) segmented control · a stats strip · the
// table · pagination.
//
// On mobile we keep ALL of those, but:
//   • Every "outside" filter — the Filters popover items, the date-range
//     picker, AND the Active/Deleted/All state control — collapses into
//     ONE dedicated filter sheet (ListFilterSheet). The toolbar shows a
//     single "Filters" button with an active-count badge; tapping it
//     opens the sheet. Active filters also surface as removable chips.
//   • Each table row becomes a card. When a row carries more columns
//     than fit a card's headline, the card is EXPANDABLE — primary
//     identity + the single most important metric stay collapsed; the
//     remaining columns reveal on tap.
//
// The three list pages (Members / Campaigns / Pledges) share this shell
// and differ only in their card renderer + filter config.

// ─── Mini sparkline (members' Last-12mo column) ───────────────────────
function MiniSparkline({ data = [], width = 64, height = 22, tone = 'var(--chart-current)' }) {
  if (!data.length || data.every((v) => v === 0)) {
    return <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>no giving</span>;
  }
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * (height - 2) - 1;
    return [x, y];
  });
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const areaD = `${d} L${width},${height} L0,${height} Z`;
  const gid = 'spark' + Math.round(width + height + data[0] + data[data.length - 1]);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.25" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={tone} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2" fill={tone} />
    </svg>
  );
}

// ─── Stacked progress bar (campaigns / pledges) ───────────────────────
function StackedBar({ total, segments, height = 6 }) {
  const safe = Math.max(total, 1);
  return (
    <div style={{
      position: 'relative', height, width: '100%',
      background: 'var(--chart-track)', borderRadius: 9999, overflow: 'hidden',
    }}>
      {segments.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${Math.min(100, (s.value / safe) * 100)}%`,
          background: s.color, borderRadius: 9999, zIndex: i + 1,
        }} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SCREEN SHELL
// ═══════════════════════════════════════════════════════════════════════

function ListScreenHeader({ overline, title, actionIcon, actionLabel }) {
  return (
    <div style={{ padding: '8px 18px 14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div className="overline" style={{ marginBottom: 3 }}>{overline}</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{title}</h1>
      </div>
      {actionLabel && (
        <button className="press" style={{
          height: 38, padding: '0 14px', borderRadius: 12, flexShrink: 0,
          background: 'var(--primary)', color: 'var(--primary-foreground)',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
        }}>
          {actionIcon && <Icon name={actionIcon} size={15} />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function ListToolbar({ placeholder = 'Search…', value = '', filterCount = 0, onFilter }) {
  return (
    <div style={{ padding: '0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, minWidth: 0,
        display: 'flex', alignItems: 'center', gap: 8,
        height: 40, padding: '0 12px',
        background: 'var(--card-2)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}>
        <Icon name="search" size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
        <div style={{
          flex: 1, fontSize: 13.5,
          color: value ? 'var(--foreground)' : 'var(--muted-foreground)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{value || placeholder}</div>
      </div>
      <button className="press" onClick={onFilter} style={{
        height: 40, padding: '0 12px', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', gap: 7,
        background: filterCount > 0 ? 'var(--primary-soft)' : 'var(--card-2)',
        border: filterCount > 0 ? '1px solid color-mix(in srgb, var(--primary) 45%, transparent)' : '1px solid var(--border)',
        borderRadius: 12,
        color: filterCount > 0 ? 'var(--primary-soft-fg)' : 'var(--foreground)',
        fontSize: 13.5, fontWeight: 600,
      }}>
        <Icon name="filter" size={15} />
        Filters
        {filterCount > 0 && (
          <span className="tabular" style={{
            minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9999,
            background: 'var(--primary)', color: 'var(--primary-foreground)',
            fontSize: 11, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>{filterCount}</span>
        )}
      </button>
    </div>
  );
}

// Removable active-filter chips shown under the toolbar.
// A chip with tone:'period' renders a calendar icon + soft-primary tint
// (the always-on transactions date range); others are plain removable.
function ActiveFilterChips({ chips = [] }) {
  if (!chips.length) return null;
  return (
    <div className="no-scrollbar" style={{
      display: 'flex', gap: 7, padding: '12px 18px 0',
      overflowX: 'auto',
    }}>
      {chips.map((c, i) => {
        const period = c.tone === 'period';
        return (
          <span key={i} className="press" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
            height: 28, padding: '0 8px 0 11px', borderRadius: 9999,
            background: period ? 'var(--primary-soft)' : 'var(--card-2)',
            border: period ? '1px solid color-mix(in srgb, var(--primary) 40%, transparent)' : '1px solid var(--border-strong)',
            fontSize: 12, fontWeight: 600, color: period ? 'var(--primary-soft-fg)' : 'var(--foreground)',
          }}>
            {c.icon && <Icon name={c.icon} size={12} />}
            {c.label}
            <span style={{
              width: 16, height: 16, borderRadius: '50%',
              background: 'var(--muted)', color: 'var(--muted-foreground)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="x" size={9} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

// Stats strip — horizontally scrollable to fit the desktop stat band.
function ListStatsStrip({ stats = [] }) {
  const TONE = {
    neutral: 'var(--foreground)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
  };
  return (
    <div className="no-scrollbar" style={{
      display: 'flex', gap: 18, padding: '14px 18px 4px',
      overflowX: 'auto',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="tabular" style={{
            fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em',
            color: TONE[s.tone || 'neutral'],
          }}>{s.value}</span>
          <span style={{ fontSize: 10.5, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function ListFooter({ shown, total }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px 4px',
    }}>
      <span className="tabular" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
        Showing <strong style={{ color: 'var(--foreground)' }}>1–{shown}</strong> of{' '}
        <strong style={{ color: 'var(--foreground)' }}>{total}</strong>
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="press" style={{
          width: 32, height: 32, borderRadius: 9, background: 'var(--card-2)',
          border: '1px solid var(--border)', color: 'var(--muted-foreground)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4,
        }}><Icon name="chevronLeft" size={15} /></button>
        <button className="press" style={{
          width: 32, height: 32, borderRadius: 9, background: 'var(--primary)',
          color: 'var(--primary-foreground)', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>1</button>
        <button className="press" style={{
          width: 32, height: 32, borderRadius: 9, background: 'var(--card-2)',
          border: '1px solid var(--border)', color: 'var(--muted-foreground)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4,
        }}><Icon name="chevronRight" size={15} /></button>
      </div>
    </div>
  );
}

// ─── Expandable card — the row→card primitive ─────────────────────────
// `collapsed` is always shown. `details` is an array of {label, value}
// rows revealed on expand. Tap anywhere on the card to toggle.
function ExpandableCard({ children, details = [], defaultExpanded = false, deleted = false }) {
  const [open, setOpen] = React.useState(defaultExpanded);
  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: 18,
      border: '1px solid rgba(255,255,255,0.05)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
      opacity: deleted ? 0.6 : 1,
    }}>
      <button className="press" onClick={() => setOpen((v) => !v)} style={{
        display: 'flex', alignItems: 'stretch', gap: 12, width: '100%',
        textAlign: 'left', padding: '14px 14px',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        {details.length > 0 && (
          <div style={{
            alignSelf: 'center', flexShrink: 0,
            width: 24, height: 24, borderRadius: 8,
            background: 'var(--card-2)', color: 'var(--muted-foreground)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}>
            <Icon name="chevronDown" size={14} />
          </div>
        )}
      </button>
      {open && details.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '4px 14px 6px',
          background: 'var(--card-2)',
        }}>
          {details.map((d, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: '10px 0',
              borderBottom: i < details.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span className="overline" style={{ letterSpacing: '0.04em' }}>{d.label}</span>
              <div style={{ textAlign: 'right', minWidth: 0 }}>{d.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Small helper for detail-row values
function DetailValue({ children }) {
  return <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{children}</span>;
}

// ═══════════════════════════════════════════════════════════════════════
// CARD RENDERERS — one per page (rows are identical-but-not-same)
// ═══════════════════════════════════════════════════════════════════════

// MEMBER — collapsed: avatar · name · email · 12mo sparkline+total · status
//          expanded: joined date (+new) · role · registered
function MemberCard({ m, defaultExpanded }) {
  return (
    <ExpandableCard
      defaultExpanded={defaultExpanded}
      deleted={m.deleted}
      details={[
        { label: 'Joined', value: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-end' }}>
            <DetailValue>{m.joined}</DetailValue>
            {m.isNew && <Badge color="green">new</Badge>}
          </div>
        ) },
        { label: 'Role', value: <Badge color={m.role === 'ADMIN' ? 'indigo' : 'neutral'}>{m.role}</Badge> },
        { label: 'Account', value: <DetailValue>{m.registered ? 'Registered' : 'Not registered'}</DetailValue> },
      ]}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <Avatar name={m.name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{m.name}</div>
          <div style={{
            fontSize: 12, color: 'var(--muted-foreground)', marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{m.email}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
          <MiniSparkline data={m.spark} width={58} height={20} />
          <span className="tabular" style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '-0.01em' }}>
            {m.spark.some((v) => v > 0) ? formatCompact(m.total) : '—'}
          </span>
        </div>
      </div>
    </ExpandableCard>
  );
}

// CAMPAIGN — collapsed: title · desc · status · progress bar + figures
//            expanded: deadline (+days) · goal · raised · pledged
function CampaignCard({ c, defaultExpanded }) {
  const raisedPct = c.goal > 0 ? Math.round((c.raised / c.goal) * 100) : 0;
  const pledgedPct = c.goal > 0 ? Math.round((c.pledged / c.goal) * 100) : 0;
  const statusColor = c.status === 'ACTIVE' ? 'green' : c.status === 'COMPLETED' ? 'blue' : c.status === 'DRAFT' ? 'neutral' : 'red';
  return (
    <ExpandableCard
      defaultExpanded={defaultExpanded}
      deleted={c.deleted}
      details={[
        { label: 'Deadline', value: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-end' }}>
            {c.deadline ? <DetailValue>{c.deadline}</DetailValue> : <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Open · no deadline</span>}
            {c.deadlineBadge && <Badge color={c.deadlineBadge.color}>{c.deadlineBadge.label}</Badge>}
          </div>
        ) },
        { label: 'Goal', value: <DetailValue>{formatCurrency(c.goal)}</DetailValue> },
        { label: 'Raised', value: <DetailValue>{formatCurrency(c.raised)} · {raisedPct}%</DetailValue> },
        { label: 'Pledged', value: <DetailValue>{formatCurrency(c.pledged)} · {pledgedPct}%</DetailValue> },
      ]}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em' }}>{c.title}</div>
            {c.description && (
              <div style={{
                fontSize: 12, color: 'var(--muted-foreground)', marginTop: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{c.description}</div>
            )}
          </div>
          <Badge color={statusColor} dot>{c.status}</Badge>
        </div>
        <StackedBar
          total={c.goal}
          segments={[
            { value: c.pledged, color: 'color-mix(in srgb, var(--chart-current) 28%, transparent)' },
            { value: c.raised, color: 'var(--chart-current)' },
          ]}
        />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 7 }}>
          <span className="tabular" style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>
            {formatCompact(c.raised)} / {formatCompact(c.goal)}
          </span>
          <span className="tabular" style={{ fontSize: 11.5, fontWeight: 700 }}>
            {raisedPct}% <span style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>· {pledgedPct}% pledged</span>
          </span>
        </div>
      </div>
    </ExpandableCard>
  );
}

// PLEDGE — the 6-column showcase.
// collapsed: avatar · member · campaign · pledged · lifecycle · paid bar
// expanded:  paid (₱+%) · remaining · deadline (+days)
function PledgeCard({ p, defaultExpanded }) {
  const paidPct = p.pledged > 0 ? Math.round((p.paid / p.pledged) * 100) : 0;
  const lc = p.lifecycle;
  const lcColor = lc.key === 'past-due' ? 'red' : lc.key === 'due-soon' ? 'amber' : lc.key === 'fulfilled' ? 'green' : lc.key === 'on-track' ? 'blue' : 'neutral';
  return (
    <ExpandableCard
      defaultExpanded={defaultExpanded}
      deleted={p.deleted}
      details={[
        { label: 'Paid', value: <DetailValue>{formatCurrency(p.paid)} · {paidPct}%</DetailValue> },
        { label: 'Remaining', value: (
          <DetailValue>
            <span style={{ color: p.remaining > 0 ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
              {formatCurrency(p.remaining)}
            </span>
          </DetailValue>
        ) },
        { label: 'Deadline', value: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-end' }}>
            {p.deadline ? <DetailValue>{p.deadline}</DetailValue> : <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>—</span>}
            {p.daysBadge && (
              <span className="tabular" style={{
                fontSize: 11, fontWeight: 700,
                color: p.daysBadge.tone === 'danger' ? 'var(--danger)' : p.daysBadge.tone === 'warning' ? 'var(--warning)' : 'var(--muted-foreground)',
              }}>{p.daysBadge.label}</span>
            )}
          </div>
        ) },
      ]}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 11 }}>
          <Avatar name={p.member} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{p.member}</div>
            <div style={{
              fontSize: 12, color: 'var(--muted-foreground)', marginTop: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{p.campaign}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <span className="tabular" style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {formatCurrency(p.pledged)}
            </span>
            <Badge color={lcColor}>{lc.label}</Badge>
          </div>
        </div>
        <StackedBar total={p.pledged} segments={[{ value: p.paid, color: 'var(--chart-current)' }]} />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 7 }}>
          <span className="tabular" style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>
            {formatCompact(p.paid)} paid
          </span>
          <span className="tabular" style={{ fontSize: 11.5, fontWeight: 700 }}>{paidPct}%</span>
        </div>
      </div>
    </ExpandableCard>
  );
}

// ─── Transactions: donut + period-totals summary + card ───────────────
const TX_COLORS = {
  'Tithe': 'var(--tx-tithe)', 'Offering': 'var(--tx-offering)', 'Mission': 'var(--tx-mission)',
  'First Fruit': 'var(--tx-first-fruit)', 'Commitment': 'var(--tx-commitment)',
  'Donation': 'var(--tx-donation)', 'Other': 'var(--tx-other)',
};

// SVG donut built from stroke-dasharray arcs — no chart lib needed.
function TxDonut({ segments = [], size = 104, stroke = 17, centerLabel, centerValue }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tot = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  const gap = 2; // px gap between arcs
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chart-track)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const frac = s.value / tot;
          const len = Math.max(0, frac * c - gap);
          const dash = `${len} ${c - len}`;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={s.color} strokeWidth={stroke}
              strokeDasharray={dash} strokeDashoffset={-offset} strokeLinecap="butt" />
          );
          offset += frac * c;
          return el;
        })}
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
      }}>
        <div className="overline" style={{ fontSize: 8.5, letterSpacing: '0.08em' }}>{centerLabel}</div>
        <div className="tabular" style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 2 }}>{centerValue}</div>
      </div>
    </div>
  );
}

function TransactionsSummary({ total, gifts, avg, byType = [] }) {
  const segments = byType.map((b) => ({ value: b.total, color: TX_COLORS[b.type] || 'var(--tx-other)' }));
  return (
    <Card padding={16}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>Period totals</span>
        <span style={{ fontSize: 10.5, color: 'var(--muted-foreground)' }}>matches filters</span>
      </div>

      {/* 3 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { l: 'Total', v: formatCurrency(total) },
          { l: 'Gifts', v: String(gifts) },
          { l: 'Avg gift', v: formatCurrency(avg) },
        ].map((k) => (
          <div key={k.l}>
            <div className="overline" style={{ marginBottom: 3 }}>{k.l}</div>
            <div className="tabular" style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1 }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Donut + breakdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <TxDonut segments={segments} centerLabel="MIX BY TYPE" centerValue={formatCompact(total)} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {byType.map((b) => {
            const share = total > 0 ? Math.round((b.total / total) * 100) : 0;
            return (
              <div key={b.type} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: TX_COLORS[b.type], flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.type}</span>
                <span className="tabular" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{formatCompact(b.total)}</span>
                <span className="tabular" style={{ fontSize: 12.5, fontWeight: 700, width: 32, textAlign: 'right' }}>{share}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

// TRANSACTION — collapsed: avatar · member · date+campaign · type · amount
//               expanded:  campaign · reference # · full date · note
function TransactionCard({ t, defaultExpanded }) {
  const anon = !t.member;
  return (
    <ExpandableCard
      defaultExpanded={defaultExpanded}
      deleted={t.deleted}
      details={[
        { label: 'Campaign', value: t.campaign
          ? <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary-soft-fg)' }}>{t.campaign}</span>
          : <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>—</span> },
        { label: 'Reference #', value: t.ref
          ? <span className="tabular" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--foreground)', fontFamily: 'ui-monospace, monospace' }}>{t.ref}</span>
          : <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>—</span> },
        { label: 'Date', value: <DetailValue>{t.fullDate}</DetailValue> },
        ...(t.note ? [{ label: 'Note', value: <DetailValue>{t.note}</DetailValue> }] : []),
      ]}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        {anon
          ? <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="user" size={17} /></div>
          : <Avatar name={t.member} size={36} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
            color: anon ? 'var(--muted-foreground)' : 'var(--foreground)',
            fontStyle: anon ? 'italic' : 'normal',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{anon ? 'Anonymous' : t.member}</div>
          <div style={{
            fontSize: 11.5, color: 'var(--muted-foreground)', marginTop: 1,
            display: 'flex', alignItems: 'center', gap: 6,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            <span>{t.date}</span>
            <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'var(--muted-foreground)' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.campaign || 'No campaign'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span className="tabular" style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em' }}>{formatCurrency(t.amount)}</span>
          <TypeBadge type={t.type} />
        </div>
      </div>
    </ExpandableCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CONSOLIDATED FILTER SHEET
// ═══════════════════════════════════════════════════════════════════════

function FilterSegmented({ value, options }) {
  return (
    <div style={{
      display: 'flex', gap: 3, padding: 3,
      background: 'var(--card-2)', borderRadius: 12,
      border: '1px solid var(--border)',
    }}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <button key={o.value} className="press" style={{
            flex: 1, height: 36, borderRadius: 9,
            background: sel ? 'var(--primary)' : 'transparent',
            color: sel ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
            fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function FilterChips({ value, options }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <button key={o.value} className="press" style={{
            padding: '8px 13px', borderRadius: 9999,
            background: sel ? 'var(--primary)' : 'var(--card-2)',
            border: sel ? '1px solid var(--primary)' : '1px solid var(--border-strong)',
            color: sel ? 'var(--primary-foreground)' : 'var(--foreground)',
            fontSize: 12.5, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            {sel && <Icon name="circleCheck" size={12} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function FilterSection({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="overline">{label}</span>
        {hint && <span style={{ fontSize: 10.5, color: 'var(--muted-foreground)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// `page` ∈ 'members'|'campaigns'|'pledges'|'transactions'. `active` seeds
// selected values so artboards can show a populated state.
function ListFilterSheet({ page = 'pledges', active = {}, onClose, resultCount = 0 }) {
  const a = {
    state: 'active', status: 'all', lifecycle: 'all', campaign: 'all',
    dateFrom: null, dateTo: null, ...active,
  };

  // Per-page filter config. `statusLabel` names the primary chip group
  // (Status for most, Type for transactions). `date` is the date-range
  // section label (null = no date filter). `campaign` adds a campaign
  // chip group (transactions).
  const CONFIG = {
    members: {
      statusLabel: 'Status',
      status: [
        { value: 'all', label: 'All statuses' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
      lifecycle: false, campaign: false, date: null,
    },
    campaigns: {
      statusLabel: 'Status',
      status: [
        { value: 'all', label: 'All' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' },
      ],
      lifecycle: false, campaign: false, date: null,
    },
    pledges: {
      statusLabel: 'Status',
      status: [
        { value: 'all', label: 'All' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'FULFILLED', label: 'Fulfilled' },
        { value: 'CANCELLED', label: 'Cancelled' },
      ],
      lifecycle: true, campaign: false, date: 'Created',
    },
    transactions: {
      statusLabel: 'Type',
      status: [
        { value: 'all', label: 'All types' },
        { value: 'TITHE', label: 'Tithe' },
        { value: 'OFFERING', label: 'Offering' },
        { value: 'MISSION_GIVING', label: 'Mission' },
        { value: 'FIRST_FRUIT', label: 'First fruit' },
        { value: 'COMMITMENT', label: 'Commitment' },
        { value: 'DONATION', label: 'Donation' },
        { value: 'OTHER', label: 'Other' },
      ],
      campaignOptions: [
        { value: 'all', label: 'All campaigns' },
        { value: 'first-fruit', label: 'First Fruit' },
        { value: 'test', label: 'Test Campaign' },
        { value: 'winter', label: 'Winter Camp' },
      ],
      lifecycle: false, campaign: true, date: 'Period',
    },
  }[page];

  const LIFECYCLE_OPTIONS = [
    { value: 'all', label: 'All lifecycle' },
    { value: 'past-due', label: 'Past due' },
    { value: 'due-soon', label: 'Due soon ≤14d' },
    { value: 'on-track', label: 'On track' },
    { value: 'fulfilled', label: 'Fulfilled' },
    { value: 'no-deadline', label: 'No deadline' },
  ];

  // count active (non-default) filters for the header
  let count = 0;
  if (a.state !== 'active') count++;
  if (a.status !== 'all') count++;
  if (CONFIG.lifecycle && a.lifecycle !== 'all') count++;
  if (CONFIG.campaign && a.campaign !== 'all') count++;
  if (CONFIG.date && (a.dateFrom || a.dateTo)) count++;

  return (
    <Sheet height="86%" padding={0}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 16px 14px' }}>
        <div style={{ flex: 1 }}>
          <div className="overline" style={{ marginBottom: 2 }}>Filter {page}</div>
          <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Filters{count > 0 && <span style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}> · {count} active</span>}
          </h2>
        </div>
        <button className="press" onClick={onClose} aria-label="Close" style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--muted)', color: 'var(--muted-foreground)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="x" size={16} />
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '4px 16px 12px' }} className="no-scrollbar">
        {/* ARCHIVE STATE — was the top-right Active/Deleted/All control */}
        <FilterSection label="Records" hint="Active · deleted · all">
          <FilterSegmented
            value={a.state}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'deleted', label: 'Deleted' },
              { value: 'all', label: 'All' },
            ]}
          />
        </FilterSection>

        {/* STATUS / TYPE */}
        <FilterSection label={CONFIG.statusLabel}>
          <FilterChips value={a.status} options={CONFIG.status} />
        </FilterSection>

        {/* CAMPAIGN — transactions only */}
        {CONFIG.campaign && (
          <FilterSection label="Campaign">
            <FilterChips value={a.campaign} options={CONFIG.campaignOptions} />
          </FilterSection>
        )}

        {/* LIFECYCLE — pledges only */}
        {CONFIG.lifecycle && (
          <FilterSection label="Lifecycle">
            <FilterChips value={a.lifecycle} options={LIFECYCLE_OPTIONS} />
          </FilterSection>
        )}

        {/* DATE RANGE — pledges (Created) / transactions (Period) */}
        {CONFIG.date && (
          <FilterSection label={CONFIG.date} hint="Date range">
            <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
              {[
                { k: 'from', label: 'From', v: a.dateFrom },
                { k: 'to', label: 'To', v: a.dateTo },
              ].map((f) => (
                <button key={f.k} className="press" style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 9,
                  padding: '11px 12px', borderRadius: 12,
                  background: 'var(--card-2)',
                  border: f.v ? '1px solid color-mix(in srgb, var(--primary) 40%, transparent)' : '1px solid var(--border)',
                  textAlign: 'left',
                }}>
                  <Icon name="calendar" size={15} style={{ color: 'var(--muted-foreground)' }} />
                  <div style={{ minWidth: 0 }}>
                    <div className="overline" style={{ marginBottom: 1 }}>{f.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: f.v ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                      {f.v || 'Any'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Last 7 days', 'Last 30 days', 'This year'].map((q) => (
                <span key={q} className="press" style={{
                  padding: '6px 11px', borderRadius: 9999,
                  background: 'rgba(255,255,255,0.04)', color: 'var(--muted-foreground)',
                  fontSize: 11.5, fontWeight: 600,
                }}>{q}</span>
              ))}
            </div>
          </FilterSection>
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '12px 16px 22px',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--card)',
      }}>
        <button className="press" style={{
          height: 46, padding: '0 16px', borderRadius: 13,
          background: 'transparent', color: count > 0 ? 'var(--foreground)' : 'var(--muted-foreground)',
          fontSize: 13.5, fontWeight: 600,
        }}>Clear all</button>
        <Button role="primary" recipe="filled" size="lg" onClick={onClose} style={{ flex: 1 }}>
          Show {resultCount} result{resultCount === 1 ? '' : 's'}
        </Button>
      </div>
    </Sheet>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// FULL SCREEN ASSEMBLY
// ═══════════════════════════════════════════════════════════════════════

function MobileListScreen({
  overline, title, actionLabel, actionIcon,
  searchPlaceholder, searchValue,
  filterCount = 0, activeChips = [],
  stats = [], shown, total,
  topSlot,
  children,
}) {
  return (
    <div className="no-scrollbar" style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingTop: 50, paddingBottom: 120 }}>
      <ListScreenHeader overline={overline} title={title} actionLabel={actionLabel} actionIcon={actionIcon} />
      {topSlot && <div style={{ padding: '2px 18px 6px' }}>{topSlot}</div>}
      <ListToolbar placeholder={searchPlaceholder} value={searchValue} filterCount={filterCount} />
      <ActiveFilterChips chips={activeChips} />
      <ListStatsStrip stats={stats} />
      <div style={{ padding: '10px 18px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
      <ListFooter shown={shown} total={total} />
    </div>
  );
}

Object.assign(window, {
  MiniSparkline, StackedBar, TxDonut,
  ListScreenHeader, ListToolbar, ActiveFilterChips, ListStatsStrip, ListFooter,
  ExpandableCard, DetailValue,
  MemberCard, CampaignCard, PledgeCard, TransactionCard, TransactionsSummary,
  ListFilterSheet, MobileListScreen,
});
