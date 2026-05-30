import { z } from "zod";

// Shared shape for both pledge intents. `memberId` is only required for the
// admin (tenant) intent — the self intent forces it to the caller server-side.
export type PledgeSheetValues = {
	campaignId: string;
	itemId: string;
	memberId: string;
	amount: string;
	note: string;
};

export const pledgeSheetSchema = (intent: "self" | "tenant") =>
	z.object({
		campaignId: z.string().min(1, "Choose a campaign"),
		itemId: z.string(),
		memberId:
			intent === "tenant" ? z.string().min(1, "Choose a member") : z.string(),
		amount: z
			.string()
			.min(1, "Amount is required")
			.refine((v) => Number(v) > 0, "Amount must be greater than 0"),
		note: z.string(),
	});

export const buildPledgeSheetDefaults = (
	campaignId: string,
	defaultMemberId?: string,
): PledgeSheetValues => ({
	campaignId,
	itemId: "",
	memberId: defaultMemberId ?? "",
	amount: "",
	note: "",
});
