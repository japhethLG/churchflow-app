// Pledge status filter options for admin/member pledge lists
// (pledges/PledgesListPage, members/MemberPledgesTab, campaigns/CampaignPledgesTab).
export const PLEDGE_STATUS_FILTER_OPTIONS = [
	{ value: "all", label: "All statuses" },
	{ value: "ACTIVE", label: "Active" },
	{ value: "FULFILLED", label: "Fulfilled" },
	{ value: "CANCELLED", label: "Cancelled" },
];

// Pledge status form options (edit-pledge modal) — no "all", with the
// description text for the select rows.
export const PLEDGE_STATUS_OPTIONS = [
	{ value: "ACTIVE", label: "Active", description: "Still owed" },
	{ value: "FULFILLED", label: "Fulfilled", description: "Fully paid" },
	{ value: "CANCELLED", label: "Cancelled", description: "Withdrawn" },
] as const;
