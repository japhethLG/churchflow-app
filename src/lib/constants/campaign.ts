import type { BadgeColor } from "@/components/primitives";
import type { components } from "@/lib/api";

export type CampaignStatus =
	components["schemas"]["CampaignResponseDto"]["status"];

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
	DRAFT: "Draft",
	ACTIVE: "Active",
	COMPLETED: "Completed",
	CANCELLED: "Cancelled",
};

// Status → Badge color (campaigns/CampaignDetailPage STATUS_BADGE; the
// CampaignsListPage inline ternary maps the same way).
export const CAMPAIGN_STATUS_COLOR: Record<CampaignStatus, BadgeColor> = {
	DRAFT: "neutral",
	ACTIVE: "green",
	COMPLETED: "blue",
	CANCELLED: "red",
};

// Admin filter dropdown built from the admin label map, with an "all" row.
export const CAMPAIGN_STATUS_FILTER_OPTIONS: {
	value: "all" | CampaignStatus;
	label: string;
}[] = [
	{ value: "all", label: "All statuses" },
	{ value: "DRAFT", label: CAMPAIGN_STATUS_LABELS.DRAFT },
	{ value: "ACTIVE", label: CAMPAIGN_STATUS_LABELS.ACTIVE },
	{ value: "COMPLETED", label: CAMPAIGN_STATUS_LABELS.COMPLETED },
	{ value: "CANCELLED", label: CAMPAIGN_STATUS_LABELS.CANCELLED },
];
