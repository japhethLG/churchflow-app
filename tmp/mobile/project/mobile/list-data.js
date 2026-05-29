// ChurchFlow mobile · list-page demo data + page composites.
// Values mirror the desktop screenshots so the mobile translation is
// 1:1 with what the user sees today.

// ─── Members (7 total · 7 active · 4 registered · 3 new in 30d) ───────
const LIST_MEMBERS = [
  { name: 'Lyre Espinosa', email: 'lyre.espinosa@gmail.com', total: 135, spark: [0,0,0,0,0,0,0,0,0,0,40,95], joined: 'May 18, 2026', isNew: true, role: 'USER', registered: true, status: 'ACTIVE' },
  { name: 'Jazel Saligan', email: 'jazsaligan@gmail.com', total: 6800, spark: [0,0,0,0,0,200,0,800,1200,1400,1500,1700], joined: 'May 18, 2026', isNew: true, role: 'USER', registered: true, status: 'ACTIVE' },
  { name: 'Alyas alas', email: 'ace18.espinosa@gmail.com', total: 4500, spark: [0,0,0,0,0,0,300,500,900,1100,800,900], joined: 'May 18, 2026', isNew: true, role: 'USER', registered: false, status: 'ACTIVE' },
  { name: 'jeremiah espinosa', email: 'jeremiah47junjay@gmail.com', total: 3000, spark: [0,0,200,300,250,400,350,300,200,300,350,350], joined: 'Apr 26, 2026', isNew: false, role: 'ADMIN', registered: true, status: 'ACTIVE' },
  { name: 'John Parker', email: 'park3r.jhn@gmail.com', total: 100, spark: [0,0,0,0,0,0,0,0,0,0,0,100], joined: 'Apr 25, 2026', isNew: false, role: 'USER', registered: false, status: 'ACTIVE' },
  { name: 'Japheth Louie Gofredo', email: 'japheth.gofredo@zesty.io', total: 3600, spark: [100,200,150,300,400,350,300,250,400,350,400,400], joined: 'Apr 25, 2026', isNew: false, role: 'ADMIN', registered: true, status: 'ACTIVE' },
  { name: 'Japheth Louie M. Gofredo', email: 'japhethlouie@gmail.com', total: 2100, spark: [0,0,100,150,200,180,150,200,250,220,300,350], joined: 'Apr 25, 2026', isNew: false, role: 'ADMIN', registered: false, status: 'ACTIVE' },
];

// ─── Campaigns (2 total · 2 active · 0 completed · ₱120/₱6.1k) ────────
const LIST_CAMPAIGNS = [
  { title: 'First Fruit', description: null, goal: 5100, pledged: 1989, raised: 100, status: 'ACTIVE', deadline: null, deadlineBadge: null },
  { title: 'Test Campaign', description: 'test', goal: 1000, pledged: 110, raised: 20, status: 'ACTIVE', deadline: 'May 26, 2026', deadlineBadge: { color: 'red', label: '3d past' } },
];

// ─── Pledges (5 in view · ₱3.1k pledged · ₱230 paid · ₱2.9k remaining) ─
const LIST_PLEDGES = [
  { member: 'Lyre Espinosa', campaign: 'Test Campaign', pledged: 100, paid: 10, remaining: 90, deadline: 'May 26, 2026', daysBadge: { tone: 'danger', label: '3d past' }, lifecycle: { key: 'past-due', label: 'Past due' } },
  { member: 'Japheth Louie M. Gofredo', campaign: 'First Fruit', pledged: 2000, paid: 100, remaining: 1900, deadline: null, daysBadge: null, lifecycle: { key: 'no-deadline', label: 'No deadline' } },
  { member: 'Japheth Louie Gofredo', campaign: 'First Fruit', pledged: 1000, paid: 100, remaining: 900, deadline: null, daysBadge: null, lifecycle: { key: 'no-deadline', label: 'No deadline' } },
  { member: 'jeremiah espinosa', campaign: 'Test Campaign', pledged: 10, paid: 10, remaining: 0, deadline: 'May 26, 2026', daysBadge: null, lifecycle: { key: 'fulfilled', label: 'Fulfilled' } },
  { member: 'Japheth Louie M. Gofredo', campaign: 'Winter Camp', pledged: 10, paid: 10, remaining: 0, deadline: 'Apr 28, 2026', daysBadge: null, lifecycle: { key: 'fulfilled', label: 'Fulfilled' } },
];

const MEMBER_STATS = [
  { label: 'total', value: 7 },
  { label: 'active', value: 7, tone: 'success' },
  { label: 'registered', value: 4 },
  { label: 'new in 30d', value: 3 },
];
const CAMPAIGN_STATS = [
  { label: 'total', value: 2 },
  { label: 'active', value: 2, tone: 'success' },
  { label: 'completed', value: 0 },
  { label: 'raised / goal', value: '₱120 / ₱6.1k' },
];
const PLEDGE_STATS = [
  { label: 'in view', value: 5 },
  { label: 'pledged', value: '₱3.1k' },
  { label: 'paid', value: '₱230', tone: 'success' },
  { label: 'remaining', value: '₱2.9k', tone: 'warning' },
  { label: 'fulfillment', value: '7%' },
  { label: 'past due', value: 1, tone: 'danger' },
];

// ─── Transactions (22 in view · ₱21,859 page sum · May 1–31, 2026) ────
const TX_SUMMARY = {
  total: 21859, gifts: 22, avg: 994,
  byType: [
    { type: 'First Fruit', total: 14615, count: 9, avg: 1624 },
    { type: 'Offering', total: 5380, count: 7, avg: 769 },
    { type: 'Other', total: 1500, count: 1, avg: 1500 },
    { type: 'Tithe', total: 364, count: 5, avg: 73 },
  ],
};

const LIST_TRANSACTIONS = [
  { date: 'May 27', fullDate: 'May 27, 2026', member: 'Lyre Espinosa', type: 'Tithe', campaign: 'Test Campaign', ref: null, amount: 10 },
  { date: 'May 22', fullDate: 'May 22, 2026', member: 'Japheth Louie M. Gofredo', type: 'Offering', campaign: null, ref: null, amount: 1780 },
  { date: 'May 18', fullDate: 'May 18, 2026', member: 'jeremiah espinosa', type: 'First Fruit', campaign: 'First Fruit', ref: null, amount: 1500 },
  { date: 'May 16', fullDate: 'May 16, 2026', member: 'Jazel Saligan', type: 'First Fruit', campaign: 'First Fruit', ref: 'GC-2042', amount: 5000, note: 'Gcash transfer' },
  { date: 'May 12', fullDate: 'May 12, 2026', member: null, type: 'Other', campaign: null, ref: null, amount: 1500 },
  { date: 'May 9', fullDate: 'May 9, 2026', member: 'Japheth Louie Gofredo', type: 'Offering', campaign: null, ref: 'BNK-118', amount: 2000 },
  { date: 'May 4', fullDate: 'May 4, 2026', member: 'Alyas alas', type: 'First Fruit', campaign: 'First Fruit', ref: null, amount: 3200 },
];

const TX_STATS = [
  { label: 'in view', value: 22 },
  { label: 'page sum', value: '₱21,859' },
];

// ─── Page composites ──────────────────────────────────────────────────

function MembersListScreen({ expandIndex = -1 }) {
  return (
    <MobileListScreen
      overline="Directory" title="Members"
      actionLabel="Add" actionIcon="plus"
      searchPlaceholder="Search by name or email…"
      stats={MEMBER_STATS} shown={7} total={7}
    >
      {LIST_MEMBERS.map((m, i) => (
        <MemberCard key={m.email} m={m} defaultExpanded={i === expandIndex} />
      ))}
    </MobileListScreen>
  );
}

function CampaignsListScreen({ expandIndex = -1 }) {
  return (
    <MobileListScreen
      overline="Drives" title="Campaigns"
      actionLabel="New" actionIcon="plus"
      searchPlaceholder="Search by title…"
      stats={CAMPAIGN_STATS} shown={2} total={2}
    >
      {LIST_CAMPAIGNS.map((c, i) => (
        <CampaignCard key={c.title} c={c} defaultExpanded={i === expandIndex} />
      ))}
    </MobileListScreen>
  );
}

function PledgesListScreen({ expandIndex = -1, filterCount = 0, activeChips = [], pledges = LIST_PLEDGES, stats = PLEDGE_STATS, shown = 5, total = 5 }) {
  return (
    <MobileListScreen
      overline="Commitments" title="Pledges"
      actionLabel="Record" actionIcon="plus"
      searchPlaceholder="Search by member or campaign…"
      filterCount={filterCount} activeChips={activeChips}
      stats={stats} shown={shown} total={total}
    >
      {pledges.map((p, i) => (
        <PledgeCard key={p.member + p.campaign + i} p={p} defaultExpanded={i === expandIndex} />
      ))}
    </MobileListScreen>
  );
}

function TransactionsListScreen({ expandIndex = -1, filterCount = 0, activeChips = [{ tone: 'period', icon: 'calendar', label: 'May 1 – May 31' }] }) {
  return (
    <MobileListScreen
      overline="Ledger" title="Transactions"
      actionLabel="Record" actionIcon="plus"
      searchPlaceholder="Search note or reference…"
      filterCount={filterCount} activeChips={activeChips}
      topSlot={<TransactionsSummary {...TX_SUMMARY} />}
      stats={TX_STATS} shown={7} total={22}
    >
      {LIST_TRANSACTIONS.map((t, i) => (
        <TransactionCard key={t.date + t.amount + i} t={t} defaultExpanded={i === expandIndex} />
      ))}
    </MobileListScreen>
  );
}

Object.assign(window, {
  LIST_MEMBERS, LIST_CAMPAIGNS, LIST_PLEDGES, LIST_TRANSACTIONS,
  MEMBER_STATS, CAMPAIGN_STATS, PLEDGE_STATS, TX_STATS, TX_SUMMARY,
  MembersListScreen, CampaignsListScreen, PledgesListScreen, TransactionsListScreen,
});
