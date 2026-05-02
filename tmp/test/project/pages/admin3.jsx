// ============ ADMIN pt 3 + SUPER ADMIN ============
const S = window.SANCTUARY;

// 8.5 Admin Events list
const AdminEvents = () => {
	const rows = [
		{
			title: "Sunday Worship Service",
			type: "Service",
			c: "indigo",
			date: "Apr 28, 2026",
			loc: "Main Sanctuary",
			status: "Upcoming",
			tx: 0,
			amt: "—",
		},
		{
			title: "Mission Sunday",
			type: "Special",
			c: "blue",
			date: "May 5, 2026",
			loc: "Main Sanctuary",
			status: "Upcoming",
			tx: 0,
			amt: "—",
		},
		{
			title: "Annual Harvest Thanksgiving",
			type: "Fundraiser",
			c: "amber",
			date: "May 12, 2026",
			loc: "Fellowship Hall",
			status: "Upcoming",
			tx: 18,
			amt: "4,800.00",
		},
		{
			title: "Building Fund Campaign",
			type: "Fundraiser",
			c: "amber",
			date: "Ongoing",
			loc: "—",
			status: "Ongoing",
			tx: 42,
			amt: "18,500.00",
		},
		{
			title: "Easter Sunday Service",
			type: "Service",
			c: "indigo",
			date: "Apr 5, 2026",
			loc: "Main Sanctuary",
			status: "Completed",
			tx: 86,
			amt: "12,240.00",
		},
		{
			title: "Good Friday Service",
			type: "Service",
			c: "indigo",
			date: "Apr 3, 2026",
			loc: "Main Sanctuary",
			status: "Completed",
			tx: 32,
			amt: "3,680.00",
		},
		{
			title: "Youth Conference 2026",
			type: "Conference",
			c: "purple",
			date: "Mar 14–16, 2026",
			loc: "Grace Lake Camp",
			status: "Completed",
			tx: 24,
			amt: "2,400.00",
		},
	];
	return (
		<AppShell
			role="admin"
			active="events"
			breadcrumb="Events"
			churchName="Grace Community"
			userName="Sarah Chen"
		>
			<div style={{ height: "100%", overflow: "auto" }}>
				<PageHeader
					overline="Calendar"
					title="Events."
					subtitle="Services, conferences, fundraisers, and special gatherings."
					action={
						<Button variant="primary" icon="plus">
							Create event
						</Button>
					}
				/>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						marginBottom: 20,
					}}
				>
					<div style={{ display: "flex", gap: 6 }}>
						<Chip active>Upcoming · 4</Chip>
						<Chip>Ongoing · 1</Chip>
						<Chip>Past · 28</Chip>
						<Chip>Cancelled · 0</Chip>
						<Chip>All</Chip>
					</div>
					<div
						style={{
							display: "flex",
							gap: 4,
							background: S.surfaceContainerLow,
							padding: 4,
							borderRadius: 9999,
						}}
					>
						{["List", "Calendar"].map((t, i) => (
							<div
								key={i}
								style={{
									padding: "5px 14px",
									borderRadius: 9999,
									fontSize: 12,
									fontWeight: 500,
									background:
										i === 0 ? S.surfaceContainerLowest : "transparent",
									color: i === 0 ? S.onSurface : S.onSurfaceMuted,
								}}
							>
								{t}
							</div>
						))}
					</div>
				</div>

				<Table
					columns={[
						{ key: "event", label: "Event" },
						{ key: "date", label: "Date", width: "160px" },
						{ key: "loc", label: "Location", width: "180px" },
						{ key: "status", label: "Status", width: "120px" },
						{
							key: "tx",
							label: "Gifts linked",
							width: "180px",
							align: "right",
						},
						{ key: "act", label: "", width: "32px", align: "right" },
					]}
					rows={rows.map((r, i) => ({
						_hover: i === 0,
						event: (
							<span
								style={{
									display: "inline-flex",
									flexDirection: "column",
									gap: 4,
								}}
							>
								<span style={{ fontWeight: 500 }}>{r.title}</span>
								<span>
									<Badge color={r.c}>{r.type}</Badge>
								</span>
							</span>
						),
						date: <span style={{ fontSize: 13 }}>{r.date}</span>,
						loc: (
							<span style={{ fontSize: 13, color: S.onSurfaceMuted }}>
								{r.loc}
							</span>
						),
						status: <StatusBadge status={r.status} />,
						tx: (
							<span>
								{r.tx > 0 ? (
									<span>
										<span
											style={{
												fontSize: 12,
												color: S.onSurfaceMuted,
												marginRight: 8,
											}}
										>
											{r.tx} gifts
										</span>
										<Amount value={r.amt} />
									</span>
								) : (
									<span style={{ color: S.onSurfaceMuted }}>—</span>
								)}
							</span>
						),
						act: <Icon name="dots" size={16} color={S.onSurfaceMuted} />,
					}))}
				/>
			</div>
		</AppShell>
	);
};

// 8.7 Event Detail (Admin)
const AdminEventDetail = () => (
	<AppShell
		role="admin"
		active="events"
		breadcrumb="Events / Annual Harvest Thanksgiving"
		churchName="Grace Community"
		userName="Sarah Chen"
	>
		<div style={{ height: "100%", overflow: "auto" }}>
			{/* Hero band */}
			<div
				style={{
					background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
					borderRadius: 20,
					padding: "28px 32px",
					color: "#fff",
					marginBottom: 24,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<div>
					<div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
						<span
							style={{
								background: "rgba(255,255,255,0.2)",
								padding: "3px 10px",
								borderRadius: 9999,
								fontSize: 12,
								fontWeight: 500,
							}}
						>
							Fundraiser
						</span>
						<span
							style={{
								background: "rgba(255,255,255,0.2)",
								padding: "3px 10px",
								borderRadius: 9999,
								fontSize: 12,
								fontWeight: 500,
							}}
						>
							Upcoming
						</span>
					</div>
					<h1
						style={{
							fontSize: 32,
							fontWeight: 600,
							letterSpacing: "-0.025em",
							margin: 0,
						}}
					>
						Annual Harvest Thanksgiving
					</h1>
					<div style={{ fontSize: 14, opacity: 0.85, marginTop: 8 }}>
						May 12, 2026 · 11:30am · Fellowship Hall
					</div>
				</div>
				<div style={{ display: "flex", gap: 8 }}>
					<Button
						variant="secondary"
						icon="edit"
						style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
					>
						Edit
					</Button>
					<Button variant="tertiary" style={{ color: "#fff" }}>
						Cancel event
					</Button>
				</div>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(3,1fr)",
					gap: 16,
					marginBottom: 24,
				}}
			>
				<StatCard
					label="Total linked gifts"
					value={<Amount value="4,800" size="display" gradient />}
					caption="This event"
				/>
				<StatCard label="Number of gifts" value="18" caption="Avg: $266" />
				<StatCard label="Unique givers" value="15" caption="3 anonymous" />
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1.5fr 1fr",
					gap: 16,
					marginBottom: 24,
				}}
			>
				<Card>
					<SectionTitle title="About this event" />
					<div
						style={{ fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.7 }}
					>
						Our largest gathering of the year. Join us for worship, a shared
						meal, and testimonies of God's faithfulness. Every family is invited
						to bring a dish to share — whatever represents your season of
						harvest. Free childcare is available; please sign up in the foyer.
					</div>
				</Card>
				<Card>
					<SectionTitle title="At a glance" />
					{[
						["Date", "May 12, 2026"],
						["Duration", "3 hours"],
						["Recurrence", "Annually"],
						["Visibility", "Public"],
						["Status", <StatusBadge status="Upcoming" />],
					].map(([k, v], i) => (
						<div
							key={i}
							style={{
								display: "flex",
								justifyContent: "space-between",
								padding: "10px 0",
								borderBottom:
									i < 4 ? `1px solid ${S.surfaceContainer}` : "none",
							}}
						>
							<span
								style={{
									fontSize: 12,
									color: S.onSurfaceMuted,
									fontWeight: 500,
									textTransform: "uppercase",
									letterSpacing: "0.05em",
								}}
							>
								{k}
							</span>
							<span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
						</div>
					))}
				</Card>
			</div>

			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 12,
				}}
			>
				<h3
					style={{
						fontSize: 18,
						fontWeight: 600,
						letterSpacing: "-0.02em",
						margin: 0,
					}}
				>
					Linked gifts
				</h3>
				<Button variant="primary" size="sm" icon="plus">
					Record for this event
				</Button>
			</div>
			<Table
				columns={[
					{ key: "date", label: "Date", width: "100px" },
					{ key: "member", label: "Member" },
					{ key: "type", label: "Type", width: "130px" },
					{ key: "method", label: "Method", width: "130px" },
					{ key: "amt", label: "Amount", width: "110px", align: "right" },
				]}
				rows={[
					{
						date: "May 8",
						member: (
							<span
								style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
							>
								<Avatar name="Grace Adeyemi" size={26} />
								Grace Adeyemi
							</span>
						),
						type: <TypeBadge type="Commitment" />,
						method: <span style={{ fontSize: 13 }}>Bank transfer</span>,
						amt: <Amount value="600.00" />,
					},
					{
						date: "May 6",
						member: (
							<span
								style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
							>
								<Avatar name="Daniel Tan" size={26} />
								Daniel Tan
							</span>
						),
						type: <TypeBadge type="Donation" />,
						method: <span style={{ fontSize: 13 }}>Bank transfer</span>,
						amt: <Amount value="400.00" />,
					},
					{
						date: "May 5",
						member: (
							<span style={{ color: S.onSurfaceMuted, fontStyle: "italic" }}>
								Anonymous
							</span>
						),
						type: <TypeBadge type="Offering" />,
						method: <span style={{ fontSize: 13 }}>Cash</span>,
						amt: <Amount value="250.00" />,
					},
				]}
			/>
		</div>
	</AppShell>
);

// 9.1 Super Admin Tenants list
const SuperTenants = () => (
	<AppShell
		role="super"
		active="tenants"
		breadcrumb="Platform / Churches"
		churchName="ChurchFlow HQ"
		userName="David Park"
		bg={S.surfaceContainerLow}
	>
		<div style={{ height: "100%", overflow: "auto" }}>
			<PageHeader
				overline="Platform"
				title="Churches."
				subtitle="All tenants on ChurchFlow. Create churches and manage their admins."
				action={
					<Button variant="primary" icon="plus">
						Create church
					</Button>
				}
			/>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(4,1fr)",
					gap: 16,
					marginBottom: 24,
				}}
			>
				<StatCard label="Churches" value="24" caption="3 created this month" />
				<StatCard
					label="Total admins"
					value="58"
					caption="Across all tenants"
				/>
				<StatCard
					label="Total members"
					value="3,241"
					caption="189 new this month"
				/>
				<StatCard
					label="Gifts recorded (30d)"
					value={<Amount value="412,820" size="display" gradient />}
					caption="2,341 gifts"
				/>
			</div>

			<Table
				columns={[
					{ key: "church", label: "Church" },
					{ key: "admins", label: "Admins", width: "180px" },
					{ key: "members", label: "Members", width: "120px", align: "right" },
					{ key: "tx", label: "Gifts (MTD)", width: "180px", align: "right" },
					{ key: "created", label: "Created", width: "120px" },
					{ key: "act", label: "", width: "32px", align: "right" },
				]}
				rows={[
					{
						_hover: true,
						church: (
							<span
								style={{
									display: "inline-flex",
									gap: 10,
									alignItems: "center",
								}}
							>
								<div
									style={{
										width: 36,
										height: 36,
										borderRadius: 10,
										background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
										color: "#fff",
										display: "grid",
										placeItems: "center",
										fontSize: 13,
										fontWeight: 600,
									}}
								>
									GC
								</div>
								<div>
									<div style={{ fontWeight: 500 }}>Grace Community Church</div>
									<div style={{ fontSize: 11, color: S.onSurfaceMuted }}>
										gracecommunity.org
									</div>
								</div>
							</span>
						),
						admins: (
							<span style={{ display: "inline-flex" }}>
								{["Sarah Chen", "David Obi", "Mary Kim"].map((n, i) => (
									<span
										key={i}
										style={{
											marginLeft: i > 0 ? -8 : 0,
											border: `2px solid ${S.surfaceContainerLowest}`,
											borderRadius: "50%",
										}}
									>
										<Avatar name={n} size={26} />
									</span>
								))}
								<span
									style={{
										marginLeft: 8,
										fontSize: 12,
										color: S.onSurfaceMuted,
										alignSelf: "center",
									}}
								>
									3 admins
								</span>
							</span>
						),
						members: "234",
						tx: (
							<span>
								<span
									style={{
										color: S.onSurfaceMuted,
										fontSize: 12,
										marginRight: 8,
									}}
								>
									142 gifts
								</span>
								<Amount value="28,450" />
							</span>
						),
						created: (
							<span style={{ fontSize: 13, color: S.onSurfaceMuted }}>
								Jan 2024
							</span>
						),
						act: <Icon name="dots" size={16} color={S.onSurfaceMuted} />,
					},
					{
						church: (
							<span
								style={{
									display: "inline-flex",
									gap: 10,
									alignItems: "center",
								}}
							>
								<div
									style={{
										width: 36,
										height: 36,
										borderRadius: 10,
										background: `linear-gradient(135deg, #0D9488, #115E59)`,
										color: "#fff",
										display: "grid",
										placeItems: "center",
										fontSize: 13,
										fontWeight: 600,
									}}
								>
									MZ
								</div>
								<div>
									<div style={{ fontWeight: 500 }}>Mount Zion Assembly</div>
									<div style={{ fontSize: 11, color: S.onSurfaceMuted }}>
										mtzion.church
									</div>
								</div>
							</span>
						),
						admins: (
							<span style={{ display: "inline-flex" }}>
								{["Ade Lawal", "Chidi Eze"].map((n, i) => (
									<span
										key={i}
										style={{
											marginLeft: i > 0 ? -8 : 0,
											border: `2px solid ${S.surfaceContainerLowest}`,
											borderRadius: "50%",
										}}
									>
										<Avatar name={n} size={26} />
									</span>
								))}
								<span
									style={{
										marginLeft: 8,
										fontSize: 12,
										color: S.onSurfaceMuted,
										alignSelf: "center",
									}}
								>
									2 admins
								</span>
							</span>
						),
						members: "412",
						tx: (
							<span>
								<span
									style={{
										color: S.onSurfaceMuted,
										fontSize: 12,
										marginRight: 8,
									}}
								>
									218 gifts
								</span>
								₦<Amount value="1,840,000" currency="" />
							</span>
						),
						created: (
							<span style={{ fontSize: 13, color: S.onSurfaceMuted }}>
								Sep 2023
							</span>
						),
						act: <Icon name="dots" size={16} color={S.onSurfaceMuted} />,
					},
					{
						church: (
							<span
								style={{
									display: "inline-flex",
									gap: 10,
									alignItems: "center",
								}}
							>
								<div
									style={{
										width: 36,
										height: 36,
										borderRadius: 10,
										background: `linear-gradient(135deg, #9333EA, #5B21B6)`,
										color: "#fff",
										display: "grid",
										placeItems: "center",
										fontSize: 13,
										fontWeight: 600,
									}}
								>
									NH
								</div>
								<div>
									<div style={{ fontWeight: 500 }}>New Hope Fellowship</div>
									<div style={{ fontSize: 11, color: S.onSurfaceMuted }}>
										newhope.org
									</div>
								</div>
							</span>
						),
						admins: (
							<span style={{ display: "inline-flex" }}>
								{["John Park"].map((n, i) => (
									<span
										key={i}
										style={{
											marginLeft: i > 0 ? -8 : 0,
											border: `2px solid ${S.surfaceContainerLowest}`,
											borderRadius: "50%",
										}}
									>
										<Avatar name={n} size={26} />
									</span>
								))}
								<span
									style={{
										marginLeft: 8,
										fontSize: 12,
										color: S.onSurfaceMuted,
										alignSelf: "center",
									}}
								>
									1 admin
								</span>
							</span>
						),
						members: "156",
						tx: (
							<span>
								<span
									style={{
										color: S.onSurfaceMuted,
										fontSize: 12,
										marginRight: 8,
									}}
								>
									89 gifts
								</span>
								<Amount value="14,200" />
							</span>
						),
						created: (
							<span style={{ fontSize: 13, color: S.onSurfaceMuted }}>
								Mar 2024
							</span>
						),
						act: <Icon name="dots" size={16} color={S.onSurfaceMuted} />,
					},
					{
						church: (
							<span
								style={{
									display: "inline-flex",
									gap: 10,
									alignItems: "center",
								}}
							>
								<div
									style={{
										width: 36,
										height: 36,
										borderRadius: 10,
										background: `linear-gradient(135deg, #D97706, #92400E)`,
										color: "#fff",
										display: "grid",
										placeItems: "center",
										fontSize: 13,
										fontWeight: 600,
									}}
								>
									LB
								</div>
								<div>
									<div style={{ fontWeight: 500 }}>Lighthouse Baptist</div>
									<div style={{ fontSize: 11, color: S.onSurfaceMuted }}>
										lighthousebaptist.org
									</div>
								</div>
							</span>
						),
						admins: (
							<span style={{ display: "inline-flex" }}>
								{["Mary Jones", "Tom Lee"].map((n, i) => (
									<span
										key={i}
										style={{
											marginLeft: i > 0 ? -8 : 0,
											border: `2px solid ${S.surfaceContainerLowest}`,
											borderRadius: "50%",
										}}
									>
										<Avatar name={n} size={26} />
									</span>
								))}
								<span
									style={{
										marginLeft: 8,
										fontSize: 12,
										color: S.onSurfaceMuted,
										alignSelf: "center",
									}}
								>
									2 admins
								</span>
							</span>
						),
						members: "98",
						tx: (
							<span>
								<span
									style={{
										color: S.onSurfaceMuted,
										fontSize: 12,
										marginRight: 8,
									}}
								>
									64 gifts
								</span>
								<Amount value="9,840" />
							</span>
						),
						created: (
							<span style={{ fontSize: 13, color: S.onSurfaceMuted }}>
								Nov 2024
							</span>
						),
						act: <Icon name="dots" size={16} color={S.onSurfaceMuted} />,
					},
					{
						church: (
							<span
								style={{
									display: "inline-flex",
									gap: 10,
									alignItems: "center",
								}}
							>
								<div
									style={{
										width: 36,
										height: 36,
										borderRadius: 10,
										background: `linear-gradient(135deg, #2563EB, #1E40AF)`,
										color: "#fff",
										display: "grid",
										placeItems: "center",
										fontSize: 13,
										fontWeight: 600,
									}}
								>
									RB
								</div>
								<div>
									<div style={{ fontWeight: 500 }}>River Bend Chapel</div>
									<div style={{ fontSize: 11, color: S.onSurfaceMuted }}>—</div>
								</div>
							</span>
						),
						admins: (
							<span style={{ fontSize: 12, color: S.onSurfaceMuted }}>
								No admins yet ·{" "}
								<span style={{ color: S.primary, fontWeight: 500 }}>
									Invite
								</span>
							</span>
						),
						members: "0",
						tx: <span style={{ color: S.onSurfaceMuted }}>—</span>,
						created: (
							<span style={{ fontSize: 13, color: S.onSurfaceMuted }}>
								Apr 2026
							</span>
						),
						act: <Icon name="dots" size={16} color={S.onSurfaceMuted} />,
					},
				]}
			/>
		</div>
	</AppShell>
);

// Transaction drawer (member view) — shown as a focused preview
const TransactionDrawer = () => (
	<div
		style={{
			width: "100%",
			height: "100%",
			background: S.surface,
			fontFamily: "Inter, system-ui, sans-serif",
			position: "relative",
		}}
	>
		{/* faint background */}
		<div
			style={{
				position: "absolute",
				inset: 0,
				opacity: 0.4,
				filter: "blur(4px)",
				pointerEvents: "none",
			}}
		>
			<div style={{ padding: 40 }}>
				{[0, 1, 2, 3, 4].map((i) => (
					<div
						key={i}
						style={{
							height: 50,
							background: S.surfaceContainerLowest,
							borderRadius: 10,
							marginBottom: 8,
						}}
					/>
				))}
			</div>
		</div>
		<div
			style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)" }}
		/>

		{/* Drawer */}
		<div
			style={{
				position: "absolute",
				right: 0,
				top: 0,
				bottom: 0,
				width: 520,
				background: S.surfaceContainerLowest,
				boxShadow: "-20px 0 60px -10px rgba(79, 70, 229, 0.25)",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
			}}
		>
			<div
				style={{
					padding: "28px 32px 20px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
				}}
			>
				<div>
					<div
						style={{
							fontSize: 11,
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: S.onSurfaceMuted,
							marginBottom: 6,
						}}
					>
						Gift record
					</div>
					<h2
						style={{
							fontSize: 22,
							fontWeight: 600,
							letterSpacing: "-0.02em",
							margin: 0,
						}}
					>
						April 21, 2026
					</h2>
					<div style={{ marginTop: 8 }}>
						<TypeBadge type="Tithe" />
					</div>
				</div>
				<div
					style={{
						width: 36,
						height: 36,
						borderRadius: "50%",
						background: S.surfaceContainerLow,
						display: "grid",
						placeItems: "center",
					}}
				>
					<Icon name="x" size={16} />
				</div>
			</div>

			{/* Amount display */}
			<div style={{ padding: "0 32px 24px" }}>
				<div
					style={{
						padding: 28,
						borderRadius: 16,
						background: `linear-gradient(135deg, ${S.primaryFixed}, ${S.surfaceContainerLow})`,
						textAlign: "center",
					}}
				>
					<div
						style={{
							fontSize: 11,
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: S.onSurfaceMuted,
							marginBottom: 8,
						}}
					>
						Amount
					</div>
					<div
						style={{
							fontSize: 48,
							fontWeight: 600,
							letterSpacing: "-0.03em",
							fontVariantNumeric: "tabular-nums",
							background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
						}}
					>
						$250.00
					</div>
				</div>
			</div>

			{/* Meta rows */}
			<div style={{ padding: "0 32px", flex: 1, overflow: "auto" }}>
				{[
					[
						"Payment method",
						<span
							style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
						>
							<Icon name="bank" size={14} color={S.onSurfaceMuted} />
							Bank transfer
						</span>,
					],
					[
						"Reference",
						<span
							style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}
						>
							TXN-8821
						</span>,
					],
					[
						"Event",
						<span style={{ color: S.primary, fontWeight: 500 }}>
							Sunday Worship · Apr 21
						</span>,
					],
					[
						"Recorded by",
						<span
							style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
						>
							<Avatar name="Sarah Chen" size={22} />
							Sarah Chen
						</span>,
					],
					["Recorded on", "Apr 21, 2026 · 2:14pm"],
				].map(([k, v], i) => (
					<div
						key={i}
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							padding: "16px 0",
							borderBottom: i < 4 ? `1px solid ${S.surfaceContainer}` : "none",
						}}
					>
						<span
							style={{
								fontSize: 11,
								fontWeight: 600,
								letterSpacing: "0.08em",
								textTransform: "uppercase",
								color: S.onSurfaceMuted,
							}}
						>
							{k}
						</span>
						<span style={{ fontSize: 14 }}>{v}</span>
					</div>
				))}
				<div
					style={{
						marginTop: 20,
						padding: 16,
						background: S.surfaceContainerLow,
						borderRadius: 12,
					}}
				>
					<div
						style={{
							fontSize: 11,
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: S.onSurfaceMuted,
							marginBottom: 8,
						}}
					>
						Note
					</div>
					<div
						style={{
							fontSize: 14,
							color: S.onSurfaceVariant,
							fontStyle: "italic",
							lineHeight: 1.6,
						}}
					>
						"End-of-month tithe for April. Thank you for faithfully serving
						Grace Community."
					</div>
				</div>
			</div>

			<div
				style={{
					padding: 24,
					background: S.surfaceContainerLow,
					fontSize: 12,
					color: S.onSurfaceMuted,
					textAlign: "center",
				}}
			>
				This is a private record between you and Grace Community.
			</div>
		</div>
	</div>
);

Object.assign(window, {
	AdminEvents,
	AdminEventDetail,
	SuperTenants,
	TransactionDrawer,
});
