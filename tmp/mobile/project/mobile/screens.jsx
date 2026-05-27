// ChurchFlow mobile screens — Dashboard + sheets/modals.
// Composes the primitives from components.jsx into the actual UI.

// ─── Top app bar ───────────────────────────────────────────────────────
function TopAppBar({ onSearch, onNotify, onAccount, unread = 3 }) {
  const t = CF_DATA.TENANT;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 16px 10px',
    }}>
      <button
        className="press"
        onClick={onAccount}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          flex: 1, minWidth: 0, textAlign: 'left',
          padding: '4px 6px 4px 0',
          borderRadius: 12,
        }}
        aria-label="Account · switch church"
      >
        <Avatar name={t.short} color={t.brand} size={36} square />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{
              fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{t.name}</span>
            <Icon name="chevronDown" size={14} style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Admin</span>
            <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'var(--muted-foreground)' }} />
            <span>{t.city}</span>
          </div>
        </div>
      </button>
      <button
        className="press"
        onClick={onSearch}
        style={{
          width: 38, height: 38, borderRadius: 12,
          background: 'var(--muted)', color: 'var(--foreground)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Search"
      >
        <Icon name="search" size={18} />
      </button>
      <button
        className="press"
        onClick={onNotify}
        style={{
          position: 'relative',
          width: 38, height: 38, borderRadius: 12,
          background: 'var(--muted)', color: 'var(--foreground)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Notifications"
      >
        <Icon name="bell" size={18} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 7, right: 7,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--danger)',
            boxShadow: '0 0 0 2px var(--card)',
          }} />
        )}
      </button>
    </div>
  );
}

// ─── Greeting block (replaces PageHeader.title) ───────────────────────
function Greeting({ name = CF_DATA.USER.firstName }) {
  return (
    <div style={{ padding: '4px 18px 18px' }}>
      <div className="overline" style={{ marginBottom: 6 }}>
        ACT · Wednesday, May 28
      </div>
      <h1 style={{
        fontSize: 30, fontWeight: 800,
        letterSpacing: '-0.03em', lineHeight: 1.05,
      }}>
        Good morning,<br/>{name}.
      </h1>
      <div style={{
        fontSize: 13, color: 'var(--muted-foreground)',
        marginTop: 8, lineHeight: 1.4,
      }}>
        What needs your attention this week.
      </div>
    </div>
  );
}

// ─── Stat strip (horizontal-scroll cards, hero + 3 smaller) ────────────
function StatStrip() {
  const [hero, ...rest] = CF_DATA.STAT_STRIP;
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <Card padding={18} style={{
        marginBottom: 12,
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 14%, var(--card)) 0%, var(--card) 60%)',
        border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 10,
              background: 'var(--primary)', color: 'var(--primary-foreground)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="receipt" size={16} />
            </div>
            <span className="overline" style={{ color: 'var(--primary-soft-fg)' }}>
              {hero.label}
            </span>
          </div>
          {hero.delta && (
            <Badge color="green">
              <Icon name="trendingUp" size={11} style={{ marginRight: -2 }} />
              {hero.delta}
            </Badge>
          )}
        </div>
        <div className="tabular" style={{
          fontSize: 40, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1,
          background: 'linear-gradient(135deg, #fff 0%, var(--primary-soft-fg) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 6,
        }}>
          {hero.value}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{hero.caption}</div>
      </Card>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
      }}>
        {rest.map((s, i) => (
          <Card key={i} padding={12} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                background: 'var(--primary-soft)', color: 'var(--primary-soft-fg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={s.icon} size={12} />
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
                {s.label}
              </span>
            </div>
            <div className="tabular" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {s.value}
            </div>
            {s.caption && (
              <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 5, lineHeight: 1.3 }}>
                {s.caption}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Unattributed callout (compressed for mobile) ──────────────────────
function UnattributedCallout() {
  const u = CF_DATA.UNATTRIBUTED;
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <Card padding={14} style={{
        background: 'color-mix(in srgb, var(--warning) 8%, var(--card))',
        border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'color-mix(in srgb, var(--warning) 18%, transparent)',
            color: 'var(--warning)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="triangleAlert" size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>
              {u.anonymousCount} anonymous · {u.noCampaignCount} no-campaign
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', marginTop: 2, lineHeight: 1.4 }}>
              {formatCompact(u.anonymousTotal + u.noCampaignTotal)} this week needs attribution.
            </div>
            <button className="press" style={{
              marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11.5, fontWeight: 700, color: 'var(--primary-soft-fg)',
            }}>
              Review <Icon name="arrowRight" size={12} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Outstanding pledges card ──────────────────────────────────────────
function OutstandingPledgesCard({ limit = 4 }) {
  const items = CF_DATA.URGENT_PLEDGES.slice(0, limit);
  const totalRemaining = CF_DATA.URGENT_PLEDGES.reduce((s, p) => s + p.remaining, 0);
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <Card padding={16}>
        <SectionTitle
          title="Outstanding pledges"
          action={
            <button className="press" style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 700, color: 'var(--primary-soft-fg)',
            }}>See all <Icon name="arrowRight" size={12} /></button>
          }
        />
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 14, marginTop: -4 }}>
          Past due, due-soon, or near-deadline. <strong style={{ color: 'var(--foreground)' }}>{formatCompact(totalRemaining)}</strong> owed.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map((p) => {
            const lifecycleBadge =
              p.lifecycle === 'past-due' ? { color: 'red',   label: `Past due · ${Math.abs(p.daysUntil)}d ago` }
            : p.lifecycle === 'due-soon' ? { color: 'amber', label: `Due soon · in ${p.daysUntil}d` }
            :                              { color: 'neutral', label: `On track · in ${p.daysUntil}d` };
            return (
              <div key={p.id} style={{ display: 'flex', gap: 10 }}>
                <Avatar name={p.member} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}>{p.member}</div>
                    <div className="tabular" style={{ fontSize: 13, fontWeight: 700 }}>
                      {formatCompact(p.remaining)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6, marginTop: 1 }}>
                    <div style={{
                      fontSize: 11, color: 'var(--muted-foreground)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                    }}>{p.campaign}</div>
                    <div className="tabular" style={{ fontSize: 10.5, color: 'var(--muted-foreground)' }}>
                      {formatCompact(p.paid)} / {formatCompact(p.pledged)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <div style={{ flex: 1 }}>
                      <ProgressBar value={p.paid} max={p.pledged} size="xs" />
                    </div>
                    <Badge color={lifecycleBadge.color}>{lifecycleBadge.label}</Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 12,
          paddingTop: 12, marginTop: 14,
          borderTop: '1px solid var(--border)',
          fontSize: 10, color: 'var(--muted-foreground)',
        }}>
          {[
            { c: 'var(--danger)', l: 'Past due' },
            { c: 'var(--warning)', l: 'Due soon' },
            { c: 'var(--primary)', l: 'On track' },
          ].map((x) => (
            <span key={x.l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: x.c }} />
              {x.l}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Campaigns near deadline ───────────────────────────────────────────
function CampaignsNearDeadline() {
  const items = CF_DATA.URGENT_CAMPAIGNS;
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <Card padding={16}>
        <SectionTitle
          title="Campaigns near deadline"
          action={
            <button className="press" style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 700, color: 'var(--primary-soft-fg)',
            }}>See all <Icon name="arrowRight" size={12} /></button>
          }
        />
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 14, marginTop: -4 }}>
          Active campaigns with ≤30 days remaining.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((c) => {
            const pct = Math.round((c.raised / c.goal) * 100);
            const badge = c.daysUntil < 0
              ? { color: 'red',   label: `${Math.abs(c.daysUntil)}d past due` }
              : c.daysUntil <= 7
                ? { color: 'amber', label: `${c.daysUntil}d left` }
                : { color: 'neutral', label: `${c.daysUntil}d left` };
            return (
              <div key={c.id}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    minWidth: 0,
                  }}>{c.title}</div>
                  <Badge color={badge.color}>{badge.label}</Badge>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 3 }}>
                  {formatCompact(c.raised)} / {formatCompact(c.goal)} ·{' '}
                  <strong style={{ color: 'var(--foreground)' }}>{pct}%</strong>
                </div>
                <div style={{ marginTop: 8 }}>
                  <ProgressBar size="xs" max={c.goal} segments={[
                    { value: c.pledged, color: 'color-mix(in srgb, var(--chart-current) 35%, transparent)' },
                    { value: c.raised,  color: 'var(--chart-current)' },
                  ]} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── Recent gifts (mobile list, not table) ─────────────────────────────
function RecentGifts({ limit = 6 }) {
  const items = CF_DATA.RECENT_GIFTS.slice(0, limit);
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <SectionTitle
        title="Recent gifts"
        action={
          <button className="press" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 700, color: 'var(--primary-soft-fg)',
          }}>View all <Icon name="arrowRight" size={12} /></button>
        }
      />
      <Card padding={6}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((t, i) => (
            <div key={t.id}>
              <div className="press" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px',
              }}>
                <Avatar name={t.member === 'Anonymous' ? '?' : t.member} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                      color: t.member === 'Anonymous' ? 'var(--muted-foreground)' : 'var(--foreground)',
                      fontStyle: t.member === 'Anonymous' ? 'italic' : 'normal',
                    }}>{t.member}</div>
                    <div className="tabular" style={{ fontSize: 13, fontWeight: 700 }}>
                      {formatCompact(t.amount)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <TypeBadge type={t.type} />
                    {t.campaign
                      ? <span style={{
                          fontSize: 11, color: 'var(--primary-soft-fg)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                        }}>{t.campaign}</span>
                      : <span style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--warning-soft-fg)' }}>No campaign</span>
                    }
                    <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                      {t.when}
                    </span>
                  </div>
                </div>
              </div>
              {i < items.length - 1 && (
                <div style={{ height: 1, background: 'var(--border)', margin: '0 10px' }} />
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Full dashboard composition ────────────────────────────────────────
function DashboardScreen({ onSearch, onNotify }) {
  return (
    <div style={{ paddingTop: 50 /* status bar */, paddingBottom: 110 /* tab bar */ }}>
      <TopAppBar onSearch={onSearch} onNotify={onNotify} />
      <Greeting />
      <StatStrip />
      <UnattributedCallout />
      <OutstandingPledgesCard />
      <CampaignsNearDeadline />
      <RecentGifts />
      <div style={{ height: 12 }} />
    </div>
  );
}

// ─── More sheet ────────────────────────────────────────────────────────
// Nav overflow ONLY. Account / switch-tenant / sign-out moved out to
// AccountSheet (triggered from the church identity in the top app bar) so
// the two concerns don't fight for the same surface. Mirrors how Slack /
// Notion / Linear separate workspace-account from app navigation.
function MoreSheet({ onClose }) {
  const PRIMARY = MORE_ITEMS.filter((m) => ['transactions', 'reports', 'invitations'].includes(m.id));
  const ACCOUNT_NAV = MORE_ITEMS.filter((m) => ['profile', 'settings'].includes(m.id));
  return (
    <Sheet height={520} padding={0}>
      <div style={{ padding: '4px 18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '6px 0' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>More</h2>
            <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', marginTop: 2 }}>
              Other places to go in this church.
            </div>
          </div>
          <button className="press" onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--muted)', color: 'var(--muted-foreground)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Close"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="overline" style={{ marginBottom: 10, paddingLeft: 4 }}>Manage</div>
        <Card padding={4} style={{ marginBottom: 18 }}>
          {PRIMARY.map((m, i) => (
            <React.Fragment key={m.id}>
              <ListRow
                leading={
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `color-mix(in srgb, ${m.color} 15%, transparent)`,
                    color: m.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={m.icon} size={18} />
                  </div>
                }
                title={m.label}
                subtitle={m.sub}
                trailing={<Icon name="chevronRight" size={16} style={{ color: 'var(--muted-foreground)' }} />}
              />
              {i < PRIMARY.length - 1 && (
                <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />
              )}
            </React.Fragment>
          ))}
        </Card>

        <div className="overline" style={{ marginBottom: 10, paddingLeft: 4 }}>Account</div>
        <Card padding={4}>
          {ACCOUNT_NAV.map((m, i) => (
            <React.Fragment key={m.id}>
              <ListRow
                leading={
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `color-mix(in srgb, ${m.color} 15%, transparent)`,
                    color: m.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={m.icon} size={18} />
                  </div>
                }
                title={m.label}
                subtitle={m.sub}
                trailing={<Icon name="chevronRight" size={16} style={{ color: 'var(--muted-foreground)' }} />}
              />
              {i < ACCOUNT_NAV.length - 1 && (
                <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />
              )}
            </React.Fragment>
          ))}
        </Card>

        <div style={{
          marginTop: 16, padding: '12px 14px',
          background: 'var(--card-2)', borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 11.5, color: 'var(--muted-foreground)',
        }}>
          <Icon name="user" size={14} />
          <span>Switch church, theme, or sign out — tap your church up top.</span>
        </div>
      </div>
    </Sheet>
  );
}

// ─── Account sheet (triggered by tapping the church identity / avatar
//     in the top app bar — mirrors AccountMenu.tsx from the desktop) ─────
function AccountSheet({ onClose }) {
  const u = CF_DATA.USER;
  const t = CF_DATA.TENANT;
  return (
    <Sheet height={620} padding={0}>
      <div style={{ padding: '4px 18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '6px 0' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Account</h2>
          <button className="press" onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--muted)', color: 'var(--muted-foreground)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Close"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Identity card */}
        <Card padding={14} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={u.fullName} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{u.fullName}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{u.email}</div>
            </div>
            <Badge color="indigo">{u.role}</Badge>
          </div>
        </Card>

        <div className="overline" style={{ marginBottom: 10, paddingLeft: 4 }}>Current church</div>
        <Card padding={14} style={{
          marginBottom: 18,
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 14%, var(--card)) 0%, var(--card) 70%)',
          border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={t.short} color={t.brand} size={40} square />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>{t.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>
                {t.city} · Admin context
              </div>
            </div>
            <Icon name="circleCheck" size={18} style={{ color: 'var(--primary)' }} />
          </div>
        </Card>

        <div className="overline" style={{ marginBottom: 10, paddingLeft: 4 }}>Switch context</div>
        <Card padding={4} style={{ marginBottom: 18 }}>
          <ListRow
            leading={
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(106,169,240,0.18)', color: 'var(--info)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name="layers" size={18} /></div>
            }
            title="Platform"
            subtitle="Super-admin · 12 churches"
            trailing={<Icon name="chevronRight" size={16} style={{ color: 'var(--muted-foreground)' }} />}
          />
          <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />
          <ListRow
            leading={
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(94,234,212,0.16)', color: '#5eead4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name="user" size={18} /></div>
            }
            title="View as Member"
            subtitle="Grace Fellowship"
            trailing={<Icon name="chevronRight" size={16} style={{ color: 'var(--muted-foreground)' }} />}
          />
          <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />
          <ListRow
            leading={
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(245,183,79,0.16)', color: 'var(--warning)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name="plus" size={18} /></div>
            }
            title="Join another church"
            subtitle="Use an invite link"
            trailing={<Icon name="chevronRight" size={16} style={{ color: 'var(--muted-foreground)' }} />}
          />
        </Card>

        <div className="overline" style={{ marginBottom: 10, paddingLeft: 4 }}>Sign out</div>
        <Card padding={4}>
          <ListRow
            leading={
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,255,255,0.04)', color: 'var(--muted-foreground)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name="shield" size={18} /></div>
            }
            title="Sign out of all devices"
            subtitle="Revoke every active session"
            trailing={<Icon name="chevronRight" size={16} style={{ color: 'var(--muted-foreground)' }} />}
          />
          <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />
          <ListRow
            leading={
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--danger-soft)', color: 'var(--danger)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name="logout" size={18} /></div>
            }
            title={<span style={{ color: 'var(--danger)' }}>Sign out</span>}
            subtitle="Only this device"
            trailing={<Icon name="chevronRight" size={16} style={{ color: 'var(--danger)' }} />}
          />
        </Card>
      </div>
    </Sheet>
  );
}

// ─── Record gift sheet ─────────────────────────────────────────────────
function RecordGiftSheet({ onClose }) {
  const TYPES = ['Tithe', 'Offering', 'Mission', 'First Fruit', 'Commitment', 'Donation'];
  const [type, setType] = React.useState('Tithe');
  return (
    <Sheet height={620} padding={0}>
      <div style={{ padding: '4px 18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, padding: '8px 0' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Record a gift</h2>
          <button className="press" onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--muted)', color: 'var(--muted-foreground)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Close"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Amount */}
        <div style={{
          padding: '22px 16px',
          background: 'var(--card-2)',
          borderRadius: 18,
          marginBottom: 14,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
          <div className="overline">Amount</div>
          <div className="tabular" style={{
            display: 'flex', alignItems: 'baseline', gap: 4,
            fontSize: 44, fontWeight: 800, letterSpacing: '-0.04em',
          }}>
            <span style={{ color: 'var(--muted-foreground)' }}>₱</span>
            <span>2,500</span>
            <span style={{ color: 'var(--muted-foreground)', fontSize: 22 }}>.00</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {['500', '1,000', '2,500', '5,000'].map((v) => (
              <span key={v} className="press" style={{
                padding: '5px 10px', borderRadius: 9999,
                background: v === '2,500' ? 'var(--primary-soft)' : 'rgba(255,255,255,0.04)',
                color: v === '2,500' ? 'var(--primary-soft-fg)' : 'var(--muted-foreground)',
                fontSize: 11, fontWeight: 600,
              }}>₱{v}</span>
            ))}
          </div>
        </div>

        {/* Type pills */}
        <div className="overline" style={{ marginBottom: 8 }}>Type</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
          {TYPES.map((t) => {
            const sel = t === type;
            return (
              <button key={t} onClick={() => setType(t)} className="press"
                style={{
                  padding: '7px 12px', borderRadius: 9999,
                  background: sel ? 'var(--primary)' : 'var(--muted)',
                  color: sel ? 'var(--primary-foreground)' : 'var(--foreground)',
                  fontSize: 12, fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}>
                {sel && <Icon name="circleCheck" size={12} />}
                {t}
              </button>
            );
          })}
        </div>

        {/* Member */}
        <div className="overline" style={{ marginBottom: 8 }}>Member</div>
        <button className="press" style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
          padding: 12, background: 'var(--card-2)', borderRadius: 14, marginBottom: 14,
        }}>
          <Avatar name="Lyre Espinosa" size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Lyre Espinosa</div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>lyre@grace.org · 12 gifts</div>
          </div>
          <Icon name="chevronRight" size={16} style={{ color: 'var(--muted-foreground)' }} />
        </button>

        {/* Campaign */}
        <div className="overline" style={{ marginBottom: 8 }}>Campaign</div>
        <button className="press" style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
          padding: 12, background: 'var(--card-2)', borderRadius: 14, marginBottom: 22,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--primary-soft)', color: 'var(--primary-soft-fg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="calendar" size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Easter Mission Trip</div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>67% to goal · 2d past deadline</div>
          </div>
          <Icon name="chevronRight" size={16} style={{ color: 'var(--muted-foreground)' }} />
        </button>

        <Button role="primary" recipe="filled" fullWidth size="lg">
          Record gift · ₱2,500
        </Button>
        <button onClick={onClose} className="press" style={{
          marginTop: 10, width: '100%', height: 40,
          fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)',
        }}>
          Cancel
        </button>
      </div>
    </Sheet>
  );
}

// ─── Notifications sheet ───────────────────────────────────────────────
function NotificationsSheet({ onClose }) {
  return (
    <Sheet height={620} padding={0}>
      <div style={{ padding: '4px 18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '8px 0' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Notifications</h2>
            <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', marginTop: 2 }}>3 unread · last 7 days</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="press" style={{
              padding: '0 10px', height: 32, borderRadius: 9999,
              background: 'var(--muted)', fontSize: 11.5, fontWeight: 600,
              color: 'var(--foreground)',
            }}>Mark all read</button>
            <button className="press" onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--muted)', color: 'var(--muted-foreground)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Close"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {['All', 'Pledges', 'Gifts', 'Members'].map((f, i) => (
            <span key={f} className="press" style={{
              padding: '6px 12px', borderRadius: 9999,
              background: i === 0 ? 'var(--primary-soft)' : 'rgba(255,255,255,0.04)',
              color: i === 0 ? 'var(--primary-soft-fg)' : 'var(--muted-foreground)',
              fontSize: 11.5, fontWeight: 600,
            }}>{f}</span>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {CF_DATA.NOTIFICATIONS.map((n) => {
            const tone = BADGE_FG[n.tone] || { bg: 'var(--muted)', fg: 'var(--foreground)' };
            return (
              <div key={n.id} className="press" style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 6px', borderRadius: 12,
                background: n.unread ? 'rgba(91,84,240,0.04)' : 'transparent',
                position: 'relative',
              }}>
                {n.unread && (
                  <div style={{
                    position: 'absolute', left: -2, top: 20,
                    width: 4, height: 4, borderRadius: '50%',
                    background: 'var(--primary)',
                  }} />
                )}
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: tone.bg, color: tone.fg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon name={n.icon} size={17} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>{n.title}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)', whiteSpace: 'nowrap', flexShrink: 0 }}>{n.when}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2, lineHeight: 1.4 }}>
                    {n.body}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

const BADGE_FG = {
  green:  { bg: 'var(--success-soft)', fg: 'var(--success)' },
  amber:  { bg: 'var(--warning-soft)', fg: 'var(--warning)' },
  indigo: { bg: 'var(--primary-soft)', fg: 'var(--primary)' },
  blue:   { bg: 'var(--info-soft)',    fg: 'var(--info)' },
  red:    { bg: 'var(--danger-soft)',  fg: 'var(--danger)' },
};

// ─── Search overlay (full-screen command-palette style) ────────────────
function SearchOverlay({ onClose }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(11,13,17,0.92)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      zIndex: 60, display: 'flex', flexDirection: 'column',
      paddingTop: 56,
    }}>
      <div style={{ padding: '0 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 16,
          background: 'var(--card)',
          border: '1px solid var(--border)',
        }}>
          <Icon name="search" size={18} style={{ color: 'var(--muted-foreground)' }} />
          <div style={{
            flex: 1, fontSize: 15, color: 'var(--foreground)',
            display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <span>Lyre</span>
            <span style={{
              display: 'inline-block', width: 1, height: 16, background: 'var(--primary)',
              animation: 'caret 1s steps(2) infinite',
            }} />
          </div>
          <button className="press" onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--muted)', color: 'var(--muted-foreground)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 32px' }} className="no-scrollbar">
        <div className="overline" style={{ marginBottom: 10, paddingLeft: 4 }}>Matches</div>
        <Card padding={4} style={{ marginBottom: 18 }}>
          <ListRow
            leading={<Avatar name="Lyre Espinosa" size={36} />}
            title={<span><span style={{ background: 'rgba(91,84,240,0.25)', borderRadius: 3, padding: '0 2px' }}>Lyre</span> Espinosa</span>}
            subtitle="Member · 12 gifts · ₱34.2k lifetime"
            trailing={<Icon name="chevronRight" size={16} style={{ color: 'var(--muted-foreground)' }} />}
          />
          <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />
          <ListRow
            leading={
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--info-soft)', color: 'var(--info)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="receipt" size={18} />
              </div>
            }
            title={<span><span style={{ background: 'rgba(91,84,240,0.25)', borderRadius: 3, padding: '0 2px' }}>Lyre</span> · Tithe · ₱2,500</span>}
            subtitle="Today, 9:42am · Easter Mission Trip"
            trailing={<Icon name="chevronRight" size={16} style={{ color: 'var(--muted-foreground)' }} />}
          />
          <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />
          <ListRow
            leading={
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--success-soft)', color: 'var(--success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="book" size={18} />
              </div>
            }
            title={<span>Pledge · <span style={{ background: 'rgba(91,84,240,0.25)', borderRadius: 3, padding: '0 2px' }}>Lyre</span> · ₱12,000</span>}
            subtitle="Easter Mission Trip · ₱8k remaining · 2d past due"
            trailing={<Icon name="chevronRight" size={16} style={{ color: 'var(--muted-foreground)' }} />}
          />
        </Card>

        <div className="overline" style={{ marginBottom: 10, paddingLeft: 4 }}>Quick actions</div>
        <Card padding={4}>
          {CF_DATA.SEARCH_QUICK.map((q, i) => (
            <React.Fragment key={q.label}>
              <ListRow
                leading={
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'var(--primary-soft)', color: 'var(--primary-soft-fg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={q.icon} size={18} />
                  </div>
                }
                title={q.label}
                trailing={
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    padding: '4px 8px', borderRadius: 6,
                    background: 'var(--muted)', color: 'var(--muted-foreground)',
                    fontFamily: 'var(--font-mono)',
                  }}>{q.shortcut}</span>
                }
              />
              {i < CF_DATA.SEARCH_QUICK.length - 1 && (
                <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />
              )}
            </React.Fragment>
          ))}
        </Card>
      </div>
      <style>{`@keyframes caret { 0%, 50% { opacity: 1 } 51%, 100% { opacity: 0 } }`}</style>
    </div>
  );
}

Object.assign(window, {
  TopAppBar, Greeting, StatStrip, UnattributedCallout,
  OutstandingPledgesCard, CampaignsNearDeadline, RecentGifts,
  DashboardScreen, MoreSheet, AccountSheet,
  RecordGiftSheet, NotificationsSheet, SearchOverlay,
});
