// Member status form options (edit-member schema) — uppercase enum values.
export const MEMBER_STATUS_OPTIONS = [
	{ value: "ACTIVE", label: "Active" },
	{ value: "INACTIVE", label: "Inactive" },
] as const;

// Member status filter options (members list page) — lowercase wire
// values plus an "all" row. Value casing genuinely differs from the form
// (wire filter param vs schema enum), so both exports are kept.
export const MEMBER_STATUS_FILTER_OPTIONS = [
	{ value: "all", label: "All statuses" },
	{ value: "active", label: "Active" },
	{ value: "inactive", label: "Inactive" },
];
