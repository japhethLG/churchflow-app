// ============ MEMBER PAGES ============
const S = window.SANCTUARY;

// 7.2 Member Dashboard
const MemberDashboard = () => (
  <AppShell role="member" active="dashboard" breadcrumb="Dashboard" churchName="Grace Community" userName="Amara Okonkwo">
    <div style={{ height: '100%', overflow: 'auto', paddingRight: 8 }}>
      <PageHeader
        overline="Welcome"
        title="Hello, Amara."
        subtitle="Here's a gentle summary of your giving and upcoming services at Grace Community Church."
      />

      {/* Row 1: 3 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Your giving this month" value={<Amount value="820.00" size="display" gradient />} caption="3 gifts recorded" />
        <StatCard label="Your giving this year" value={<Amount value="6,240.00" size="display" />} caption="Fiscal year started January" />
        <StatCard
          label="Most recent gift"
          value={<Amount value="250.00" size="display" />}
          caption={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><TypeBadge type="Tithe" /> 3 days ago</span>}
        />
      </div>

      {/* Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Recent giving */}
        <Card>
          <SectionTitle title="Recent giving" action={<span style={{ fontSize: 13, color: S.primary, fontWeight: 500, cursor: 'pointer' }}>View all my giving →</span>} />
          <div>
            {[
              { date: 'Apr 21', type: 'Tithe', amount: '250.00', method: 'Bank transfer' },
              { date: 'Apr 07', type: 'Offering', amount: '120.00', method: 'Cash' },
              { date: 'Mar 31', type: 'Mission', amount: '200.00', method: 'Bank transfer' },
              { date: 'Mar 17', type: 'Offering', amount: '100.00', method: 'Cash' },
              { date: 'Mar 03', type: 'Tithe', amount: '250.00', method: 'Bank transfer' },
            ].map((r, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '70px 110px 1fr auto', gap: 16, alignItems: 'center',
                padding: '14px 12px', borderRadius: 10,
                background: i === 0 ? S.surfaceContainerLow : 'transparent',
              }}>
                <div style={{ fontSize: 13, color: S.onSurfaceMuted, fontVariantNumeric: 'tabular-nums' }}>{r.date}</div>
                <TypeBadge type={r.type} />
                <div style={{ fontSize: 13, color: S.onSurfaceMuted }}>{r.method}</div>
                <Amount value={r.amount} />
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming events */}
        <Card>
          <SectionTitle title="Upcoming at Grace" action={<span style={{ fontSize: 13, color: S.primary, fontWeight: 500, cursor: 'pointer' }}>See all →</span>} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { day: '28', month: 'APR', title: 'Sunday Worship Service', loc: 'Main Sanctuary · 10:00am', type: 'Service', c: 'indigo' },
              { day: '05', month: 'MAY', title: 'Mission Sunday', loc: 'Main Sanctuary', type: 'Special', c: 'blue' },
              { day: '12', month: 'MAY', title: 'Annual Harvest Thanksgiving', loc: 'Fellowship Hall', type: 'Fundraiser', c: 'amber' },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: 12, background: S.surfaceContainerLow, borderRadius: 12 }}>
                <div style={{
                  width: 58, flexShrink: 0, borderRadius: 10, background: S.surfaceContainerLowest,
                  padding: '8px 0', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: S.onSurface, lineHeight: 1 }}>{e.day}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: S.onSurfaceMuted, marginTop: 4 }}>{e.month}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: S.onSurface, letterSpacing: '-0.01em' }}>{e.title}</div>
                  <div style={{ fontSize: 12, color: S.onSurfaceMuted, marginTop: 3 }}>{e.loc}</div>
                  <div style={{ marginTop: 8 }}><Badge color={e.c}>{e.type}</Badge></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 3: tertiary clay thank-you banner */}
      <div style={{
        padding: '20px 28px', borderRadius: 16,
        background: `linear-gradient(90deg, ${S.tertiaryContainer}, ${S.surfaceContainerLowest})`,
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: S.tertiary + '20',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={S.tertiary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 15, color: S.tertiary, fontStyle: 'italic', letterSpacing: '-0.005em', lineHeight: 1.5,
          }}>
            "Thank you for your faithful giving, Amara. Your contributions this month are helping sustain our weekly ministries."
          </div>
        </div>
      </div>
    </div>
  </AppShell>
);

// 7.3 Member — My Giving (list)
const MemberGiving = () => (
  <AppShell role="member" active="transactions" breadcrumb="My Giving" churchName="Grace Community" userName="Amara Okonkwo">
    <div style={{ height: '100%', overflow: 'auto' }}>
      <PageHeader
        overline="My Giving"
        title="Your giving history."
        subtitle="Everything Grace Community has recorded for you — private, and always yours."
      />

      {/* Filter bar */}
      <div style={{ background: S.surfaceContainerLow, borderRadius: 16, padding: 12, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <Chip icon="calendar">This year</Chip>
        <div style={{ width: 1, height: 24, background: S.surfaceContainer }} />
        <Chip active>All types</Chip>
        <Chip>Tithe</Chip>
        <Chip>Offering</Chip>
        <Chip>Mission</Chip>
        <Chip>First Fruit</Chip>
        <div style={{ width: 1, height: 24, background: S.surfaceContainer }} />
        <Chip icon="chevronDown">All methods</Chip>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: S.onSurfaceMuted }}>14 gifts</div>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 40, padding: '16px 24px', marginBottom: 16 }}>
        <div><div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted, marginBottom: 6 }}>Total in range</div><div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>$6,240.00</div></div>
        <div><div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted, marginBottom: 6 }}>Gifts in range</div><div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>14</div></div>
        <div><div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted, marginBottom: 6 }}>Average per gift</div><div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>$445.71</div></div>
      </div>

      {/* Table */}
      <Table
        columns={[
          { key: 'date', label: 'Date', width: '110px' },
          { key: 'type', label: 'Type', width: '140px' },
          { key: 'event', label: 'Event' },
          { key: 'method', label: 'Payment method', width: '160px' },
          { key: 'ref', label: 'Reference #', width: '120px' },
          { key: 'amount', label: 'Amount', width: '120px', align: 'right' },
        ]}
        rows={[
          { _hover: true, date: 'Apr 21, 2026', type: <TypeBadge type="Tithe" />, event: <span style={{ color: S.onSurfaceMuted }}>Sunday Worship</span>, method: <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="bank" size={14} color={S.onSurfaceMuted} />Bank transfer</span>, ref: <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: S.onSurfaceMuted }}>TXN-8821</span>, amount: <Amount value="250.00" /> },
          { date: 'Apr 07, 2026', type: <TypeBadge type="Offering" />, event: <span style={{ color: S.onSurfaceMuted }}>Sunday Worship</span>, method: <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="cash" size={14} color={S.onSurfaceMuted} />Cash</span>, ref: <span style={{ color: S.onSurfaceMuted }}>—</span>, amount: <Amount value="120.00" /> },
          { date: 'Mar 31, 2026', type: <TypeBadge type="Mission" />, event: <span style={{ color: S.onSurfaceMuted }}>Mission Sunday</span>, method: <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="bank" size={14} color={S.onSurfaceMuted} />Bank transfer</span>, ref: <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: S.onSurfaceMuted }}>TXN-8712</span>, amount: <Amount value="200.00" /> },
          { date: 'Mar 17, 2026', type: <TypeBadge type="Offering" />, event: <span style={{ color: S.onSurfaceMuted }}>Sunday Worship</span>, method: <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="cash" size={14} color={S.onSurfaceMuted} />Cash</span>, ref: <span style={{ color: S.onSurfaceMuted }}>—</span>, amount: <Amount value="100.00" /> },
          { date: 'Mar 03, 2026', type: <TypeBadge type="Tithe" />, event: <span style={{ color: S.onSurfaceMuted }}>Sunday Worship</span>, method: <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="bank" size={14} color={S.onSurfaceMuted} />Bank transfer</span>, ref: <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: S.onSurfaceMuted }}>TXN-8512</span>, amount: <Amount value="250.00" /> },
          { date: 'Feb 24, 2026', type: <TypeBadge type="First Fruit" />, event: <span style={{ color: S.onSurfaceMuted }}>—</span>, method: <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="check_rect" size={14} color={S.onSurfaceMuted} />Check</span>, ref: <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: S.onSurfaceMuted }}>CHK-1402</span>, amount: <Amount value="500.00" /> },
          { date: 'Feb 10, 2026', type: <TypeBadge type="Commitment" />, event: <span style={{ color: S.onSurfaceMuted }}>Building Fund</span>, method: <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icon name="bank" size={14} color={S.onSurfaceMuted} />Bank transfer</span>, ref: <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: S.onSurfaceMuted }}>TXN-8321</span>, amount: <Amount value="1,000.00" /> },
        ]}
      />
    </div>
  </AppShell>
);

// 7.5 Member — Events list
const MemberEvents = () => {
  const events = [
    { day: '28', month: 'APR', title: 'Sunday Worship Service', loc: 'Main Sanctuary · 10:00am', type: 'Service', c: 'indigo', desc: 'Weekly gathering for worship, teaching, and communion. Children\'s ministry available.', recurring: true, dim: false },
    { day: '05', month: 'MAY', title: 'Mission Sunday', loc: 'Main Sanctuary', type: 'Special', c: 'blue', desc: 'A special Sunday dedicated to supporting our mission partners in Kenya and the Philippines.', dim: false },
    { day: '12', month: 'MAY', title: 'Annual Harvest Thanksgiving', loc: 'Fellowship Hall · 11:30am', type: 'Fundraiser', c: 'amber', desc: 'Our largest gathering of the year. Join us for worship, a shared meal, and testimonies of God\'s faithfulness.', dim: false },
    { day: '19', month: 'MAY', title: 'Youth Overnight Retreat', loc: 'Grace Lake Camp', type: 'Special', c: 'blue', desc: 'A two-day retreat for youth ages 12–18. Permission forms available in the foyer.', dim: false },
    { day: '26', month: 'MAY', title: 'Sunday Worship Service', loc: 'Main Sanctuary · 10:00am', type: 'Service', c: 'indigo', desc: 'Weekly gathering.', recurring: true, dim: false },
    { day: '02', month: 'JUN', title: 'New Members Welcome Lunch', loc: 'Fellowship Hall', type: 'Special', c: 'blue', desc: 'If you\'ve started attending Grace recently, we\'d love to meet you over a meal.', dim: false },
  ];
  return (
    <AppShell role="member" active="events" breadcrumb="Events" churchName="Grace Community" userName="Amara Okonkwo">
      <div style={{ height: '100%', overflow: 'auto' }}>
        <PageHeader
          overline="Calendar"
          title="Upcoming events."
          subtitle="Gatherings, services, and special moments at Grace Community."
        />

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <Chip active>Upcoming</Chip>
          <Chip>Past</Chip>
          <Chip>All</Chip>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {events.map((e, i) => (
            <Card key={i} padding={0} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                padding: 16, background: S.surfaceContainerLow, display: 'flex', gap: 12, alignItems: 'center',
              }}>
                <div style={{
                  width: 64, borderRadius: 12, background: S.surfaceContainerLowest,
                  padding: '10px 0', textAlign: 'center', flexShrink: 0,
                }}>
                  <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: S.onSurface, lineHeight: 1 }}>{e.day}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: S.onSurfaceMuted, marginTop: 4 }}>{e.month}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge color={e.c}>{e.type}</Badge>
                    {e.recurring && <Badge color="gray">Recurring</Badge>}
                  </div>
                </div>
              </div>
              <div style={{ padding: 20, flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', color: S.onSurface, lineHeight: 1.25 }}>{e.title}</div>
                <div style={{ fontSize: 12, color: S.onSurfaceMuted, marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="location" size={12} color={S.onSurfaceMuted} />{e.loc}
                </div>
                <div style={{ fontSize: 13, color: S.onSurfaceVariant, marginTop: 12, lineHeight: 1.55 }}>{e.desc}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

Object.assign(window, { MemberDashboard, MemberGiving, MemberEvents });
