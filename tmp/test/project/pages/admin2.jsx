// ============ ADMIN PAGES (pt 2) ============
const S = window.SANCTUARY;

// 8.8 Admin Transactions list
const AdminTransactions = () => (
  <AppShell role="admin" active="transactions" breadcrumb="Transactions" churchName="Grace Community" userName="Sarah Chen">
    <div style={{ height: '100%', overflow: 'auto' }}>
      <PageHeader
        overline="Ledger"
        title="Transactions."
        subtitle="Every gift recorded at Grace Community Church."
        action={<>
          <Button variant="secondary" icon="download" disabled>Export</Button>
          <Button variant="primary" icon="plus">Record gift</Button>
        </>}
      />

      {/* Filter bar */}
      <div style={{ background: S.surfaceContainerLow, borderRadius: 16, padding: 12, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 260 }}><Input icon="search" placeholder="Search member, note, ref #…" /></div>
        <Chip icon="calendar">This month</Chip>
        <Chip icon="chevronDown">All types</Chip>
        <Chip icon="chevronDown">All methods</Chip>
        <Chip icon="chevronDown">All events</Chip>
        <Chip icon="chevronDown">All members</Chip>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: S.onSurfaceMuted, cursor: 'pointer' }}>Reset filters</span>
      </div>

      {/* Summary + mini donut */}
      <div style={{ background: S.surfaceContainerLowest, borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 40, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted, marginBottom: 6 }}>Total</div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>$28,450.00</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted, marginBottom: 6 }}>Gifts</div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>142</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted, marginBottom: 6 }}>Average</div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>$200.35</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexDirection: 'column', fontSize: 11 }}>
            {[{c: S.txTithe, l:'Tithe 42%'},{c: S.txOffering, l:'Offering 24%'},{c: S.txMission, l:'Mission 16%'}].map((x,i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} />{x.l}</div>
            ))}
          </div>
          <Donut size={80} total="$28k" data={[{v:42,color:S.txTithe},{v:24,color:S.txOffering},{v:16,color:S.txMission},{v:10,color:S.txFirstFruit},{v:8,color:S.txCommitment}]} />
        </div>
      </div>

      <Table
        columns={[
          { key: 'date', label: 'Date', width: '110px' },
          { key: 'member', label: 'Member', width: '200px' },
          { key: 'type', label: 'Type', width: '130px' },
          { key: 'event', label: 'Event', width: '180px' },
          { key: 'method', label: 'Method', width: '140px' },
          { key: 'ref', label: 'Ref #', width: '100px' },
          { key: 'amt', label: 'Amount', width: '110px', align: 'right' },
          { key: 'act', label: '', width: '32px', align: 'right' },
        ]}
        rows={[
          { _hover: true, date: 'Apr 21', member: <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Avatar name="Amara Okonkwo" size={26} />Amara Okonkwo</span>, type: <TypeBadge type="Tithe" />, event: <span style={{ color: S.primary, fontSize: 13 }}>Sunday Worship</span>, method: <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }}><Icon name="bank" size={13} color={S.onSurfaceMuted} />Bank</span>, ref: <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: S.onSurfaceMuted }}>8821</span>, amt: <Amount value="250.00" />, act: <Icon name="dots" size={16} color={S.onSurfaceMuted} /> },
          { date: 'Apr 21', member: <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Avatar name="Daniel Tan" size={26} />Daniel Tan</span>, type: <TypeBadge type="Offering" />, event: <span style={{ color: S.primary, fontSize: 13 }}>Sunday Worship</span>, method: <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }}><Icon name="cash" size={13} color={S.onSurfaceMuted} />Cash</span>, ref: <span style={{ color: S.onSurfaceMuted }}>—</span>, amt: <Amount value="100.00" />, act: <Icon name="dots" size={16} color={S.onSurfaceMuted} /> },
          { date: 'Apr 20', member: <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Avatar name="Maria Reyes" size={26} />Maria Reyes</span>, type: <TypeBadge type="Mission" />, event: <span style={{ color: S.primary, fontSize: 13 }}>Mission Sunday</span>, method: <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }}><Icon name="bank" size={13} color={S.onSurfaceMuted} />Bank</span>, ref: <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: S.onSurfaceMuted }}>8712</span>, amt: <Amount value="500.00" />, act: <Icon name="dots" size={16} color={S.onSurfaceMuted} /> },
          { date: 'Apr 20', member: <span style={{ color: S.onSurfaceMuted, fontStyle: 'italic' }}>Anonymous</span>, type: <TypeBadge type="Offering" />, event: <span style={{ color: S.onSurfaceMuted }}>—</span>, method: <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }}><Icon name="cash" size={13} color={S.onSurfaceMuted} />Cash</span>, ref: <span style={{ color: S.onSurfaceMuted }}>—</span>, amt: <Amount value="80.00" />, act: <Icon name="dots" size={16} color={S.onSurfaceMuted} /> },
          { date: 'Apr 19', member: <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Avatar name="Josh Whitfield" size={26} />Josh Whitfield</span>, type: <TypeBadge type="Tithe" />, event: <span style={{ color: S.primary, fontSize: 13 }}>Sunday Worship</span>, method: <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }}><Icon name="check_rect" size={13} color={S.onSurfaceMuted} />Check</span>, ref: <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: S.onSurfaceMuted }}>CHK-1402</span>, amt: <Amount value="325.00" />, act: <Icon name="dots" size={16} color={S.onSurfaceMuted} /> },
          { date: 'Apr 18', member: <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Avatar name="Grace Adeyemi" size={26} />Grace Adeyemi</span>, type: <TypeBadge type="First Fruit" />, event: <span style={{ color: S.onSurfaceMuted }}>—</span>, method: <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }}><Icon name="bank" size={13} color={S.onSurfaceMuted} />Bank</span>, ref: <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: S.onSurfaceMuted }}>8590</span>, amt: <Amount value="600.00" />, act: <Icon name="dots" size={16} color={S.onSurfaceMuted} /> },
          { date: 'Apr 14', member: <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Avatar name="Peter Nguyen" size={26} />Peter Nguyen <Badge color="clay">temp</Badge></span>, type: <TypeBadge type="Offering" />, event: <span style={{ color: S.primary, fontSize: 13 }}>Sunday Worship</span>, method: <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }}><Icon name="cash" size={13} color={S.onSurfaceMuted} />Cash</span>, ref: <span style={{ color: S.onSurfaceMuted }}>—</span>, amt: <Amount value="80.00" />, act: <Icon name="dots" size={16} color={S.onSurfaceMuted} /> },
          { date: 'Apr 13', member: <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Avatar name="Rebecca Park" size={26} />Rebecca Park</span>, type: <TypeBadge type="Commitment" />, event: <span style={{ color: S.primary, fontSize: 13 }}>Building Fund</span>, method: <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }}><Icon name="bank" size={13} color={S.onSurfaceMuted} />Bank</span>, ref: <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: S.onSurfaceMuted }}>8411</span>, amt: <Amount value="1,000.00" />, act: <Icon name="dots" size={16} color={S.onSurfaceMuted} /> },
        ]}
      />
    </div>
  </AppShell>
);

// 8.10 Record gift modal (presented as artboard with dimmed BG)
const RecordGiftModal = () => (
  <div style={{ width: '100%', height: '100%', position: 'relative', background: S.surface, fontFamily: 'Inter, system-ui, sans-serif' }}>
    {/* faint dashboard peek */}
    <div style={{ position: 'absolute', inset: 0, opacity: 0.4, filter: 'blur(6px) saturate(0.7)', pointerEvents: 'none' }}>
      <div style={{ padding: 40 }}>
        <div style={{ height: 40, width: 200, background: S.surfaceContainerHigh, borderRadius: 12, marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ height: 120, background: S.surfaceContainerLowest, borderRadius: 16 }} />)}
        </div>
      </div>
    </div>
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(53, 37, 205, 0.18)', backdropFilter: 'blur(8px)' }} />

    {/* Modal */}
    <div style={{
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      width: 560, background: S.surfaceContainerLowest, borderRadius: 24,
      boxShadow: '0 30px 80px -20px rgba(79, 70, 229, 0.35)',
    }}>
      <div style={{ padding: '24px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: S.onSurfaceMuted }}>New entry</div>
          <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: '4px 0 0' }}>Record a gift</h2>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: S.surfaceContainerLow, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
          <Icon name="x" size={16} />
        </div>
      </div>

      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Amount */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>Amount</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, padding: '14px 18px', background: S.surfaceContainerHigh, borderRadius: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 500, color: S.onSurfaceMuted }}>$</span>
            <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.025em', color: S.onSurface, fontVariantNumeric: 'tabular-nums' }}>250</span>
            <span style={{ fontSize: 28, fontWeight: 500, color: S.onSurfaceMuted }}>.00</span>
          </div>
        </div>

        {/* Type chips */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>Type</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Tithe','Offering','Mission','First Fruit','Commitment','Donation','Other'].map((t,i) => (
              <Chip key={t} active={i===0}>{t}</Chip>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input label="Date" icon="calendar" value="Apr 23, 2026" />
          <Input label="Member" icon="user" value="Amara Okonkwo" suffix="▾" />
        </div>

        <Input label="Event" icon="calendar" value="Sunday Worship · Apr 28" suffix="▾" />

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>Payment method</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { i: 'cash', l: 'Cash' },
              { i: 'check_rect', l: 'Check' },
              { i: 'bank', l: 'Bank', active: true },
              { i: 'phone', l: 'Mobile' },
            ].map((m,i) => (
              <div key={i} style={{
                padding: '12px 8px', borderRadius: 12, textAlign: 'center',
                background: m.active ? S.primaryFixed : S.surfaceContainerLow,
                color: m.active ? S.primary : S.onSurfaceVariant,
              }}>
                <div style={{ display: 'grid', placeItems: 'center', marginBottom: 4 }}><Icon name={m.i} size={18} /></div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>

        <Input label="Reference #" placeholder="Optional" />
      </div>

      <div style={{ padding: '20px 32px', borderTop: `1px solid ${S.surfaceContainer}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: S.onSurfaceMuted }}>⌘ Enter to record · Esc to cancel</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="tertiary">Cancel</Button>
          <Button variant="primary">Record gift</Button>
        </div>
      </div>
    </div>
  </div>
);

// 8.11 Reports
const AdminReports = () => (
  <AppShell role="admin" active="reports" breadcrumb="Reports" churchName="Grace Community" userName="Sarah Chen">
    <div style={{ height: '100%', overflow: 'auto' }}>
      <PageHeader
        overline="Insights"
        title="Reports."
        subtitle="Income insights across members, types, events, and time."
        action={<Button variant="secondary" icon="download" disabled>Export CSV</Button>}
      />

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: S.surfaceContainerLow, padding: 4, borderRadius: 9999, width: 'fit-content' }}>
        {['By Type','By Member','By Event','By Month'].map((t,i) => (
          <div key={i} style={{ padding: '8px 18px', borderRadius: 9999, fontSize: 13, fontWeight: 500, background: i===0 ? S.surfaceContainerLowest : 'transparent', color: i===0 ? S.onSurface : S.onSurfaceMuted }}>{t}</div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Chip icon="calendar">Jan 1 — Apr 23, 2026</Chip>
        <Chip icon="chevronDown">USD</Chip>
        <Chip icon="chevronDown">Group by: Month</Chip>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16, marginBottom: 24 }}>
        <Card>
          <SectionTitle title="Distribution" />
          <div style={{ display: 'grid', placeItems: 'center', padding: '20px 0' }}>
            <Donut size={240} total="$98,420" data={[
              {v:42,color:S.txTithe},{v:24,color:S.txOffering},{v:16,color:S.txMission},
              {v:10,color:S.txFirstFruit},{v:5,color:S.txCommitment},{v:3,color:S.txDonation},
            ]} />
          </div>
        </Card>
        <Card>
          <SectionTitle title="Ranked by type" />
          <div>
            {[
              { c: S.txTithe, l: 'Tithe', amt: '41,336.40', p: 42, gifts: 248 },
              { c: S.txOffering, l: 'Offering', amt: '23,620.80', p: 24, gifts: 312 },
              { c: S.txMission, l: 'Mission', amt: '15,747.20', p: 16, gifts: 64 },
              { c: S.txFirstFruit, l: 'First Fruit', amt: '9,842.00', p: 10, gifts: 28 },
              { c: S.txCommitment, l: 'Commitment', amt: '4,921.00', p: 5, gifts: 14 },
              { c: S.txDonation, l: 'Donation', amt: '2,952.60', p: 3, gifts: 22 },
            ].map((r,i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 100px 70px', gap: 14, alignItems: 'center', padding: '12px 4px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: r.c }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{r.l}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: S.surfaceContainerLow, overflow: 'hidden' }}>
                  <div style={{ width: `${r.p * 2}%`, height: '100%', background: r.c, borderRadius: 3 }} />
                </div>
                <div style={{ textAlign: 'right' }}><Amount value={r.amt} /></div>
                <div style={{ textAlign: 'right', fontSize: 12, color: S.onSurfaceMuted, fontVariantNumeric: 'tabular-nums' }}>{r.gifts} gifts</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle title="Month-over-month" />
        <BarChart gradient data={[
          { label: 'Oct', v: 26 }, { label: 'Nov', v: 31 }, { label: 'Dec', v: 38, label2: '$38k' },
          { label: 'Jan', v: 27 }, { label: 'Feb', v: 24 }, { label: 'Mar', v: 25 },
          { label: 'Apr', v: 28, highlight: true, label2: '$28k (MTD)' },
        ]} height={180} />
      </Card>
    </div>
  </AppShell>
);

Object.assign(window, { AdminTransactions, RecordGiftModal, AdminReports });
