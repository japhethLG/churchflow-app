import type { NavItem, Perspective } from "./types";

export const buildNav = (
	perspective: Perspective,
	tenantSlug?: string,
): NavItem[] => {
	if (perspective === "super") {
		return [
			{ icon: "home", label: "Tenants", href: "/super-admin/tenants" },
			{ icon: "users", label: "Admins", href: "/super-admin/admins" },
			{ icon: "chart", label: "Audit log", href: "/super-admin/audit" },
			{ icon: "user", label: "Profile", href: "/super-admin/profile" },
		];
	}

	const prefix = `/${tenantSlug}`;

	if (perspective === "admin") {
		return [
			{ icon: "home", label: "Dashboard", href: `${prefix}/admin/dashboard` },
			{ icon: "users", label: "Members", href: `${prefix}/admin/members` },
			{
				icon: "calendar",
				label: "Campaigns",
				href: `${prefix}/admin/campaigns`,
			},
			{ icon: "book", label: "Pledges", href: `${prefix}/admin/pledges` },
			{
				icon: "receipt",
				label: "Transactions",
				href: `${prefix}/admin/transactions`,
			},
			{ icon: "chart", label: "Reports", href: `${prefix}/admin/reports` },
			{
				icon: "mail",
				label: "Invitations",
				href: `${prefix}/admin/invitations`,
			},
			{ icon: "user", label: "Profile", href: `${prefix}/admin/profile` },
			{ icon: "settings", label: "Settings", href: `${prefix}/admin/settings` },
		];
	}

	return [
		{ icon: "home", label: "Dashboard", href: `${prefix}/member/dashboard` },
		{
			icon: "calendar",
			label: "Campaigns",
			href: `${prefix}/member/campaigns`,
		},
		{ icon: "book", label: "My pledges", href: `${prefix}/member/my-pledges` },
		{
			icon: "receipt",
			label: "My giving",
			href: `${prefix}/member/my-transactions`,
		},
		{ icon: "chart", label: "Insights", href: `${prefix}/member/insights` },
		{ icon: "user", label: "Profile", href: `${prefix}/member/profile` },
	];
};
