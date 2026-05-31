// Base member roles (NOT the super-admin role system).
// invite-member / edit-member forms: USER → "Member", ADMIN → "Admin".
export const ROLE_OPTIONS = [
	{ value: "USER", label: "Member" },
	{ value: "ADMIN", label: "Admin" },
] as const;

// Role filter options (invitations page) — prepends an "all" row.
// Order matches the invitations page (ADMIN before USER).
export const ROLE_FILTER_OPTIONS = [
	{ value: "all", label: "All roles" },
	{ value: "ADMIN", label: "Admin" },
	{ value: "USER", label: "Member" },
];
