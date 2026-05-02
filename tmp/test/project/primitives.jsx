// Reusable primitives for ChurchFlow designs
const S = window.SANCTUARY;

// ========== ICONS (minimal line-art, 20px default) ==========
const Icon = ({
	name,
	size = 20,
	color = "currentColor",
	strokeWidth = 1.6,
}) => {
	const props = {
		width: size,
		height: size,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: color,
		strokeWidth,
		strokeLinecap: "round",
		strokeLinejoin: "round",
	};
	const paths = {
		home: (
			<>
				<path d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" />
			</>
		),
		users: (
			<>
				<circle cx="9" cy="8" r="4" />
				<path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
				<circle cx="17" cy="7" r="3" />
				<path d="M22 21v-1a4 4 0 0 0-4-4" />
			</>
		),
		user: (
			<>
				<circle cx="12" cy="8" r="4" />
				<path d="M4 21v-1a7 7 0 0 1 14 0v1" />
			</>
		),
		calendar: (
			<>
				<rect x="3" y="5" width="18" height="16" rx="2" />
				<path d="M3 9h18M8 3v4M16 3v4" />
			</>
		),
		receipt: (
			<>
				<path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2z" />
				<path d="M8 8h8M8 12h8M8 16h5" />
			</>
		),
		chart: (
			<>
				<path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
			</>
		),
		mail: (
			<>
				<rect x="3" y="5" width="18" height="14" rx="2" />
				<path d="M3 7l9 7 9-7" />
			</>
		),
		settings: (
			<>
				<circle cx="12" cy="12" r="3" />
				<path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
			</>
		),
		search: (
			<>
				<circle cx="11" cy="11" r="7" />
				<path d="m21 21-4.3-4.3" />
			</>
		),
		bell: (
			<>
				<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
				<path d="M10 21a2 2 0 0 0 4 0" />
			</>
		),
		plus: (
			<>
				<path d="M12 5v14M5 12h14" />
			</>
		),
		check: (
			<>
				<path d="M20 6 9 17l-5-5" />
			</>
		),
		x: (
			<>
				<path d="M18 6 6 18M6 6l12 12" />
			</>
		),
		chevronDown: (
			<>
				<path d="m6 9 6 6 6-6" />
			</>
		),
		chevronRight: (
			<>
				<path d="m9 6 6 6-6 6" />
			</>
		),
		chevronLeft: (
			<>
				<path d="m15 6-6 6 6 6" />
			</>
		),
		pin: (
			<>
				<path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z" />
				<circle cx="12" cy="9" r="3" />
			</>
		),
		dots: (
			<>
				<circle cx="12" cy="5" r="1.5" />
				<circle cx="12" cy="12" r="1.5" />
				<circle cx="12" cy="19" r="1.5" />
			</>
		),
		filter: (
			<>
				<path d="M4 5h16M7 12h10M10 19h4" />
			</>
		),
		cash: (
			<>
				<rect x="2" y="6" width="20" height="12" rx="2" />
				<circle cx="12" cy="12" r="3" />
			</>
		),
		check_rect: (
			<>
				<rect x="3" y="5" width="18" height="14" rx="2" />
				<path d="M7 10h6M7 14h10" />
			</>
		),
		bank: (
			<>
				<path d="M3 10h18M4 10 12 4l8 6M6 10v7M10 10v7M14 10v7M18 10v7M3 20h18" />
			</>
		),
		phone: (
			<>
				<path d="M6 3h12v18H6z" />
				<path d="M10 18h4" />
			</>
		),
		google: (
			<>
				<path
					d="M21.35 11.1h-9.17v2.96h5.24c-.22 1.18-.88 2.18-1.87 2.85v2.37h3.02c1.77-1.63 2.78-4.03 2.78-6.87 0-.56-.05-1.1-.14-1.61z"
					fill="#4285F4"
					stroke="none"
				/>
				<path
					d="M12.18 21c2.52 0 4.64-.83 6.18-2.26l-3.02-2.37c-.84.56-1.91.9-3.16.9-2.43 0-4.49-1.64-5.22-3.85H3.84v2.42C5.38 18.9 8.55 21 12.18 21z"
					fill="#34A853"
					stroke="none"
				/>
				<path
					d="M6.96 13.42a5.4 5.4 0 0 1 0-3.44V7.56H3.84a8.99 8.99 0 0 0 0 8.28z"
					fill="#FBBC05"
					stroke="none"
				/>
				<path
					d="M12.18 6.13c1.37 0 2.6.47 3.57 1.4l2.67-2.67C16.81 3.47 14.7 2.6 12.18 2.6c-3.63 0-6.8 2.1-8.34 5.16l3.12 2.42c.73-2.21 2.79-3.85 5.22-3.85z"
					fill="#EA4335"
					stroke="none"
				/>
			</>
		),
		book: (
			<>
				<path d="M4 4a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2z" />
				<path d="M8 7h6M8 11h6" />
			</>
		),
		location: (
			<>
				<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
				<circle cx="12" cy="10" r="2.5" />
			</>
		),
		link: (
			<>
				<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
				<path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
			</>
		),
		edit: (
			<>
				<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
			</>
		),
		trash: (
			<>
				<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
			</>
		),
		arrowRight: (
			<>
				<path d="M5 12h14M13 5l7 7-7 7" />
			</>
		),
		arrowUp: (
			<>
				<path d="m6 15 6-6 6 6" />
			</>
		),
		download: (
			<>
				<path d="M12 3v14M6 11l6 6 6-6M4 21h16" />
			</>
		),
		logo: (
			<>
				<path d="M4 20V8l8-5 8 5v12" />
				<path d="M9 20v-7h6v7" />
			</>
		),
	};
	return <svg {...props}>{paths[name] || null}</svg>;
};

// ========== LOGO / WORDMARK ==========
const Wordmark = ({ size = "md", color }) => {
	const sizes = { sm: 14, md: 18, lg: 22 };
	const fs = sizes[size];
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 8,
				color: color || S.primary,
				fontWeight: 600,
				letterSpacing: "-0.02em",
				fontSize: fs,
			}}
		>
			<div
				style={{
					width: fs + 6,
					height: fs + 6,
					borderRadius: 8,
					background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
					display: "grid",
					placeItems: "center",
					color: "#fff",
				}}
			>
				<svg
					width={fs - 2}
					height={fs - 2}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M4 20V10l8-6 8 6v10" />
					<path d="M10 20v-6h4v6" />
				</svg>
			</div>
			<span>ChurchFlow</span>
		</div>
	);
};

// ========== BUTTONS ==========
const Button = ({
	children,
	variant = "primary",
	size = "md",
	icon,
	iconRight,
	fullWidth,
	disabled,
	destructive,
	style,
	...rest
}) => {
	const sizes = {
		sm: { padding: "6px 14px", fontSize: 13, height: 32, gap: 6 },
		md: { padding: "10px 20px", fontSize: 14, height: 40, gap: 8 },
		lg: { padding: "14px 24px", fontSize: 15, height: 48, gap: 10 },
	};
	const common = {
		...sizes[size],
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 9999,
		fontWeight: 500,
		cursor: disabled ? "default" : "pointer",
		border: "none",
		letterSpacing: "-0.005em",
		whiteSpace: "nowrap",
		width: fullWidth ? "100%" : undefined,
		opacity: disabled ? 0.5 : 1,
		fontFamily: "inherit",
	};
	const variants = {
		primary: {
			background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
			color: "#fff",
		},
		secondary: {
			background: S.surfaceContainer,
			color: S.onSurface,
		},
		tertiary: {
			background: "transparent",
			color: destructive ? S.error : S.onSurfaceVariant,
		},
		ghost: {
			background: "transparent",
			color: S.onSurface,
		},
	};
	return (
		<button
			style={{ ...common, ...variants[variant], ...style }}
			disabled={disabled}
			{...rest}
		>
			{icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />}
			{children}
			{iconRight && <Icon name={iconRight} size={size === "sm" ? 14 : 16} />}
		</button>
	);
};

// ========== BADGES ==========
const Badge = ({ children, color = "neutral", dot }) => {
	const palettes = {
		neutral: { bg: S.surfaceContainerHigh, fg: S.onSurfaceVariant },
		indigo: { bg: "#E0E7FF", fg: "#3730A3" },
		green: { bg: "#D1FAE5", fg: "#065F46" },
		blue: { bg: "#DBEAFE", fg: "#1E40AF" },
		amber: { bg: "#FEF3C7", fg: "#92400E" },
		purple: { bg: "#EDE9FE", fg: "#5B21B6" },
		teal: { bg: "#CCFBF1", fg: "#115E59" },
		clay: { bg: S.tertiaryContainer, fg: S.tertiary },
		red: { bg: S.errorContainer, fg: S.error },
		gray: { bg: S.surfaceContainer, fg: S.onSurfaceMuted },
	};
	const p = palettes[color] || palettes.neutral;
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 6,
				padding: "3px 10px",
				borderRadius: 9999,
				background: p.bg,
				color: p.fg,
				fontSize: 12,
				fontWeight: 500,
				letterSpacing: "-0.005em",
				whiteSpace: "nowrap",
			}}
		>
			{dot && (
				<span
					style={{ width: 6, height: 6, borderRadius: "50%", background: p.fg }}
				/>
			)}
			{children}
		</span>
	);
};

const TypeBadge = ({ type }) => {
	const map = {
		Tithe: "indigo",
		Offering: "green",
		Mission: "blue",
		"First Fruit": "amber",
		Commitment: "purple",
		Donation: "teal",
		Other: "neutral",
	};
	return (
		<Badge color={map[type] || "neutral"} dot>
			{type}
		</Badge>
	);
};

const StatusBadge = ({ status }) => {
	const map = {
		Active: { c: "green", label: "Active" },
		Upcoming: { c: "green", label: "Upcoming" },
		Pending: { c: "amber", label: "Pending" },
		Completed: { c: "gray", label: "Completed" },
		Cancelled: { c: "red", label: "Cancelled" },
		Inactive: { c: "neutral", label: "Inactive" },
		Ongoing: { c: "blue", label: "Ongoing" },
	};
	const s = map[status] || { c: "neutral", label: status };
	return (
		<Badge color={s.c} dot>
			{s.label}
		</Badge>
	);
};

// ========== AVATAR ==========
const Avatar = ({ name = "", size = 36, src, color }) => {
	const initials = name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
	// deterministic color from name
	const palette = [
		"#4F46E5",
		"#7E3000",
		"#0D9488",
		"#9333EA",
		"#2563EB",
		"#16A34A",
		"#D97706",
	];
	const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
	const bg = color || palette[hash % palette.length];
	return (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: "50%",
				background: src ? `url(${src}) center/cover` : `${bg}22`,
				color: bg,
				display: "grid",
				placeItems: "center",
				fontSize: size * 0.38,
				fontWeight: 600,
				letterSpacing: "-0.02em",
				flexShrink: 0,
			}}
		>
			{!src && initials}
		</div>
	);
};

// ========== PAGE HEADER ==========
const PageHeader = ({ overline, title, subtitle, action }) => (
	<div
		style={{
			display: "flex",
			alignItems: "flex-end",
			justifyContent: "space-between",
			marginBottom: 32,
			gap: 24,
		}}
	>
		<div style={{ flex: 1, minWidth: 0 }}>
			{overline && (
				<div
					style={{
						fontSize: 11,
						fontWeight: 600,
						letterSpacing: "0.08em",
						textTransform: "uppercase",
						color: S.onSurfaceMuted,
						marginBottom: 10,
					}}
				>
					{overline}
				</div>
			)}
			<h1
				style={{
					fontSize: 36,
					fontWeight: 600,
					letterSpacing: "-0.025em",
					color: S.onSurface,
					margin: 0,
					lineHeight: 1.1,
				}}
			>
				{title}
			</h1>
			{subtitle && (
				<div
					style={{
						fontSize: 15,
						color: S.onSurfaceVariant,
						marginTop: 10,
						maxWidth: 640,
						lineHeight: 1.5,
					}}
				>
					{subtitle}
				</div>
			)}
		</div>
		{action && (
			<div style={{ display: "flex", gap: 10, flexShrink: 0 }}>{action}</div>
		)}
	</div>
);

// ========== CARD ==========
const Card = ({ children, padding = 24, style, bg }) => (
	<div
		style={{
			background: bg || S.surfaceContainerLowest,
			borderRadius: 16,
			padding,
			...style,
		}}
	>
		{children}
	</div>
);

// ========== STAT CARD ==========
const StatCard = ({
	label,
	value,
	caption,
	delta,
	deltaDirection,
	icon,
	accent,
}) => (
	<Card padding={24}>
		<div
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "flex-start",
				marginBottom: 16,
			}}
		>
			<div
				style={{
					fontSize: 11,
					fontWeight: 600,
					letterSpacing: "0.08em",
					textTransform: "uppercase",
					color: S.onSurfaceMuted,
				}}
			>
				{label}
			</div>
			{delta && (
				<Badge
					color={
						deltaDirection === "up"
							? "green"
							: deltaDirection === "down"
								? "red"
								: "neutral"
					}
				>
					{deltaDirection === "up" ? "▲" : deltaDirection === "down" ? "▼" : ""}{" "}
					{delta}
				</Badge>
			)}
		</div>
		<div
			style={{
				fontSize: 32,
				fontWeight: 600,
				letterSpacing: "-0.03em",
				color: S.onSurface,
				fontVariantNumeric: "tabular-nums",
				lineHeight: 1,
				background: accent
					? `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`
					: undefined,
				WebkitBackgroundClip: accent ? "text" : undefined,
				WebkitTextFillColor: accent ? "transparent" : undefined,
			}}
		>
			{value}
		</div>
		{caption && (
			<div style={{ fontSize: 13, color: S.onSurfaceMuted, marginTop: 10 }}>
				{caption}
			</div>
		)}
	</Card>
);

// ========== AMOUNT DISPLAY ==========
const Amount = ({ value, size = "row", currency = "$", gradient }) => {
	const sizes = { label: 13, row: 14, display: 48 };
	return (
		<span
			style={{
				fontSize: sizes[size],
				fontWeight: size === "display" ? 600 : 500,
				letterSpacing: size === "display" ? "-0.03em" : "-0.005em",
				fontVariantNumeric: "tabular-nums",
				color: gradient ? undefined : S.onSurface,
				background: gradient
					? `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`
					: undefined,
				WebkitBackgroundClip: gradient ? "text" : undefined,
				WebkitTextFillColor: gradient ? "transparent" : undefined,
			}}
		>
			<span style={{ opacity: 0.6, marginRight: 2 }}>{currency}</span>
			{value}
		</span>
	);
};

// ========== INPUT ==========
const Input = ({
	label,
	icon,
	value,
	placeholder,
	helper,
	error,
	prefix,
	suffix,
	fullWidth = true,
	style,
}) => (
	<div style={{ width: fullWidth ? "100%" : undefined }}>
		{label && (
			<div
				style={{
					fontSize: 13,
					fontWeight: 500,
					color: S.onSurfaceVariant,
					marginBottom: 8,
				}}
			>
				{label}
			</div>
		)}
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 8,
				background: S.surfaceContainerHigh,
				borderRadius: 12,
				padding: "0 14px",
				height: 44,
				color: S.onSurface,
				...style,
			}}
		>
			{icon && <Icon name={icon} size={16} color={S.onSurfaceMuted} />}
			{prefix && (
				<span style={{ color: S.onSurfaceMuted, fontSize: 14 }}>{prefix}</span>
			)}
			<span
				style={{
					flex: 1,
					fontSize: 14,
					color: value ? S.onSurface : S.onSurfaceMuted,
					fontVariantNumeric: "tabular-nums",
				}}
			>
				{value || placeholder}
			</span>
			{suffix && (
				<span style={{ color: S.onSurfaceMuted, fontSize: 13 }}>{suffix}</span>
			)}
		</div>
		{helper && !error && (
			<div style={{ fontSize: 12, color: S.onSurfaceMuted, marginTop: 6 }}>
				{helper}
			</div>
		)}
		{error && (
			<div style={{ fontSize: 12, color: S.error, marginTop: 6 }}>{error}</div>
		)}
	</div>
);

// ========== CHIP ==========
const Chip = ({ children, active, icon, onClick }) => (
	<button
		onClick={onClick}
		style={{
			display: "inline-flex",
			alignItems: "center",
			gap: 6,
			padding: "6px 14px",
			borderRadius: 9999,
			background: active ? S.onSurface : S.surfaceContainerLowest,
			color: active ? S.surfaceContainerLowest : S.onSurfaceVariant,
			fontSize: 13,
			fontWeight: 500,
			border: "none",
			cursor: "pointer",
			fontFamily: "inherit",
			letterSpacing: "-0.005em",
		}}
	>
		{icon && <Icon name={icon} size={14} />}
		{children}
	</button>
);

// ========== SIDEBAR ==========
const Sidebar = ({
	role = "admin",
	active,
	churchName = "Grace Community",
	userName = "Sarah Chen",
}) => {
	const navs = {
		admin: [
			{ icon: "home", label: "Dashboard", key: "dashboard" },
			{ icon: "users", label: "Members", key: "members" },
			{ icon: "calendar", label: "Events", key: "events" },
			{ icon: "receipt", label: "Transactions", key: "transactions" },
			{ icon: "chart", label: "Reports", key: "reports" },
			{ icon: "mail", label: "Invitations", key: "invitations" },
			{ icon: "settings", label: "Settings", key: "settings" },
		],
		member: [
			{ icon: "home", label: "Dashboard", key: "dashboard" },
			{ icon: "book", label: "My Giving", key: "transactions" },
			{ icon: "calendar", label: "Events", key: "events" },
			{ icon: "user", label: "Profile", key: "profile" },
		],
		super: [
			{ icon: "home", label: "Tenants", key: "tenants" },
			{ icon: "users", label: "Admins", key: "admins" },
			{ icon: "settings", label: "Settings", key: "settings" },
		],
	};
	const items = navs[role];
	const roleLabel =
		role === "admin" ? "Admin" : role === "super" ? "Super" : "Member";
	return (
		<div
			style={{
				width: 260,
				height: "100%",
				background: S.surfaceContainerLowest,
				padding: "24px 16px",
				display: "flex",
				flexDirection: "column",
				flexShrink: 0,
			}}
		>
			{/* Church switcher */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 10,
					padding: "10px 12px",
					borderRadius: 12,
					background: S.surfaceContainerLow,
					marginBottom: 20,
				}}
			>
				<div
					style={{
						width: 32,
						height: 32,
						borderRadius: 8,
						background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
						display: "grid",
						placeItems: "center",
						color: "#fff",
						fontSize: 13,
						fontWeight: 600,
					}}
				>
					{churchName
						.split(" ")
						.map((w) => w[0])
						.join("")
						.slice(0, 2)}
				</div>
				<div style={{ flex: 1, minWidth: 0 }}>
					<div
						style={{
							fontSize: 13,
							fontWeight: 600,
							color: S.onSurface,
							letterSpacing: "-0.01em",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{churchName}
					</div>
					<div style={{ fontSize: 11, color: S.onSurfaceMuted }}>
						Switch church
					</div>
				</div>
				<Icon name="chevronDown" size={16} color={S.onSurfaceMuted} />
			</div>

			{/* Nav */}
			<div
				style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}
			>
				{items.map((item) => (
					<div
						key={item.key}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 12,
							padding: "10px 14px",
							borderRadius: 9999,
							background: active === item.key ? S.primaryFixed : "transparent",
							color: active === item.key ? S.primary : S.onSurfaceVariant,
							fontSize: 14,
							fontWeight: active === item.key ? 600 : 500,
							cursor: "pointer",
							letterSpacing: "-0.005em",
						}}
					>
						<Icon name={item.icon} size={18} />
						{item.label}
					</div>
				))}
			</div>

			{/* User chip */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 10,
					padding: "10px 12px",
					borderRadius: 12,
					background: S.surfaceContainerLow,
					marginTop: 16,
				}}
			>
				<Avatar name={userName} size={32} />
				<div style={{ flex: 1, minWidth: 0 }}>
					<div
						style={{
							fontSize: 13,
							fontWeight: 600,
							color: S.onSurface,
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{userName}
					</div>
					<div style={{ fontSize: 11, color: S.onSurfaceMuted }}>
						{roleLabel}
					</div>
				</div>
				<Icon name="chevronDown" size={14} color={S.onSurfaceMuted} />
			</div>
		</div>
	);
};

// ========== TOP BAR ==========
const TopBar = ({ breadcrumb = "Dashboard", showSwitcher }) => (
	<div
		style={{
			height: 72,
			display: "flex",
			alignItems: "center",
			gap: 16,
			padding: "0 32px",
			background: "transparent",
		}}
	>
		<div
			style={{
				fontSize: 11,
				fontWeight: 600,
				letterSpacing: "0.08em",
				textTransform: "uppercase",
				color: S.onSurfaceMuted,
			}}
		>
			{breadcrumb}
		</div>
		<div style={{ flex: 1 }} />
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 10,
				background: S.surfaceContainerLowest,
				borderRadius: 9999,
				padding: "8px 16px",
				width: 280,
			}}
		>
			<Icon name="search" size={15} color={S.onSurfaceMuted} />
			<span style={{ fontSize: 13, color: S.onSurfaceMuted }}>
				Search members, events…
			</span>
			<span
				style={{
					fontSize: 11,
					color: S.onSurfaceMuted,
					marginLeft: "auto",
					background: S.surfaceContainer,
					padding: "2px 8px",
					borderRadius: 6,
				}}
			>
				⌘K
			</span>
		</div>
		<div
			style={{
				width: 40,
				height: 40,
				borderRadius: "50%",
				background: S.surfaceContainerLowest,
				display: "grid",
				placeItems: "center",
				position: "relative",
			}}
		>
			<Icon name="bell" size={18} color={S.onSurfaceVariant} />
			<span
				style={{
					position: "absolute",
					top: 8,
					right: 10,
					width: 8,
					height: 8,
					borderRadius: "50%",
					background: S.tertiary,
					border: `2px solid ${S.surfaceContainerLowest}`,
				}}
			/>
		</div>
	</div>
);

// ========== APP SHELL (sidebar + top bar + content) ==========
const AppShell = ({
	role,
	active,
	breadcrumb,
	churchName,
	userName,
	children,
	contentPad = 32,
	bg,
}) => (
	<div
		style={{
			width: "100%",
			height: "100%",
			display: "flex",
			background: bg || S.surface,
			fontFamily: "Inter, system-ui, sans-serif",
			color: S.onSurface,
		}}
	>
		<Sidebar
			role={role}
			active={active}
			churchName={churchName}
			userName={userName}
		/>
		<div
			style={{
				flex: 1,
				minWidth: 0,
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
			}}
		>
			<TopBar breadcrumb={breadcrumb} />
			<div
				style={{
					flex: 1,
					padding: `0 ${contentPad}px ${contentPad}px`,
					overflow: "hidden",
				}}
			>
				{children}
			</div>
		</div>
	</div>
);

// ========== TABLE ==========
const Table = ({ columns, rows }) => (
	<div
		style={{
			background: S.surfaceContainerLowest,
			borderRadius: 16,
			padding: "8px 0",
			overflow: "hidden",
		}}
	>
		{/* Header */}
		<div
			style={{
				display: "grid",
				gridTemplateColumns: columns.map((c) => c.width || "1fr").join(" "),
				padding: "12px 24px",
				gap: 16,
				fontSize: 11,
				fontWeight: 600,
				letterSpacing: "0.08em",
				textTransform: "uppercase",
				color: S.onSurfaceMuted,
			}}
		>
			{columns.map((c, i) => (
				<div key={i} style={{ textAlign: c.align || "left" }}>
					{c.label}
				</div>
			))}
		</div>
		{/* Rows */}
		{rows.map((row, i) => (
			<div
				key={i}
				style={{
					display: "grid",
					gridTemplateColumns: columns.map((c) => c.width || "1fr").join(" "),
					padding: "14px 24px",
					gap: 16,
					alignItems: "center",
					borderRadius: 12,
					margin: "2px 8px",
					background: row._hover ? S.surfaceContainerLow : "transparent",
					fontSize: 14,
					color: S.onSurface,
					minHeight: 40,
				}}
			>
				{columns.map((c, j) => (
					<div key={j} style={{ textAlign: c.align || "left", minWidth: 0 }}>
						{row[c.key]}
					</div>
				))}
			</div>
		))}
	</div>
);

// ========== SECTION HEADING (smaller) ==========
const SectionTitle = ({ title, action }) => (
	<div
		style={{
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			marginBottom: 16,
		}}
	>
		<h3
			style={{
				fontSize: 18,
				fontWeight: 600,
				letterSpacing: "-0.02em",
				color: S.onSurface,
				margin: 0,
			}}
		>
			{title}
		</h3>
		{action}
	</div>
);

Object.assign(window, {
	Icon,
	Wordmark,
	Button,
	Badge,
	TypeBadge,
	StatusBadge,
	Avatar,
	PageHeader,
	Card,
	StatCard,
	Amount,
	Input,
	Chip,
	Sidebar,
	TopBar,
	AppShell,
	Table,
	SectionTitle,
});
