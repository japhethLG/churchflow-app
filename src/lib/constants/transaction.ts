import { TX_TYPE_LABEL, type TxType } from "@/components/pages/admin-shared";

// Transaction types in the order the record-gift form lists them
// (modals/record-gift/formHelpers.ts TYPE_OPTIONS / TRANSACTION_TYPES).
export const TX_TYPES = [
	"TITHE",
	"OFFERING",
	"MISSION_GIVING",
	"FIRST_FRUIT",
	"COMMITMENT",
	"DONATION",
	"OTHER",
] as const satisfies readonly TxType[];

// Filter dropdown options for transaction lists. Labels derive from the
// canonical TYPE_LABEL so casing can't drift — this intentionally fixes
// the "First fruit" → "First Fruit" drift in the filter pages.
export const TRANSACTION_TYPE_FILTER_OPTIONS: {
	value: "all" | TxType;
	label: string;
}[] = [
	{ value: "all", label: "All types" },
	...TX_TYPES.map((v) => ({ value: v, label: TX_TYPE_LABEL[v] })),
];

// "By type" / "By campaign" segmented control for the giving-mix bar
// (reports/GiversTab + members/MemberOverviewTab).
export const MIX_OPTIONS = [
	{ value: "type", label: "By type" },
	{ value: "campaign", label: "By campaign" },
];
