import { z } from "zod";
import dayjs from "@/lib/dayjs";
import { positiveAmount } from "@/lib/form-validators";

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
	amount: positiveAmount(),
	campaignId: z.string(),
	campaignItemId: z.string(),
	pledgeId: z.string(),
	referenceNumber: z.string(),
	note: z.string(),
});

export type GiftRowValues = z.infer<typeof giftRowSchema>;

// The whole modal — one shared member/date plus a single draft row.
//
// Saved gifts are kept in component state (not the form) because they're
// committed snapshots; the form only holds the live draft. The primary
// "Record gifts" button is gated on `savedGifts.length > 0`. The draft
// schema is intentionally loose (matches giftRowSchema's structure but
// without the strict refinements) so the resolver doesn't fight a
// partially-filled draft on every keystroke — strict validation happens
// only when the user clicks Save and we call `methods.trigger("draft")`.
export const recordGiftEntrySchema = z.object({
	memberId: z.string(),
	date: z.string().min(1, "Date is required"),
	draft: giftRowSchema,
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
	draft: buildEmptyGiftRow({
		defaultCampaignId: overrides?.defaultCampaignId,
		defaultPledgeId: overrides?.defaultPledgeId,
	}),
});

// A draft is "dirty" if the user has actually started filling it in.
// Type is excluded because we intentionally preserve it across saves
// for bulk-entry runs; an empty Amount + no optional fields means the
// user hasn't engaged with this draft yet, so it can be silently
// abandoned when switching to edit-mode or submitting.
export const isDraftDirty = (draft: GiftRowValues): boolean =>
	Boolean(
		draft.amount ||
			draft.campaignId ||
			draft.campaignItemId ||
			draft.pledgeId ||
			draft.referenceNumber ||
			draft.note,
	);

// Reset the draft after a save — keep Type (bulk-entry sessions tend
// to be runs of the same type) and reuse the same defaults the user
// pre-seeded the modal with.
export const buildEmptyDraft = (carryOver: {
	type: GiftRowValues["type"];
	defaultCampaignId?: string;
	defaultPledgeId?: string;
}): GiftRowValues => ({
	...buildEmptyGiftRow({
		defaultCampaignId: carryOver.defaultCampaignId,
		defaultPledgeId: carryOver.defaultPledgeId,
	}),
	type: carryOver.type,
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
