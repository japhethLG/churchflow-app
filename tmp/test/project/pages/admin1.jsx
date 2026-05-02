// ============ ADMIN PAGES ============
const S = window.SANCTUARY;

// Bar chart (simple, inline SVG)
const BarChart = ({ data, height = 220, gradient }) => {
	const max = Math.max(...data.map((d) => d.v));
	return (
		<div
			style={{
				display: "flex",
				alignItems: "flex-end",
				gap: 10,
				height,
				paddingTop: 20,
			}}
		>
			{data.map((d, i) => {
				const h = (d.v / max) * (height - 40);
				return (
					<div
						key={i}
						style={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 8,
							minWidth: 0,
						}}
					>
						<div
							style={{
								fontSize: 10,
								color: S.onSurfaceMuted,
								fontVariantNumeric: "tabular-nums",
							}}
						>
							{d.label2 || ""}
						</div>
						<div
							style={{
								width: "100%",
								height: h,
								borderRadius: 6,
								background: d.highlight
									? `linear-gradient(180deg, ${S.primaryContainer}, ${S.primary})`
									: gradient
										? `linear-gradient(180deg, ${S.primaryContainer}88, ${S.primary}66)`
										: S.surfaceContainerHigh,
							}}
						/>
						<div
							style={{ fontSize: 11, color: S.onSurfaceMuted, fontWeight: 500 }}
						>
							{d.label}
						</div>
					</div>
				);
			})}
		</div>
	);
};

// Donut chart
const Donut = ({ data, size = 200, total }) => {
	const radius = size / 2 - 20;
	const circumference = 2 * Math.PI * radius;
	const sum = data.reduce((a, d) => a + d.v, 0);
	let offset = 0;
	return (
		<div style={{ width: size, height: size, position: "relative" }}>
			<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
				{data.map((d, i) => {
					const frac = d.v / sum;
					const dash = frac * circumference;
					const rot = (offset / circumference) * 360 - 90;
					const el = (
						<circle
							key={i}
							cx={size / 2}
							cy={size / 2}
							r={radius}
							fill="none"
							stroke={d.color}
							strokeWidth={28}
							strokeDasharray={`${dash} ${circumference - dash}`}
							strokeDashoffset={0}
							transform={`rotate(${rot} ${size / 2} ${size / 2})`}
						/>
					);
					offset += dash;
					return el;
				})}
			</svg>
			<div
				style={{
					position: "absolute",
					inset: 0,
					display: "grid",
					placeItems: "center",
					textAlign: "center",
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
						}}
					>
						Total
					</div>
					<div
						style={{
							fontSize: 22,
							fontWeight: 600,
							letterSpacing: "-0.02em",
							fontVariantNumeric: "tabular-nums",
							marginTop: 4,
						}}
					>
						{total}
					</div>
				</div>
			</div>
		</div>
	);
};

// 8.1 Admin Dashboard
const AdminDashboard = () => (
	<AppShell
		role="admin"
		active="dashboard"
		breadcrumb="Dashboard"
		churchName="Grace Community"
		userName="Sarah Chen"
	>
		<div style={{ height: "100%", overflow: "auto", paddingRight: 8 }}>
			<PageHeader
				overline="Overview · April 2026"
				title="Good afternoon, Sarah."
				subtitle="Here's how giving is trending at Grace Community Church."
				action={
					<Button variant="primary" icon="plus">
						Record a gift
					</Button>
				}
			/>

			{/* KPI strip */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(4, 1fr)",
					gap: 16,
					marginBottom: 24,
				}}
			>
				<StatCard
					label="Total this month"
					value={<Amount value="28,450" size="display" gradient />}
					delta="12%"
					deltaDirection="up"
					caption="vs. $25,400 in March"
				/>
				<StatCard
					label="Gifts this month"
					value="142"
					delta="8%"
					deltaDirection="up"
					caption="34 unique givers"
				/>
				<StatCard
					label="Active members"
					value="234"
					caption="3 new this month"
				/>
				<StatCard
					label="Upcoming events"
					value="6"
					caption="Next: Sunday Worship · Apr 28"
				/>
			</div>

			{/* Charts */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1.5fr 1fr",
					gap: 16,
					marginBottom: 24,
				}}
			>
				<Card>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: 8,
						}}
					>
						<SectionTitle title="Monthly trend" />
						<div
							style={{
								display: "flex",
								gap: 4,
								background: S.surfaceContainerLow,
								padding: 4,
								borderRadius: 9999,
							}}
						>
							{["30d", "90d", "YTD", "Custom"].map((t, i) => (
								<div
									key={i}
									style={{
										padding: "5px 12px",
										borderRadius: 9999,
										fontSize: 12,
										fontWeight: 500,
										background:
											i === 2 ? S.surfaceContainerLowest : "transparent",
										color: i === 2 ? S.onSurface : S.onSurfaceMuted,
									}}
								>
									{t}
								</div>
							))}
						</div>
					</div>
					<BarChart
						gradient
						data={[
							{ label: "May", v: 18 },
							{ label: "Jun", v: 21 },
							{ label: "Jul", v: 19 },
							{ label: "Aug", v: 24 },
							{ label: "Sep", v: 22 },
							{ label: "Oct", v: 26 },
							{ label: "Nov", v: 31, label2: "$31k" },
							{ label: "Dec", v: 38, label2: "$38k" },
							{ label: "Jan", v: 27 },
							{ label: "Feb", v: 24 },
							{ label: "Mar", v: 25 },
							{ label: "Apr", v: 28, highlight: true, label2: "$28k" },
						]}
					/>
				</Card>

				<Card>
					<SectionTitle title="Income breakdown" />
					<div style={{ display: "flex", alignItems: "center", gap: 20 }}>
						<Donut
							total="$28,450"
							data={[
								{ v: 42, color: S.txTithe },
								{ v: 24, color: S.txOffering },
								{ v: 16, color: S.txMission },
								{ v: 10, color: S.txFirstFruit },
								{ v: 8, color: S.txCommitment },
							]}
						/>
						<div
							style={{
								flex: 1,
								display: "flex",
								flexDirection: "column",
								gap: 10,
							}}
						>
							{[
								{ c: S.txTithe, l: "Tithe", p: "42%" },
								{ c: S.txOffering, l: "Offering", p: "24%" },
								{ c: S.txMission, l: "Mission", p: "16%" },
								{ c: S.txFirstFruit, l: "First Fruit", p: "10%" },
								{ c: S.txCommitment, l: "Commitment", p: "8%" },
							].map((x, i) => (
								<div
									key={i}
									style={{
										display: "flex",
										alignItems: "center",
										gap: 10,
										fontSize: 13,
									}}
								>
									<span
										style={{
											width: 10,
											height: 10,
											borderRadius: 3,
											background: x.c,
										}}
									/>
									<span style={{ flex: 1, color: S.onSurfaceVariant }}>
										{x.l}
									</span>
									<span
										style={{
											fontWeight: 600,
											fontVariantNumeric: "tabular-nums",
										}}
									>
										{x.p}
									</span>
								</div>
							))}
						</div>
					</div>
				</Card>
			</div>

			{/* Row 3 */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: 16,
					marginBottom: 16,
				}}
			>
				<Card>
					<SectionTitle
						title="Recent gifts"
						action={
							<span style={{ fontSize: 13, color: S.primary, fontWeight: 500 }}>
								View all →
							</span>
						}
					/>
					{[
						{
							name: "Amara Okonkwo",
							type: "Tithe",
							amount: "250.00",
							date: "Today, 2:14pm",
						},
						{
							name: "Daniel Tan",
							type: "Offering",
							amount: "100.00",
							date: "Today, 10:42am",
						},
						{
							name: "Maria Reyes",
							type: "Mission",
							amount: "500.00",
							date: "Yesterday",
						},
						{
							name: "Anonymous",
							type: "Offering",
							amount: "80.00",
							date: "Yesterday",
							anon: true,
						},
						{
							name: "Josh Whitfield",
							type: "Tithe",
							amount: "325.00",
							date: "2 days ago",
						},
						{
							name: "Grace Adeyemi",
							type: "First Fruit",
							amount: "600.00",
							date: "3 days ago",
						},
					].map((r, i) => (
						<div
							key={i}
							style={{
								display: "grid",
								gridTemplateColumns: "36px 1fr auto auto",
								gap: 12,
								alignItems: "center",
								padding: "10px 8px",
								borderRadius: 10,
								background: i === 0 ? S.surfaceContainerLow : "transparent",
							}}
						>
							{r.anon ? (
								<div
									style={{
										width: 32,
										height: 32,
										borderRadius: "50%",
										background: S.surfaceContainer,
										display: "grid",
										placeItems: "center",
									}}
								>
									<Icon name="user" size={14} color={S.onSurfaceMuted} />
								</div>
							) : (
								<Avatar name={r.name} size={32} />
							)}
							<div>
								<div
									style={{
										fontSize: 13,
										fontWeight: 500,
										color: r.anon ? S.onSurfaceMuted : S.onSurface,
										fontStyle: r.anon ? "italic" : "normal",
									}}
								>
									{r.name}
								</div>
								<div style={{ fontSize: 11, color: S.onSurfaceMuted }}>
									{r.date}
								</div>
							</div>
							<TypeBadge type={r.type} />
							<Amount value={r.amount} />
						</div>
					))}
				</Card>

				<Card>
					<SectionTitle
						title="Coming up"
						action={
							<span style={{ fontSize: 13, color: S.primary, fontWeight: 500 }}>
								See events →
							</span>
						}
					/>
					{[
						{
							day: "28",
							month: "APR",
							title: "Sunday Worship Service",
							type: "Service",
							c: "indigo",
							loc: "Main Sanctuary",
						},
						{
							day: "05",
							month: "MAY",
							title: "Mission Sunday",
							type: "Special",
							c: "blue",
							loc: "Main Sanctuary",
						},
						{
							day: "12",
							month: "MAY",
							title: "Annual Harvest Thanksgiving",
							type: "Fundraiser",
							c: "amber",
							loc: "Fellowship Hall",
						},
						{
							day: "19",
							month: "MAY",
							title: "Youth Overnight Retreat",
							type: "Special",
							c: "blue",
							loc: "Grace Lake Camp",
						},
						{
							day: "26",
							month: "MAY",
							title: "Sunday Worship Service",
							type: "Service",
							c: "indigo",
							loc: "Main Sanctuary",
						},
					].map((e, i) => (
						<div
							key={i}
							style={{
								display: "flex",
								gap: 12,
								alignItems: "center",
								padding: "10px 8px",
							}}
						>
							<div
								style={{
									width: 48,
									borderRadius: 8,
									background: S.surfaceContainerLow,
									padding: "6px 0",
									textAlign: "center",
									flexShrink: 0,
								}}
							>
								<div
									style={{
										fontSize: 17,
										fontWeight: 600,
										letterSpacing: "-0.02em",
									}}
								>
									{e.day}
								</div>
								<div
									style={{
										fontSize: 9,
										fontWeight: 600,
										letterSpacing: "0.08em",
										color: S.onSurfaceMuted,
									}}
								>
									{e.month}
								</div>
							</div>
							<div style={{ flex: 1 }}>
								<div style={{ fontSize: 13, fontWeight: 500 }}>{e.title}</div>
								<div style={{ fontSize: 11, color: S.onSurfaceMuted }}>
									{e.loc}
								</div>
							</div>
							<Badge color={e.c}>{e.type}</Badge>
						</div>
					))}
				</Card>
			</div>
		</div>
	</AppShell>
);

// 8.2 Admin — Members list
const AdminMembers = () => (
	<AppShell
		role="admin"
		active="members"
		breadcrumb="Members"
		churchName="Grace Community"
		userName="Sarah Chen"
	>
		<div style={{ height: "100%", overflow: "auto" }}>
			<PageHeader
				overline="Directory"
				title="Members."
				subtitle="Everyone giving at Grace Community Church."
				action={
					<>
						<Button variant="secondary" icon="mail">
							Invite member
						</Button>
						<Button variant="primary" icon="plus">
							Add member
						</Button>
					</>
				}
			/>

			<div
				style={{
					background: S.surfaceContainerLow,
					borderRadius: 16,
					padding: 12,
					display: "flex",
					gap: 10,
					alignItems: "center",
					marginBottom: 16,
				}}
			>
				<div style={{ flex: 1, maxWidth: 320 }}>
					<Input icon="search" placeholder="Search by name or email…" />
				</div>
				<Chip icon="chevronDown">Status: Active</Chip>
				<Chip icon="chevronDown">All links</Chip>
				<Chip icon="chevronDown">Sort: Last gift</Chip>
			</div>

			<div
				style={{
					display: "flex",
					gap: 32,
					padding: "8px 24px 20px",
					fontSize: 13,
					color: S.onSurfaceVariant,
				}}
			>
				<span>
					<strong style={{ color: S.onSurface }}>234</strong> members
				</span>
				<span>
					<strong style={{ color: S.onSurface }}>189</strong> active
				</span>
				<span>
					<strong style={{ color: S.onSurface }}>45</strong> temp (unlinked)
				</span>
			</div>

			<Table
				columns={[
					{ key: "member", label: "Member" },
					{ key: "email", label: "Email", width: "220px" },
					{ key: "phone", label: "Phone", width: "140px" },
					{ key: "status", label: "Status", width: "100px" },
					{ key: "linked", label: "Linked", width: "80px", align: "center" },
					{ key: "last", label: "Last gift", width: "140px" },
					{ key: "act", label: "", width: "40px", align: "right" },
				]}
				rows={[
					{
						_hover: true,
						member: (
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: 10,
								}}
							>
								<Avatar name="Amara Okonkwo" size={32} />
								<span style={{ fontWeight: 500 }}>Amara Okonkwo</span>
							</span>
						),
						email: (
							<span style={{ color: S.onSurfaceMuted }}>
								amara.ok@email.com
							</span>
						),
						phone: <span style={{ color: S.onSurfaceMuted }}>+1 555 0142</span>,
						status: <StatusBadge status="Active" />,
						linked: (
							<span style={{ color: S.primary }}>
								<Icon name="check" size={18} color={S.primary} />
							</span>
						),
						last: (
							<span>
								<span style={{ fontSize: 12, color: S.onSurfaceMuted }}>
									Apr 21
								</span>{" "}
								· <Amount value="250" />
							</span>
						),
						act: <Icon name="dots" size={18} color={S.onSurfaceMuted} />,
					},
					{
						member: (
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: 10,
								}}
							>
								<Avatar name="Daniel Tan" size={32} />
								<span style={{ fontWeight: 500 }}>Daniel Tan</span>
							</span>
						),
						email: (
							<span style={{ color: S.onSurfaceMuted }}>d.tan@email.com</span>
						),
						phone: <span style={{ color: S.onSurfaceMuted }}>+1 555 0193</span>,
						status: <StatusBadge status="Active" />,
						linked: <Icon name="check" size={18} color={S.primary} />,
						last: (
							<span>
								<span style={{ fontSize: 12, color: S.onSurfaceMuted }}>
									Apr 21
								</span>{" "}
								· <Amount value="100" />
							</span>
						),
						act: <Icon name="dots" size={18} color={S.onSurfaceMuted} />,
					},
					{
						member: (
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: 10,
								}}
							>
								<Avatar name="Maria Reyes" size={32} />
								<span style={{ fontWeight: 500 }}>Maria Reyes</span>{" "}
								<Badge color="clay">temp</Badge>
							</span>
						),
						email: <span style={{ color: S.onSurfaceMuted }}>—</span>,
						phone: <span style={{ color: S.onSurfaceMuted }}>+1 555 0271</span>,
						status: <StatusBadge status="Active" />,
						linked: (
							<span
								style={{
									width: 18,
									height: 18,
									borderRadius: "50%",
									display: "inline-block",
									background: S.surfaceContainerHigh,
								}}
							/>
						),
						last: (
							<span>
								<span style={{ fontSize: 12, color: S.onSurfaceMuted }}>
									Apr 20
								</span>{" "}
								· <Amount value="500" />
							</span>
						),
						act: <Icon name="dots" size={18} color={S.onSurfaceMuted} />,
					},
					{
						member: (
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: 10,
								}}
							>
								<Avatar name="Josh Whitfield" size={32} />
								<span style={{ fontWeight: 500 }}>Josh Whitfield</span>
							</span>
						),
						email: (
							<span style={{ color: S.onSurfaceMuted }}>josh.w@email.com</span>
						),
						phone: <span style={{ color: S.onSurfaceMuted }}>—</span>,
						status: <StatusBadge status="Active" />,
						linked: <Icon name="check" size={18} color={S.primary} />,
						last: (
							<span>
								<span style={{ fontSize: 12, color: S.onSurfaceMuted }}>
									Apr 19
								</span>{" "}
								· <Amount value="325" />
							</span>
						),
						act: <Icon name="dots" size={18} color={S.onSurfaceMuted} />,
					},
					{
						member: (
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: 10,
								}}
							>
								<Avatar name="Grace Adeyemi" size={32} />
								<span style={{ fontWeight: 500 }}>Grace Adeyemi</span>
							</span>
						),
						email: (
							<span style={{ color: S.onSurfaceMuted }}>grace.a@email.com</span>
						),
						phone: <span style={{ color: S.onSurfaceMuted }}>+1 555 0811</span>,
						status: <StatusBadge status="Active" />,
						linked: <Icon name="check" size={18} color={S.primary} />,
						last: (
							<span>
								<span style={{ fontSize: 12, color: S.onSurfaceMuted }}>
									Apr 18
								</span>{" "}
								· <Amount value="600" />
							</span>
						),
						act: <Icon name="dots" size={18} color={S.onSurfaceMuted} />,
					},
					{
						member: (
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: 10,
								}}
							>
								<Avatar name="Peter Nguyen" size={32} />
								<span style={{ fontWeight: 500 }}>Peter Nguyen</span>{" "}
								<Badge color="clay">temp</Badge>
							</span>
						),
						email: <span style={{ color: S.onSurfaceMuted }}>—</span>,
						phone: <span style={{ color: S.onSurfaceMuted }}>+1 555 0733</span>,
						status: <StatusBadge status="Active" />,
						linked: (
							<span
								style={{
									width: 18,
									height: 18,
									borderRadius: "50%",
									display: "inline-block",
									background: S.surfaceContainerHigh,
								}}
							/>
						),
						last: (
							<span>
								<span style={{ fontSize: 12, color: S.onSurfaceMuted }}>
									Apr 14
								</span>{" "}
								· <Amount value="80" />
							</span>
						),
						act: <Icon name="dots" size={18} color={S.onSurfaceMuted} />,
					},
					{
						member: (
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: 10,
								}}
							>
								<Avatar name="Rebecca Park" size={32} />
								<span style={{ fontWeight: 500 }}>Rebecca Park</span>
							</span>
						),
						email: (
							<span style={{ color: S.onSurfaceMuted }}>r.park@email.com</span>
						),
						phone: <span style={{ color: S.onSurfaceMuted }}>—</span>,
						status: <StatusBadge status="Inactive" />,
						linked: <Icon name="check" size={18} color={S.primary} />,
						last: <span style={{ color: S.onSurfaceMuted }}>Jan 12</span>,
						act: <Icon name="dots" size={18} color={S.onSurfaceMuted} />,
					},
				]}
			/>

			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					padding: "16px 24px",
					fontSize: 13,
					color: S.onSurfaceMuted,
				}}
			>
				<span>Showing 1–20 of 234</span>
				<div style={{ display: "flex", gap: 6 }}>
					<Button variant="secondary" size="sm">
						←
					</Button>
					<Button variant="secondary" size="sm">
						1
					</Button>
					<Button variant="primary" size="sm">
						2
					</Button>
					<Button variant="secondary" size="sm">
						3
					</Button>
					<Button variant="secondary" size="sm">
						…
					</Button>
					<Button variant="secondary" size="sm">
						12
					</Button>
					<Button variant="secondary" size="sm">
						→
					</Button>
				</div>
			</div>
		</div>
	</AppShell>
);

Object.assign(window, { AdminDashboard, AdminMembers, BarChart, Donut });
