// Richer sample data for the ChurchFlow mobile dashboard mocks.
// Designed so cards have variety (not all amber, not all same campaign).

const TENANT = {
  slug: 'grace-fellowship',
  name: 'Grace Fellowship',
  city: 'Cebu City',
  short: 'GF',
  brand: '#8b86ee',
};

const USER = {
  firstName: 'Japheth',
  lastName: 'Gofredo',
  fullName: 'Japheth Louie M. Gofredo',
  email: 'japhethlouie@gmail.com',
  role: 'Admin',
};

const STAT_STRIP = [
  {
    label: 'Received this week', icon: 'receipt', accent: true,
    value: '₱148.2k', caption: '47 gifts · avg ₱3.1k',
    delta: '+18.4%', deltaDirection: 'up',
  },
  {
    label: 'Members', icon: 'users',
    value: '342', caption: '+4 this week',
  },
  {
    label: 'Active campaigns', icon: 'calendar',
    value: '6', caption: '2 ≤ 14 days to deadline',
  },
  {
    label: 'vs. last week', icon: 'chart',
    value: '+18.4%', caption: 'Last week: ₱125.1k',
    deltaDirection: 'up',
  },
];

const UNATTRIBUTED = {
  anonymousCount: 3,
  anonymousTotal: 4200,
  noCampaignCount: 5,
  noCampaignTotal: 8650,
};

const URGENT_PLEDGES = [
  {
    id: 'pl1', member: 'Lyre Espinosa', campaign: 'Easter Mission Trip',
    pledged: 12000, paid: 4000, remaining: 8000,
    lifecycle: 'past-due', daysUntil: -2,
  },
  {
    id: 'pl2', member: 'Andres Reyes', campaign: 'Building Fund 2025',
    pledged: 25000, paid: 18500, remaining: 6500,
    lifecycle: 'past-due', daysUntil: -5,
  },
  {
    id: 'pl3', member: 'Maria Santos', campaign: 'Youth Camp Sponsorship',
    pledged: 5000, paid: 1500, remaining: 3500,
    lifecycle: 'due-soon', daysUntil: 4,
  },
  {
    id: 'pl4', member: 'Jeremiah Cruz', campaign: 'Building Fund 2025',
    pledged: 20000, paid: 5000, remaining: 15000,
    lifecycle: 'due-soon', daysUntil: 9,
  },
  {
    id: 'pl5', member: 'Alyas Alas', campaign: 'Easter Mission Trip',
    pledged: 8000, paid: 2400, remaining: 5600,
    lifecycle: 'on-track', daysUntil: 21,
  },
];

const URGENT_CAMPAIGNS = [
  {
    id: 'c1', title: 'Easter Mission Trip',
    goal: 250000, pledged: 220000, raised: 168400,
    daysUntil: -2,
  },
  {
    id: 'c2', title: 'Youth Camp Sponsorship',
    goal: 80000, pledged: 65000, raised: 52000,
    daysUntil: 4,
  },
  {
    id: 'c3', title: 'Building Fund Q2',
    goal: 500000, pledged: 380000, raised: 245000,
    daysUntil: 18,
  },
];

const RECENT_GIFTS = [
  {
    id: 't1', when: 'Today · 9:42am',
    member: 'Lyre Espinosa', type: 'Tithe',
    campaign: 'Easter Mission Trip', amount: 2500,
  },
  {
    id: 't2', when: 'Today · 8:30am',
    member: 'Anonymous', type: 'Offering',
    campaign: null, amount: 800,
  },
  {
    id: 't3', when: 'Yesterday',
    member: 'Japheth Louie M. Gofredo', type: 'Offering',
    campaign: null, amount: 1780,
  },
  {
    id: 't4', when: '2d ago',
    member: 'Andres Reyes', type: 'First Fruit',
    campaign: 'Building Fund 2025', amount: 5000,
  },
  {
    id: 't5', when: '3d ago',
    member: 'Maria Santos', type: 'Commitment',
    campaign: 'Youth Camp Sponsorship', amount: 1500,
  },
  {
    id: 't6', when: '4d ago',
    member: 'Jeremiah Cruz', type: 'Mission',
    campaign: 'Easter Mission Trip', amount: 3200,
  },
  {
    id: 't7', when: '5d ago',
    member: 'Alyas Alas', type: 'Donation',
    campaign: null, amount: 1450,
  },
];

const NOTIFICATIONS = [
  {
    id: 'n1', icon: 'circleCheck', tone: 'green',
    title: 'New gift recorded',
    body: 'Lyre Espinosa gave ₱2,500 toward Easter Mission Trip.',
    when: '5m ago', unread: true,
  },
  {
    id: 'n2', icon: 'triangleAlert', tone: 'amber',
    title: 'Pledge past due',
    body: 'Andres Reyes is 5 days past on Building Fund 2025.',
    when: '2h ago', unread: true,
  },
  {
    id: 'n3', icon: 'gift', tone: 'indigo',
    title: '3 anonymous gifts this week',
    body: '₱4,200 not attributed to a member.',
    when: 'Today, 6:00am', unread: true,
  },
  {
    id: 'n4', icon: 'calendar', tone: 'amber',
    title: 'Easter Mission Trip · 2 days past deadline',
    body: '₱168.4k of ₱250k goal raised (67%).',
    when: 'Yesterday', unread: false,
  },
  {
    id: 'n5', icon: 'users', tone: 'blue',
    title: '4 new members joined',
    body: 'They\'ve been added to your member list.',
    when: '3d ago', unread: false,
  },
];

const SEARCH_RECENT = [
  { kind: 'member', label: 'Lyre Espinosa', sub: 'Member · 12 gifts' },
  { kind: 'campaign', label: 'Easter Mission Trip', sub: 'Campaign · 2 days overdue' },
  { kind: 'transaction', label: '₱2,500 · Tithe · Lyre Espinosa', sub: 'Today, 9:42am' },
];

const SEARCH_QUICK = [
  { kind: 'action', icon: 'plus', label: 'Record a gift', shortcut: '⌘G' },
  { kind: 'action', icon: 'users', label: 'Invite a member', shortcut: '⌘I' },
  { kind: 'action', icon: 'calendar', label: 'New campaign', shortcut: '⌘C' },
  { kind: 'action', icon: 'download', label: 'Export contributions', shortcut: '⌘E' },
];

const formatCompact = (n) => {
  if (n >= 1000000) return '₱' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '₱' + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return '₱' + n.toLocaleString();
};
const formatCurrency = (n) => '₱' + Math.round(n).toLocaleString();

Object.assign(window, {
  CF_DATA: {
    TENANT, USER, STAT_STRIP, UNATTRIBUTED,
    URGENT_PLEDGES, URGENT_CAMPAIGNS, RECENT_GIFTS,
    NOTIFICATIONS, SEARCH_RECENT, SEARCH_QUICK,
  },
  formatCompact, formatCurrency,
});
