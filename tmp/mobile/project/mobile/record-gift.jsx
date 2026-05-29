// ChurchFlow mobile · Record-gift bulk-entry flow
// ────────────────────────────────────────────────────────────────────
// The desktop modal lets an admin set Member + Date ONCE (applies to
// every gift) and then stage multiple gifts before recording them in
// bulk. On mobile we can't fit a 2-pane staging layout, so we explore
// two drill-down patterns that preserve the bulk-entry capability:
//
//   A — Hub & Spoke
//       Main staging sheet (member · date · list of staged gifts +
//       footer total). "+ Add gift" drills down into a focused gift
//       form. Closest 1:1 to the desktop split-pane mental model.
//
//   B — Wizard (3 steps)
//       Who&When → Gifts → Review. Locks context per step, stricter
//       for casual users, more taps for the bulk case.
//
// Each variant has multiple states surfaced as artboards in canvas.jsx
// so they can be compared side-by-side.

// ─── Demo data ─────────────────────────────────────────────────────────
const RG_STAGED_TWO = [
  { id: 'g1', amount: 2500, type: 'Tithe', campaign: 'Easter Mission Trip', pledge: 'Easter Mission Trip · ₱8k left' },
  { id: 'g2', amount: 800,  type: 'Offering', campaign: null, pledge: null },
];

const RG_TYPES = ['Tithe', 'Offering', 'Mission', 'First Fruit', 'Commitment', 'Donation', 'Other'];

const rgTotal = (gifts) => gifts.reduce((s, g) => s + g.amount, 0);

// ─── Shared sheet chrome ───────────────────────────────────────────────
function RGHeader({ overline, title, sub, onClose, onBack, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '4px 16px 14px',
    }}>
      {onBack && (
        <button className="press" onClick={onBack}
          aria-label="Back"
          style={{
            width: 36, height: 36, borderRadius: 12, flexShrink: 0,
            background: 'var(--muted)', color: 'var(--foreground)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 4,
          }}>
          <Icon name="chevronLeft" size={18} />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {overline && <div className="overline" style={{ marginBottom: 4 }}>{overline}</div>}
        <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{title}</h2>
        {sub && <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', marginTop: 4 }}>{sub}</div>}
      </div>
      {right}
      {onClose && (
        <button className="press" onClick={onClose}
          aria-label="Close"
          style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'var(--muted)', color: 'var(--muted-foreground)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 4,
          }}>
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}

function RGFooter({ leading, children }) {
  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      padding: '12px 16px 22px',
      background: 'var(--card)',
      display: 'flex', alignItems: 'center', gap: 10,
      flexShrink: 0,
    }}>
      {leading && <div style={{ flex: 1, minWidth: 0 }}>{leading}</div>}
      {children}
    </div>
  );
}

function RGTotalLeader({ gifts }) {
  const n = gifts.length;
  return (
    <div>
      <div className="tabular" style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>
        {formatCurrency(rgTotal(gifts))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 1 }}>
        {n === 0 ? 'No gifts yet' : `${n} gift${n === 1 ? '' : 's'} staged`}
      </div>
    </div>
  );
}

// ─── Context strip: member + date ─────────────────────────────────────
// When `picker` is 'member' or 'date', the corresponding row is replaced
// with an inline expanded picker (search dropdown / calendar popover),
// matching how the desktop modal's inline controls behave.
function RGContextStrip({ member, date = 'May 28, 2026', locked = false, picker = null, query = '' }) {
  const showMemberPicker = picker === 'member';
  const showDatePicker = picker === 'date';
  return (
    <Card padding={0} style={{ overflow: 'hidden' }}>
      {/* MEMBER ROW (or inline picker) */}
      {showMemberPicker ? (
        <RGMemberPickerInline query={query} />
      ) : (
        <button className="press" style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          textAlign: 'left', padding: '12px 14px',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'var(--primary-soft)', color: 'var(--primary-soft-fg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {member
              ? <Avatar name={member} size={36} />
              : <Icon name="user" size={18} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="overline" style={{ marginBottom: 2 }}>
              Member · applies to all gifts
            </div>
            {member ? (
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{member}</div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                Search or leave blank for anonymous
              </div>
            )}
          </div>
          {locked
            ? <Icon name="edit" size={14} style={{ color: 'var(--muted-foreground)' }} />
            : <Icon name="chevronRight" size={16} style={{ color: 'var(--muted-foreground)' }} />}
        </button>
      )}

      <div style={{ height: 1, background: 'var(--border)', margin: '0 14px' }} />

      {/* DATE ROW (or inline picker) */}
      {showDatePicker ? (
        <RGDatePickerInline date={date} />
      ) : (
        <button className="press" style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          textAlign: 'left', padding: '12px 14px',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'var(--info-soft)', color: 'var(--info)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="calendar" size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="overline" style={{ marginBottom: 2 }}>Date received</div>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{date}</div>
          </div>
          {locked
            ? <Icon name="edit" size={14} style={{ color: 'var(--muted-foreground)' }} />
            : <Icon name="chevronRight" size={16} style={{ color: 'var(--muted-foreground)' }} />}
        </button>
      )}
    </Card>
  );
}

// ─── Inline member picker (typeahead dropdown, like the desktop) ──────
function RGMemberPickerInline({ query = '' }) {
  const matches = query
    ? RG_RECENT_MEMBERS.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
    : RG_RECENT_MEMBERS;
  return (
    <div style={{ padding: '12px 14px' }}>
      <div className="overline" style={{ marginBottom: 8 }}>
        Member · applies to all gifts
      </div>
      {/* Focused search input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        background: 'var(--card-2)',
        border: '1px solid var(--primary)',
        boxShadow: '0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent)',
        borderRadius: 12,
      }}>
        <Icon name="search" size={15} style={{ color: 'var(--muted-foreground)' }} />
        <div style={{ flex: 1, fontSize: 13.5, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 1 }}>
          {query
            ? <span>{query}</span>
            : <span style={{ color: 'var(--muted-foreground)' }}>Search or leave blank for anonymous</span>}
          <span style={{
            display: 'inline-block', width: 1, height: 15, background: 'var(--primary)',
            animation: 'caret 1s steps(2) infinite', marginLeft: 1,
          }} />
        </div>
        {query && (
          <button className="press" aria-label="Clear" style={{
            width: 20, height: 20, borderRadius: '50%',
            background: 'var(--muted)', color: 'var(--muted-foreground)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="x" size={10} />
          </button>
        )}
      </div>
      {/* Dropdown list (no header, no extra chrome — matches desktop) */}
      <div style={{
        marginTop: 8,
        display: 'flex', flexDirection: 'column',
      }}>
        {matches.map((m) => (
          <button key={m.name} className="press" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 4px', textAlign: 'left',
            borderRadius: 8,
          }}>
            <Avatar name={m.name} size={28} />
            <span style={{
              fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em',
              color: 'var(--foreground)',
            }}>
              {query ? <RGHighlightedName name={m.name} q={query} /> : m.name}
            </span>
          </button>
        ))}
        {matches.length === 0 && (
          <div style={{ padding: '10px 4px', fontSize: 12.5, color: 'var(--muted-foreground)' }}>
            No members match "{query}".
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inline date picker (calendar popover, like the desktop) ──────────
function RGDatePickerInline({ date = 'May 28, 2026' }) {
  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'var(--info-soft)', color: 'var(--info)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="calendar" size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="overline" style={{ marginBottom: 2 }}>Date received</div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--primary-soft-fg)' }}>
            {date}
          </div>
        </div>
        <Icon name="chevronUp" size={16} style={{ color: 'var(--muted-foreground)' }} />
      </div>
      {/* Calendar (no extra header/chips/footer — bare popover) */}
      <div style={{
        padding: 12, borderRadius: 12,
        background: 'var(--card-2)',
        border: '1px solid var(--border)',
      }}>
        <RGCalendar selectedDay={28} />
      </div>
    </div>
  );
}

// Compact one-line context display (used at the top of a drill-down)
function RGContextChip({ member = 'Anonymous', date = 'May 28, 2026', anonymous = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderRadius: 9999,
      background: 'var(--card-2)',
      border: '1px solid var(--border)',
      fontSize: 11.5, color: 'var(--muted-foreground)',
    }}>
      <Icon name="user" size={12} />
      <span style={{
        fontWeight: 600,
        color: anonymous ? 'var(--muted-foreground)' : 'var(--foreground)',
        fontStyle: anonymous ? 'italic' : 'normal',
      }}>{member}</span>
      <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'var(--muted-foreground)' }} />
      <Icon name="calendar" size={12} />
      <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{date}</span>
    </div>
  );
}

// ─── Staged-gift row (Hub list item) ───────────────────────────────────
function RGStagedRow({ gift, last }) {
  return (
    <React.Fragment>
      <div className="press" style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 14px',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <TypeBadge type={gift.type} />
            <div className="tabular" style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {formatCurrency(gift.amount)}
            </div>
          </div>
          <div style={{
            fontSize: 11.5, color: 'var(--muted-foreground)',
            display: 'flex', alignItems: 'center', gap: 6,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {gift.campaign ? (
              <>
                <Icon name="calendar" size={11} />
                <span style={{ color: 'var(--primary-soft-fg)' }}>{gift.campaign}</span>
              </>
            ) : (
              <span style={{ fontStyle: 'italic' }}>No campaign</span>
            )}
            {gift.pledge && (
              <>
                <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'var(--muted-foreground)' }} />
                <Icon name="link" size={11} />
                <span>pledge</span>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="press" aria-label="Edit gift" style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(255,255,255,0.04)', color: 'var(--muted-foreground)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="edit" size={14} />
          </button>
          <button className="press" aria-label="Remove gift" style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(239,111,106,0.10)', color: 'var(--danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>
      {!last && <div style={{ height: 1, background: 'var(--border)', margin: '0 14px' }} />}
    </React.Fragment>
  );
}

function RGEmptyState({ onAdd }) {
  return (
    <div style={{
      padding: '28px 18px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 10, textAlign: 'center',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 16,
        background: 'var(--primary-soft)', color: 'var(--primary-soft-fg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="gift" size={22} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>No gifts yet</div>
        <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', marginTop: 3, maxWidth: 240 }}>
          Add one or more gifts for this person and date. They'll all be recorded together.
        </div>
      </div>
    </div>
  );
}

// ─── Add-gift form (used in both Hub drill-down and Wizard step) ───────
function RGNewGiftForm({ amount = '2,500', type = 'Tithe', campaign, pledge, earmark }) {
  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Amount */}
      <div>
        <div className="overline" style={{ marginBottom: 8 }}>Amount</div>
        <div style={{
          padding: '22px 16px',
          background: 'var(--card-2)',
          borderRadius: 18,
          border: '1px solid var(--primary)',
          boxShadow: '0 0 0 4px color-mix(in srgb, var(--primary) 18%, transparent)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
          <div className="tabular" style={{
            display: 'flex', alignItems: 'baseline', gap: 4,
            fontSize: 44, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
          }}>
            <span style={{ color: 'var(--muted-foreground)' }}>₱</span>
            <span>{amount}</span>
            <span style={{ color: 'var(--muted-foreground)', fontSize: 22 }}>.00</span>
          </div>
        </div>
      </div>

      {/* Type */}
      <div>
        <div className="overline" style={{ marginBottom: 8 }}>Type</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {RG_TYPES.map((t) => {
            const sel = t === type;
            return (
              <button key={t} className="press" style={{
                padding: '8px 13px', borderRadius: 9999,
                background: sel ? 'var(--primary)' : 'var(--muted)',
                color: sel ? 'var(--primary-foreground)' : 'var(--foreground)',
                fontSize: 12.5, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                {sel && <Icon name="circleCheck" size={12} />}
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pledge */}
      <RGDropdownField
        label="Against pledge (optional)"
        value={pledge || "Don't link a pledge"}
        helper={pledge ? null : 'Linked automatically from member ↑'}
        active={!!pledge}
      />

      {/* Campaign */}
      <RGDropdownField
        label="Campaign (optional)"
        value={campaign || 'None'}
        active={!!campaign}
      />

      {/* Earmark */}
      <RGDropdownField
        label="Earmark (optional)"
        value={earmark || 'None'}
        active={!!earmark}
      />
    </div>
  );
}

function RGDropdownField({ label, value, helper, active }) {
  return (
    <div>
      <div className="overline" style={{ marginBottom: 8 }}>{label}</div>
      <button className="press" style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        textAlign: 'left', padding: '12px 14px',
        background: 'var(--card-2)',
        border: '1px solid var(--border)',
        borderRadius: 14,
      }}>
        <div style={{
          flex: 1, minWidth: 0,
          fontSize: 14, fontWeight: 600,
          color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
        }}>{value}</div>
        <Icon name="chevronDown" size={16} style={{ color: 'var(--muted-foreground)' }} />
      </button>
      {helper && (
        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 6, paddingLeft: 2 }}>{helper}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// VARIANT A — HUB & SPOKE
// ═══════════════════════════════════════════════════════════════════════

function RGHubSheet({ gifts = [], member, onClose, picker = null, query = '' }) {
  return (
    <Sheet fullHeight padding={0}>
      <RGHeader
        overline="NEW ENTRY"
        title="Record gifts"
        sub="Add one or many gifts for this member and date."
        onClose={onClose}
      />

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '0 16px 12px' }} className="no-scrollbar">
        {/* Context (member + date) */}
        <RGContextStrip member={member} picker={picker} query={query} />

        {/* Staged gifts list */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 20, marginBottom: 8, padding: '0 4px',
        }}>
          <div className="overline">Gifts in this entry</div>
          <div className="tabular" style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
            {gifts.length} gift{gifts.length === 1 ? '' : 's'}
          </div>
        </div>

        <Card padding={0} style={{ overflow: 'hidden' }}>
          {gifts.length === 0
            ? <RGEmptyState />
            : gifts.map((g, i) => (
                <RGStagedRow key={g.id} gift={g} last={i === gifts.length - 1} />
              ))
          }
        </Card>

        {/* Add gift CTA — primary FAB-like row that drills down */}
        <button className="press" style={{
          width: '100%', marginTop: 12,
          padding: '14px 16px',
          borderRadius: 14,
          background: gifts.length === 0
            ? 'var(--primary)' : 'var(--primary-soft)',
          color: gifts.length === 0
            ? 'var(--primary-foreground)' : 'var(--primary-soft-fg)',
          border: gifts.length === 0
            ? 'none' : '1px dashed color-mix(in srgb, var(--primary) 50%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
        }}>
          <Icon name="plus" size={16} />
          {gifts.length === 0 ? 'Add the first gift' : 'Add another gift'}
        </button>

        {gifts.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginTop: 16, padding: '10px 12px',
            background: 'var(--card-2)', borderRadius: 12,
            fontSize: 11, color: 'var(--muted-foreground)',
          }}>
            <Icon name="circleCheck" size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
            <span>Each gift inherits {member ? <strong style={{ color: 'var(--foreground)' }}>{member.split(' ')[0]}</strong> : 'the chosen member'} and {' '}
              <strong style={{ color: 'var(--foreground)' }}>May 28</strong>. Tap a gift to edit.</span>
          </div>
        )}
      </div>

      <RGFooter leading={<RGTotalLeader gifts={gifts} />}>
        <button className="press" style={{
          height: 44, padding: '0 16px', borderRadius: 12,
          background: 'transparent', color: 'var(--muted-foreground)',
          fontSize: 13.5, fontWeight: 600,
        }} onClick={onClose}>Cancel</button>
        <Button
          role="primary"
          recipe="filled"
          size="lg"
          style={{ opacity: gifts.length === 0 ? 0.45 : 1 }}
        >
          Record {gifts.length} gift{gifts.length === 1 ? '' : 's'}
        </Button>
      </RGFooter>
    </Sheet>
  );
}

// Drill-down "Add gift" — pushed on top of the Hub sheet.
function RGAddGiftDrillSheet({ member = 'Anonymous', anonymous = true, onBack }) {
  return (
    <Sheet fullHeight padding={0}>
      <RGHeader
        overline="ENTRY · NEW GIFT"
        title="Add gift"
        onBack={onBack}
        right={
          <button className="press" aria-label="Clear" style={{
            height: 32, padding: '0 12px', borderRadius: 9999,
            background: 'var(--muted)', color: 'var(--muted-foreground)',
            fontSize: 11.5, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            marginTop: 6,
          }}>
            <Icon name="refresh" size={12} /> Clear
          </button>
        }
      />

      {/* Inherited context — tiny chip so user always knows what this gift attaches to */}
      <div style={{ padding: '0 16px 14px' }}>
        <RGContextChip member={member} anonymous={anonymous} />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingBottom: 16 }} className="no-scrollbar">
        <RGNewGiftForm amount="2,500" type="Tithe" campaign="Easter Mission Trip" />
      </div>

      <RGFooter>
        <button className="press" onClick={onBack} style={{
          flex: 1, height: 44, borderRadius: 12,
          background: 'var(--muted)', color: 'var(--foreground)',
          fontSize: 13.5, fontWeight: 600,
        }}>Cancel</button>
        <Button role="primary" recipe="filled" size="lg" style={{ flex: 1.5 }}>
          Add gift · ₱2,500
        </Button>
      </RGFooter>
    </Sheet>
  );
}

// ─── Picker data + helpers (used by inline member/date pickers) ───────

const RG_RECENT_MEMBERS = [
  { name: 'Lyre Espinosa',     sub: '12 gifts · 1 open pledge' },
  { name: 'Jazel Saligan',     sub: '8 gifts · last 3d ago' },
  { name: 'Alyas Alas',        sub: '5 gifts · last 1w ago' },
  { name: 'Jeremiah Espinosa', sub: '14 gifts · last 2w ago' },
  { name: 'John Parker',       sub: '3 gifts · last 1mo ago' },
];

function RGHighlightedName({ name, q }) {
  if (!q) return name;
  const lower = name.toLowerCase();
  const ix = lower.indexOf(q.toLowerCase());
  if (ix < 0) return name;
  return (
    <span>
      {name.slice(0, ix)}
      <span style={{ background: 'rgba(91,84,240,0.25)', borderRadius: 3, padding: '0 2px' }}>
        {name.slice(ix, ix + q.length)}
      </span>
      {name.slice(ix + q.length)}
    </span>
  );
}

// ─── Calendar grid (used by inline date picker) ──────────────────────

function RGCalendar({ selectedDay = 28, month = 'May', year = 2026 }) {
  // Hand-laid May 2026 grid (Sun-start). Mirrors the desktop screenshot.
  const weeks = [
    [{ d: 26, dim: true }, { d: 27, dim: true }, { d: 28, dim: true }, { d: 29, dim: true }, { d: 30, dim: true }, { d: 1  }, { d: 2  }],
    [{ d: 3  }, { d: 4  }, { d: 5  }, { d: 6  }, { d: 7  }, { d: 8  }, { d: 9  }],
    [{ d: 10 }, { d: 11 }, { d: 12 }, { d: 13 }, { d: 14 }, { d: 15 }, { d: 16 }],
    [{ d: 17 }, { d: 18 }, { d: 19 }, { d: 20 }, { d: 21 }, { d: 22 }, { d: 23 }],
    [{ d: 24 }, { d: 25 }, { d: 26 }, { d: 27 }, { d: 28 }, { d: 29 }, { d: 30 }],
    [{ d: 31 }, { d: 1, dim: true }, { d: 2, dim: true }, { d: 3, dim: true }, { d: 4, dim: true }, { d: 5, dim: true }, { d: 6, dim: true }],
  ];
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <button className="press" aria-label="Previous month" style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--muted)', color: 'var(--foreground)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon name="chevronLeft" size={16} /></button>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>
          {month} {year}
        </div>
        <button className="press" aria-label="Next month" style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--muted)', color: 'var(--foreground)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon name="chevronRight" size={16} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {dayLabels.map((l, i) => (
          <div key={i} style={{
            textAlign: 'center', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.08em', color: 'var(--muted-foreground)',
            padding: '4px 0',
          }}>{l}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {weeks.flat().map((cell, i) => {
          const isSel = !cell.dim && cell.d === selectedDay;
          return (
            <button key={i} className="press" style={{
              height: 40, borderRadius: 10,
              background: isSel ? 'var(--primary)' : 'transparent',
              color: isSel ? 'var(--primary-foreground)'
                    : cell.dim ? 'rgba(145,152,168,0.4)' : 'var(--foreground)',
              fontSize: 13.5, fontWeight: isSel ? 800 : 600,
              fontVariantNumeric: 'tabular-nums',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {cell.d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Expose ───────────────────────────────────────────────────────────
Object.assign(window, {
  RG_STAGED_TWO,
  RGHubSheet,
  RGAddGiftDrillSheet,
  });
