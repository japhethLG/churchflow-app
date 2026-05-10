import { z } from "zod";
import dayjs from "@/lib/dayjs";

const TRANSACTION_TYPES = [
	"TITHE",
	"OFFERING",
	"MISSION_GIVING",
	"FIRST_FRUIT",
	"COMMITMENT",
	"DONATION",
	"OTHER",
] as const;

// One row in the gift list. Member + date are NOT here — they live on
// the entry and are shared across every row.
//
// The schema is strict on purpose: it's what `methods.trigger("gifts.N")`
// runs in the inline editor when the user clicks Save, so per-field
// errors light up natively. The form is allowed to *contain* invalid /
// empty rows (they're "drafts" — see RecordGiftModal); the modal just
// never lets them leave the form unless they pass this validation.
export const giftRowSchema = z.object({
	// Stable row identity. We own this instead of relying on
	// useFieldArray's `field.id`, which RHF regenerates on update/replace
	// and would orphan the row's saved-snapshot mapping. Stripped at the
	// API boundary.
	rowId: z.string().min(1),
	type: z.enum(TRANSACTION_TYPES),
	amount: z
		.string()
		.min(1, "Amount is required")
		.refine((v) => Number(v) > 0, "Amount must be greater than 0"),
	campaignId: z.string(),
	campaignItemId: z.string(),
	pledgeId: z.string(),
	referenceNumber: z.string(),
	note: z.string(),
});

export type GiftRowValues = z.infer<typeof giftRowSchema>;

// The whole modal — one shared member/date plus N rows.
//
// The "is at least one gift recorded?" question is NOT in zod — it's
// answered by the explicit `saved` map in RecordGiftModal because zod
// would have to peek at component state to tell drafts apart from
// committed rows. The primary "Record gifts" button is gated on
// `saved.size > 0` instead.
export const recordGiftEntrySchema = z.object({
	memberId: z.string(),
	date: z.string().min(1, "Date is required"),
	gifts: z.array(giftRowSchema).max(50),
});

export type RecordGiftEntryValues = z.infer<typeof recordGiftEntrySchema>;

const todayInputValue = (): string => dayjs().format("YYYY-MM-DD");

const generateRowId = (): string => {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	return `row_${Math.random().toString(36).slice(2)}_${Date.now()}`;
};

export const buildEmptyGiftRow = (overrides?: {
	defaultCampaignId?: string;
	defaultPledgeId?: string;
}): GiftRowValues => ({
	rowId: generateRowId(),
	type: "TITHE",
	amount: "",
	campaignId: overrides?.defaultCampaignId ?? "",
	campaignItemId: "",
	pledgeId: overrides?.defaultPledgeId ?? "",
	referenceNumber: "",
	note: "",
});

export const buildRecordGiftEntryDefaults = (overrides?: {
	defaultMemberId?: string;
	defaultCampaignId?: string;
	defaultPledgeId?: string;
}): RecordGiftEntryValues => ({
	memberId: overrides?.defaultMemberId ?? "",
	date: todayInputValue(),
	gifts: [
		buildEmptyGiftRow({
			defaultCampaignId: overrides?.defaultCampaignId,
			defaultPledgeId: overrides?.defaultPledgeId,
		}),
	],
});

export const TYPE_OPTIONS: {
	value: (typeof TRANSACTION_TYPES)[number];
	label: string;
}[] = [
	{ value: "TITHE", label: "Tithe" },
	{ value: "OFFERING", label: "Offering" },
	{ value: "MISSION_GIVING", label: "Mission" },
	{ value: "FIRST_FRUIT", label: "First Fruit" },
	{ value: "COMMITMENT", label: "Commitment" },
	{ value: "DONATION", label: "Donation" },
	{ value: "OTHER", label: "Other" },
];

export const typeLabelFor = (type: GiftRowValues["type"]): string =>
	TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
