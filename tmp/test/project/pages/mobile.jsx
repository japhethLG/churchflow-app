// ============ MOBILE PAGES ============
const S = window.SANCTUARY;

// ===== Mobile Shell =====
const MobileTopBar = ({ title, leading, trailing, sub }) => (
  <div style={{ padding: '12px 20px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {leading || (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: S.surfaceContainerLowest, display: 'grid', placeItems: 'center' }}>
            <svg width="18" height="14" viewBox="0 0 24 18" fill="none" stroke={S.onSurface} strokeWidth="2" strokeLinecap="round"><path d="M3 3h18M3 9h18M3 15h18"/></svg>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>{trailing}</div>
    </div>
    {sub && <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted, marginTop: 8 }}>{sub}</div>}
    {title && <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', color: S.onSurface, margin: 0, lineHeight: 1.15 }}>{title}</h1>}
  </div>
);

const MobileTabBar = ({ active, role = 'member' }) => {
  const items = role === 'admin' ? [
    { k: 'dashboard', i: 'home', l: 'Home' },
    { k: 'transactions', i: 'receipt', l: 'Gifts' },
    { k: 'members', i: 'users', l: 'Members' },
    { k: 'events', i: 'calendar', l: 'Events' },
    { k: 'more', i: 'dots', l: 'More' },
  ] : [
    { k: 'dashboard', i: 'home', l: 'Home' },
    { k: 'transactions', i: 'book', l: 'Giving' },
    { k: 'events', i: 'calendar', l: 'Events' },
    { k: 'profile', i: 'user', l: 'Profile' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: S.surfaceContainerLowest,
      padding: '10px 8px 28px',
      display: 'flex', justifyContent: 'space-around',
      borderTop: `1px solid ${S.surfaceContainer}`,
    }}>
      {items.map(it => (
        <div key={it.k} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          padding: '4px 10px', borderRadius: 12,
          color: active === it.k ? S.primary : S.onSurfaceMuted,
        }}>
          <Icon name={it.i} size={22} />
          <span style={{ fontSize: 10, fontWeight: 500 }}>{it.l}</span>
        </div>
      ))}
    </div>
  );
};

const MobilePage = ({ children, bg }) => (
  <div style={{
    width: '100%', height: '100%', overflow: 'hidden',
    background: bg || S.surface,
    fontFamily: 'Inter, system-ui, sans-serif', color: S.onSurface,
    position: 'relative', display: 'flex', flexDirection: 'column',
  }}>
    {children}
  </div>
);

// ===== 6.2 Mobile Login =====
const MobileLogin = () => (
  <MobilePage bg={`linear-gradient(160deg, ${S.primaryFixed} 0%, #FFFFFF 50%, ${S.tertiaryContainer} 110%)`}>
    <div style={{ padding: '60px 24px 0' }}>
      <Wordmark size="md" />
    </div>
    <div style={{ flex: 1, padding: '40px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {/* mini illustration */}
      <div style={{ width: 120, height: 120, margin: '0 auto 24px' }}>
        <JournalIllustration />
      </div>
      <div style={{ background: S.surfaceContainerLowest, borderRadius: 24, padding: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted, marginBottom: 10 }}>Sign in</div>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', margin: 0, lineHeight: 1.15 }}>Welcome back.</h1>
        <p style={{ fontSize: 14, color: S.onSurfaceVariant, marginTop: 10, lineHeight: 1.55 }}>
          Sign in to your church's dashboard.
        </p>
        <div style={{ marginTop: 24 }}>
          <Button variant="primary" size="lg" fullWidth icon="google">Continue with Google</Button>
        </div>
        <div style={{ fontSize: 11, color: S.onSurfaceMuted, marginTop: 16, lineHeight: 1.5, textAlign: 'center' }}>
          By continuing you agree to our <span style={{ textDecoration: 'underline' }}>Terms</span> and <span style={{ textDecoration: 'underline' }}>Privacy</span>.
        </div>
      </div>
    </div>
    <div style={{ padding: '20px 24px 40px', textAlign: 'center', fontSize: 11, color: S.onSurfaceMuted }}>
      Built for churches.
    </div>
  </MobilePage>
);

// ===== 6.3 Mobile Invite =====
const MobileInvite = () => (
  <MobilePage bg={`linear-gradient(160deg, ${S.primaryFixed} 0%, #FFFFFF 50%, ${S.tertiaryContainer} 110%)`}>
    <div style={{ padding: '60px 24px 20px' }}><Wordmark size="md" /></div>
    <div style={{ flex: 1, padding: '0 20px', display: 'flex', alignItems: 'center' }}>
      <div style={{ background: S.surfaceContainerLowest, borderRadius: 24, padding: 28, width: '100%' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.tertiary, marginBottom: 10 }}>Invitation</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', margin: 0, lineHeight: 1.2 }}>
          You've been invited to{' '}
          <span style={{ background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Grace Community</span>.
        </h1>
        <p style={{ fontSize: 14, color: S.onSurfaceVariant, marginTop: 12, lineHeight: 1.55 }}>
          Pastor David Obi invited you to join as a <strong style={{ color: S.onSurface }}>Member</strong>.
        </p>
        <div style={{ marginTop: 20, padding: 14, background: S.surfaceContainerLow, borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Avatar name="David Obi" size={32} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>David Obi</div>
            <div style={{ fontSize: 10, color: S.onSurfaceMuted }}>Pastor · Admin</div>
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <Button variant="primary" size="lg" fullWidth icon="google">Accept & Continue</Button>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: S.onSurfaceMuted, textAlign: 'center' }}>This wasn't meant for me</div>
      </div>
    </div>
  </MobilePage>
);

// ===== 7.2 Mobile Member Dashboard =====
const MobileMemberDashboard = () => (
  <MobilePage>
    <div style={{ flex: 1, overflow: 'auto', paddingBottom: 90 }}>
      <MobileTopBar
        sub="Welcome"
        title="Hello, Amara."
        leading={<Avatar name="Amara Okonkwo" size={36} />}
        trailing={<>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: S.surfaceContainerLowest, display: 'grid', placeItems: 'center', position: 'relative' }}>
            <Icon name="bell" size={16} />
            <span style={{ position: 'absolute', top: 8, right: 10, width: 7, height: 7, borderRadius: '50%', background: S.tertiary, border: `2px solid ${S.surfaceContainerLowest}` }} />
          </div>
        </>}
      />
      <div style={{ padding: '8px 20px 0', fontSize: 13, color: S.onSurfaceVariant, lineHeight: 1.5 }}>
        Here's a gentle summary of your giving and upcoming services at Grace Community.
      </div>

      {/* Hero stat: this month */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
          borderRadius: 20, padding: 22, color: '#fff',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>Your giving this month</div>
          <div style={{ fontSize: 42, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', marginTop: 8, lineHeight: 1 }}>$820.00</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8 }}>3 gifts recorded · April 2026</div>
        </div>
      </div>

      {/* secondary stats */}
      <div style={{ padding: '12px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card padding={16}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>This year</div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginTop: 8 }}>$6,240</div>
          <div style={{ fontSize: 10, color: S.onSurfaceMuted, marginTop: 4 }}>14 gifts</div>
        </Card>
        <Card padding={16}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>Most recent</div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginTop: 8 }}>$250</div>
          <div style={{ fontSize: 10, color: S.onSurfaceMuted, marginTop: 4 }}>Tithe · 3d ago</div>
        </Card>
      </div>

      {/* Recent giving */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>Recent giving</h3>
          <span style={{ fontSize: 12, color: S.primary, fontWeight: 500 }}>View all →</span>
        </div>
        <Card padding={6}>
          {[
            { date: 'Apr 21', type: 'Tithe', amount: '250.00' },
            { date: 'Apr 07', type: 'Offering', amount: '120.00' },
            { date: 'Mar 31', type: 'Mission', amount: '200.00' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < 2 ? `1px solid ${S.surfaceContainerLow}` : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.date}</div>
                <div style={{ marginTop: 4 }}><TypeBadge type={r.type} /></div>
              </div>
              <Amount value={r.amount} />
            </div>
          ))}
        </Card>
      </div>

      {/* Upcoming events */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>Upcoming at Grace</h3>
          <span style={{ fontSize: 12, color: S.primary, fontWeight: 500 }}>See all →</span>
        </div>
        <Card padding={6}>
          {[
            { day: '28', month: 'APR', title: 'Sunday Worship Service', loc: 'Main Sanctuary · 10am', type: 'Service', c: 'indigo' },
            { day: '05', month: 'MAY', title: 'Mission Sunday', loc: 'Main Sanctuary', type: 'Special', c: 'blue' },
          ].map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderBottom: i < 1 ? `1px solid ${S.surfaceContainerLow}` : 'none', alignItems: 'center' }}>
              <div style={{ width: 48, borderRadius: 10, background: S.surfaceContainerLow, padding: '8px 0', textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>{e.day}</div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', color: S.onSurfaceMuted, marginTop: 3 }}>{e.month}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>{e.title}</div>
                <div style={{ fontSize: 11, color: S.onSurfaceMuted, marginTop: 2 }}>{e.loc}</div>
                <div style={{ marginTop: 6 }}><Badge color={e.c}>{e.type}</Badge></div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Thank you clay banner */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ background: `linear-gradient(135deg, ${S.tertiaryContainer}, ${S.surfaceContainerLowest})`, borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 13, color: S.tertiary, fontStyle: 'italic', lineHeight: 1.5 }}>
            "Thank you for your faithful giving, Amara."
          </div>
        </div>
      </div>
    </div>
    <MobileTabBar active="dashboard" role="member" />
  </MobilePage>
);

// ===== 7.3 Mobile My Giving =====
const MobileMyGiving = () => (
  <MobilePage>
    <div style={{ flex: 1, overflow: 'auto', paddingBottom: 90 }}>
      <MobileTopBar sub="My Giving" title="Your giving." trailing={<div style={{ width: 36, height: 36, borderRadius: '50%', background: S.surfaceContainerLowest, display: 'grid', placeItems: 'center' }}><Icon name="filter" size={16} /></div>} />

      {/* Filter chips */}
      <div style={{ padding: '8px 20px 0', display: 'flex', gap: 6, overflow: 'auto', scrollbarWidth: 'none' }}>
        <Chip icon="calendar">This year</Chip>
        <Chip active>All types</Chip>
        <Chip>Tithe</Chip>
        <Chip>Offering</Chip>
        <Chip>Mission</Chip>
      </div>

      {/* Summary strip */}
      <div style={{ padding: '20px 20px 8px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>Total</div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>$6,240</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>Gifts</div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>14</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>Average</div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>$445</div>
        </div>
      </div>

      {/* Card list */}
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { date: 'Apr 21, 2026', type: 'Tithe', amount: '250.00', method: 'Bank transfer', ref: 'TXN-8821', event: 'Sunday Worship' },
          { date: 'Apr 07, 2026', type: 'Offering', amount: '120.00', method: 'Cash', ref: null, event: 'Sunday Worship' },
          { date: 'Mar 31, 2026', type: 'Mission', amount: '200.00', method: 'Bank transfer', ref: 'TXN-8712', event: 'Mission Sunday' },
          { date: 'Mar 17, 2026', type: 'Offering', amount: '100.00', method: 'Cash', ref: null, event: 'Sunday Worship' },
          { date: 'Mar 03, 2026', type: 'Tithe', amount: '250.00', method: 'Bank transfer', ref: 'TXN-8512', event: 'Sunday Worship' },
          { date: 'Feb 24, 2026', type: 'First Fruit', amount: '500.00', method: 'Check', ref: 'CHK-1402', event: null },
        ].map((r, i) => (
          <Card key={i} padding={14}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <TypeBadge type={r.type} />
                </div>
                <div style={{ fontSize: 12, color: S.onSurfaceMuted }}>{r.date} · {r.method}</div>
                {r.event && <div style={{ fontSize: 12, color: S.primary, marginTop: 4 }}>{r.event}</div>}
              </div>
              <Amount value={r.amount} />
            </div>
          </Card>
        ))}
      </div>
    </div>
    <MobileTabBar active="transactions" role="member" />
  </MobilePage>
);

// ===== 7.4 Mobile Transaction Detail (full-screen sheet) =====
const MobileTxnDetail = () => (
  <MobilePage>
    <div style={{ padding: '60px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: S.surfaceContainerLowest, display: 'grid', placeItems: 'center' }}>
        <Icon name="chevronLeft" size={18} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: S.onSurfaceMuted }}>Gift record</div>
      <div style={{ width: 36 }} />
    </div>

    <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 30px' }}>
      <div style={{ padding: '24px 20px', borderRadius: 20, background: `linear-gradient(135deg, ${S.primaryFixed}, ${S.surfaceContainerLow})`, textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>Apr 21, 2026</div>
        <div style={{ marginTop: 8 }}><TypeBadge type="Tithe" /></div>
        <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', marginTop: 14, background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          $250.00
        </div>
      </div>

      <Card padding={4}>
        {[
          ['Method', <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon name="bank" size={13} color={S.onSurfaceMuted} />Bank transfer</span>],
          ['Reference', <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>TXN-8821</span>],
          ['Event', <span style={{ color: S.primary, fontWeight: 500 }}>Sunday Worship · Apr 21</span>],
          ['Recorded by', <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Avatar name="Sarah Chen" size={20} />Sarah Chen</span>],
          ['Recorded on', 'Apr 21 · 2:14pm'],
        ].map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: i < 4 ? `1px solid ${S.surfaceContainerLow}` : 'none' }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>{k}</span>
            <span style={{ fontSize: 13 }}>{v}</span>
          </div>
        ))}
      </Card>

      <div style={{ marginTop: 16, padding: 16, background: S.surfaceContainerLow, borderRadius: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted, marginBottom: 6 }}>Note</div>
        <div style={{ fontSize: 13, color: S.onSurfaceVariant, fontStyle: 'italic', lineHeight: 1.6 }}>
          "End-of-month tithe for April. Thank you for faithfully serving Grace Community."
        </div>
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: S.onSurfaceMuted, textAlign: 'center', lineHeight: 1.5 }}>
        This is a private record between you and Grace Community.
      </div>
    </div>
  </MobilePage>
);

// ===== 7.5 Mobile Events =====
const MobileEvents = () => (
  <MobilePage>
    <div style={{ flex: 1, overflow: 'auto', paddingBottom: 90 }}>
      <MobileTopBar sub="Calendar" title="Events." />
      <div style={{ padding: '8px 20px 0', display: 'flex', gap: 6 }}>
        <Chip active>Upcoming</Chip><Chip>Past</Chip><Chip>All</Chip>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { day: '28', month: 'APR', title: 'Sunday Worship Service', loc: 'Main Sanctuary · 10:00am', type: 'Service', c: 'indigo', desc: 'Weekly gathering for worship, teaching, and communion.', recurring: true },
          { day: '05', month: 'MAY', title: 'Mission Sunday', loc: 'Main Sanctuary', type: 'Special', c: 'blue', desc: 'Special Sunday supporting our mission partners in Kenya.' },
          { day: '12', month: 'MAY', title: 'Annual Harvest Thanksgiving', loc: 'Fellowship Hall', type: 'Fundraiser', c: 'amber', desc: 'Our largest gathering of the year. Worship, a shared meal, and testimonies.' },
          { day: '19', month: 'MAY', title: 'Youth Overnight Retreat', loc: 'Grace Lake Camp', type: 'Special', c: 'blue', desc: 'A two-day retreat for youth ages 12–18.' },
        ].map((e, i) => (
          <Card key={i} padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: 14, background: S.surfaceContainerLow, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 56, borderRadius: 10, background: S.surfaceContainerLowest, padding: '8px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>{e.day}</div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', color: S.onSurfaceMuted, marginTop: 4 }}>{e.month}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge color={e.c}>{e.type}</Badge>
                {e.recurring && <Badge color="gray">Recurring</Badge>}
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{e.title}</div>
              <div style={{ fontSize: 11, color: S.onSurfaceMuted, marginTop: 4, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                <Icon name="location" size={11} color={S.onSurfaceMuted} />{e.loc}
              </div>
              <div style={{ fontSize: 12, color: S.onSurfaceVariant, marginTop: 8, lineHeight: 1.55 }}>{e.desc}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
    <MobileTabBar active="events" role="member" />
  </MobilePage>
);

// ===== 8.1 Mobile Admin Dashboard =====
const MobileAdminDashboard = () => (
  <MobilePage>
    <div style={{ flex: 1, overflow: 'auto', paddingBottom: 90 }}>
      <MobileTopBar
        sub="Overview · April 2026"
        title="Hi, Sarah."
        leading={<Avatar name="Sarah Chen" size={36} />}
        trailing={<div style={{ width: 36, height: 36, borderRadius: '50%', background: S.surfaceContainerLowest, display: 'grid', placeItems: 'center', position: 'relative' }}><Icon name="bell" size={16} /><span style={{ position: 'absolute', top: 8, right: 10, width: 7, height: 7, borderRadius: '50%', background: S.tertiary, border: `2px solid ${S.surfaceContainerLowest}` }} /></div>}
      />

      {/* Hero stat */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`, borderRadius: 20, padding: 22, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>Total this month</div>
            <span style={{ background: 'rgba(255,255,255,0.22)', padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 500 }}>▲ 12%</span>
          </div>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', marginTop: 8, lineHeight: 1 }}>$28,450</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 8 }}>142 gifts · vs $25,400 in March</div>
        </div>
      </div>

      {/* secondary stats */}
      <div style={{ padding: '10px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card padding={14}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>Members</div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 6 }}>234</div>
          <div style={{ fontSize: 10, color: S.onSurfaceMuted, marginTop: 4 }}>3 new</div>
        </Card>
        <Card padding={14}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>Events</div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 6 }}>6</div>
          <div style={{ fontSize: 10, color: S.onSurfaceMuted, marginTop: 4 }}>upcoming</div>
        </Card>
      </div>

      {/* Mini chart card */}
      <div style={{ padding: '14px 20px 0' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Monthly trend</h3>
            <span style={{ fontSize: 11, color: S.onSurfaceMuted }}>YTD</span>
          </div>
          <BarChart gradient height={120} data={[
            { label: 'Nov', v: 31 }, { label: 'Dec', v: 38 },
            { label: 'Jan', v: 27 }, { label: 'Feb', v: 24 },
            { label: 'Mar', v: 25 }, { label: 'Apr', v: 28, highlight: true },
          ]} />
        </Card>
      </div>

      {/* Recent gifts */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Recent gifts</h3>
          <span style={{ fontSize: 12, color: S.primary, fontWeight: 500 }}>View all →</span>
        </div>
        <Card padding={4}>
          {[
            { name: 'Amara Okonkwo', type: 'Tithe', amount: '250', date: 'Today, 2:14pm' },
            { name: 'Daniel Tan', type: 'Offering', amount: '100', date: 'Today, 10:42am' },
            { name: 'Maria Reyes', type: 'Mission', amount: '500', date: 'Yesterday' },
            { name: 'Anonymous', type: 'Offering', amount: '80', date: 'Yesterday', anon: true },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: i < 3 ? `1px solid ${S.surfaceContainerLow}` : 'none' }}>
              {r.anon
                ? <div style={{ width: 30, height: 30, borderRadius: '50%', background: S.surfaceContainer, display: 'grid', placeItems: 'center' }}><Icon name="user" size={13} color={S.onSurfaceMuted} /></div>
                : <Avatar name={r.name} size={30} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: r.anon ? S.onSurfaceMuted : S.onSurface, fontStyle: r.anon ? 'italic' : 'normal' }}>{r.name}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                  <TypeBadge type={r.type} />
                  <span style={{ fontSize: 10, color: S.onSurfaceMuted }}>{r.date}</span>
                </div>
              </div>
              <Amount value={r.amount} />
            </div>
          ))}
        </Card>
      </div>
    </div>

    {/* Floating record button */}
    <div style={{ position: 'absolute', right: 20, bottom: 100 }}>
      <button style={{
        width: 56, height: 56, borderRadius: '50%',
        background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
        border: 'none', color: '#fff', display: 'grid', placeItems: 'center',
        boxShadow: `0 12px 28px -6px ${S.primary}55`,
      }}><Icon name="plus" size={22} color="#fff" /></button>
    </div>

    <MobileTabBar active="dashboard" role="admin" />
  </MobilePage>
);

// ===== 8.10 Mobile Record Gift =====
const MobileRecordGift = () => (
  <MobilePage>
    <div style={{ padding: '60px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: S.surfaceContainerLowest, display: 'grid', placeItems: 'center' }}>
        <Icon name="x" size={16} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>Record a gift</div>
      <div style={{ fontSize: 13, color: S.primary, fontWeight: 600 }}>Save</div>
    </div>

    <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px 30px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Amount */}
      <div style={{ padding: '20px 18px', background: S.surfaceContainerLowest, borderRadius: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted, marginBottom: 8 }}>Amount</div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 24, fontWeight: 500, color: S.onSurfaceMuted }}>$</span>
          <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>250</span>
          <span style={{ fontSize: 24, fontWeight: 500, color: S.onSurfaceMuted }}>.00</span>
        </div>
      </div>

      {/* Type */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: S.onSurfaceVariant, marginBottom: 8 }}>Type</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['Tithe','Offering','Mission','First Fruit','Commitment','Other'].map((t,i) => (
            <Chip key={t} active={i===0}>{t}</Chip>
          ))}
        </div>
      </div>

      <Input label="Date" icon="calendar" value="Apr 23, 2026" />
      <Input label="Member" icon="user" value="Amara Okonkwo" suffix="▾" />
      <Input label="Event" icon="calendar" value="Sunday Worship · Apr 28" suffix="▾" />

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: S.onSurfaceVariant, marginBottom: 8 }}>Payment method</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          {[
            { i: 'cash', l: 'Cash' },
            { i: 'check_rect', l: 'Check' },
            { i: 'bank', l: 'Bank', active: true },
            { i: 'phone', l: 'Mobile' },
          ].map((m, i) => (
            <div key={i} style={{
              padding: '10px 4px', borderRadius: 12, textAlign: 'center',
              background: m.active ? S.primaryFixed : S.surfaceContainerLowest,
              color: m.active ? S.primary : S.onSurfaceVariant,
            }}>
              <div style={{ display: 'grid', placeItems: 'center', marginBottom: 4 }}><Icon name={m.i} size={16} /></div>
              <div style={{ fontSize: 11, fontWeight: 500 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      <Input label="Reference #" placeholder="Optional" />
    </div>

    <div style={{ padding: '14px 20px 30px', background: S.surfaceContainerLowest, borderTop: `1px solid ${S.surfaceContainer}` }}>
      <Button variant="primary" size="lg" fullWidth>Record gift</Button>
    </div>
  </MobilePage>
);

// ===== 8.2 Mobile Members =====
const MobileMembers = () => (
  <MobilePage>
    <div style={{ flex: 1, overflow: 'auto', paddingBottom: 90 }}>
      <MobileTopBar sub="Directory" title="Members." trailing={<div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`, display: 'grid', placeItems: 'center' }}><Icon name="plus" size={16} color="#fff" /></div>} />

      <div style={{ padding: '8px 20px 0' }}>
        <Input icon="search" placeholder="Search by name or email…" />
      </div>

      <div style={{ padding: '12px 20px 0', display: 'flex', gap: 6, overflow: 'auto' }}>
        <Chip active>All · 234</Chip>
        <Chip>Active · 189</Chip>
        <Chip>Temp · 45</Chip>
        <Chip>Inactive</Chip>
      </div>

      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { name: 'Amara Okonkwo', email: 'amara.ok@email.com', last: 'Apr 21', amt: '250', status: 'Active', linked: true },
          { name: 'Daniel Tan', email: 'd.tan@email.com', last: 'Apr 21', amt: '100', status: 'Active', linked: true },
          { name: 'Maria Reyes', email: null, last: 'Apr 20', amt: '500', status: 'Active', linked: false },
          { name: 'Josh Whitfield', email: 'josh.w@email.com', last: 'Apr 19', amt: '325', status: 'Active', linked: true },
          { name: 'Grace Adeyemi', email: 'grace.a@email.com', last: 'Apr 18', amt: '600', status: 'Active', linked: true },
          { name: 'Peter Nguyen', email: null, last: 'Apr 14', amt: '80', status: 'Active', linked: false },
          { name: 'Rebecca Park', email: 'r.park@email.com', last: 'Jan 12', amt: null, status: 'Inactive', linked: true },
        ].map((m, i) => (
          <Card key={i} padding={14}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Avatar name={m.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</span>
                  {!m.linked && <Badge color="clay">temp</Badge>}
                </div>
                <div style={{ fontSize: 12, color: S.onSurfaceMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.email || 'No email · Temp member'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {m.amt ? <Amount value={m.amt} /> : <span style={{ fontSize: 12, color: S.onSurfaceMuted }}>—</span>}
                <div style={{ fontSize: 11, color: S.onSurfaceMuted, marginTop: 2 }}>{m.last}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
    <MobileTabBar active="members" role="admin" />
  </MobilePage>
);

// ===== 8.8 Mobile Transactions (admin) =====
const MobileAdminTxn = () => (
  <MobilePage>
    <div style={{ flex: 1, overflow: 'auto', paddingBottom: 90 }}>
      <MobileTopBar sub="Ledger" title="Transactions." trailing={<div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`, display: 'grid', placeItems: 'center' }}><Icon name="plus" size={16} color="#fff" /></div>} />

      <div style={{ padding: '8px 20px 0' }}>
        <Input icon="search" placeholder="Member, note, ref #…" />
      </div>

      <div style={{ padding: '12px 20px 0', display: 'flex', gap: 6, overflow: 'auto' }}>
        <Chip icon="calendar">This month</Chip>
        <Chip icon="chevronDown">Type</Chip>
        <Chip icon="chevronDown">Method</Chip>
        <Chip icon="chevronDown">Event</Chip>
      </div>

      <div style={{ padding: '16px 20px 0', background: S.surface, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>Total</div>
          <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>$28,450</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>Gifts</div>
          <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>142</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>Average</div>
          <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>$200</div>
        </div>
      </div>

      <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { date: 'Apr 21', name: 'Amara Okonkwo', type: 'Tithe', amount: '250', method: 'Bank' },
          { date: 'Apr 21', name: 'Daniel Tan', type: 'Offering', amount: '100', method: 'Cash' },
          { date: 'Apr 20', name: 'Maria Reyes', type: 'Mission', amount: '500', method: 'Bank' },
          { date: 'Apr 20', name: 'Anonymous', type: 'Offering', amount: '80', method: 'Cash', anon: true },
          { date: 'Apr 19', name: 'Josh Whitfield', type: 'Tithe', amount: '325', method: 'Check' },
          { date: 'Apr 18', name: 'Grace Adeyemi', type: 'First Fruit', amount: '600', method: 'Bank' },
        ].map((r, i) => (
          <Card key={i} padding={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {r.anon
                ? <div style={{ width: 32, height: 32, borderRadius: '50%', background: S.surfaceContainer, display: 'grid', placeItems: 'center' }}><Icon name="user" size={13} color={S.onSurfaceMuted} /></div>
                : <Avatar name={r.name} size={32} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: r.anon ? S.onSurfaceMuted : S.onSurface, fontStyle: r.anon ? 'italic' : 'normal' }}>{r.name}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                  <TypeBadge type={r.type} />
                  <span style={{ fontSize: 10, color: S.onSurfaceMuted }}>{r.date} · {r.method}</span>
                </div>
              </div>
              <Amount value={r.amount} />
            </div>
          </Card>
        ))}
      </div>
    </div>
    <MobileTabBar active="transactions" role="admin" />
  </MobilePage>
);

// ===== 9.1 Mobile Super Admin Tenants =====
const MobileSuperTenants = () => (
  <MobilePage>
    <div style={{ flex: 1, overflow: 'auto', paddingBottom: 90 }}>
      <MobileTopBar sub="Platform" title="Churches." trailing={<div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`, display: 'grid', placeItems: 'center' }}><Icon name="plus" size={16} color="#fff" /></div>} />

      <div style={{ padding: '12px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card padding={14}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>Churches</div>
          <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>24</div>
        </Card>
        <Card padding={14}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>Members</div>
          <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>3,241</div>
        </Card>
      </div>

      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { name: 'Grace Community Church', sub: 'gracecommunity.org', members: 234, gifts: 142, total: '28,450', g1: S.primaryContainer, g2: S.primary, init: 'GC' },
          { name: 'Mount Zion Assembly', sub: 'mtzion.church', members: 412, gifts: 218, total: '₦1,840,000', g1: '#0D9488', g2: '#115E59', init: 'MZ' },
          { name: 'New Hope Fellowship', sub: 'newhope.org', members: 156, gifts: 89, total: '14,200', g1: '#9333EA', g2: '#5B21B6', init: 'NH' },
          { name: 'Lighthouse Baptist', sub: 'lighthousebaptist.org', members: 98, gifts: 64, total: '9,840', g1: '#D97706', g2: '#92400E', init: 'LB' },
          { name: 'River Bend Chapel', sub: 'No admins yet', members: 0, gifts: 0, total: null, g1: '#2563EB', g2: '#1E40AF', init: 'RB' },
        ].map((c, i) => (
          <Card key={i} padding={14}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${c.g1}, ${c.g2})`, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 600 }}>{c.init}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: S.onSurfaceMuted, marginTop: 2 }}>{c.sub}</div>
              </div>
              <Icon name="chevronRight" size={16} color={S.onSurfaceMuted} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${S.surfaceContainerLow}` }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>Members</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{c.members}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>Gifts (MTD)</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{c.gifts}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>Total</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{c.total ? (c.total.startsWith('₦') ? c.total : <Amount value={c.total} />) : '—'}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </MobilePage>
);

Object.assign(window, {
  MobileLogin, MobileInvite,
  MobileMemberDashboard, MobileMyGiving, MobileTxnDetail, MobileEvents,
  MobileAdminDashboard, MobileRecordGift, MobileMembers, MobileAdminTxn,
  MobileSuperTenants,
});
