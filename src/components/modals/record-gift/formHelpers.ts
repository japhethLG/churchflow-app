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

export const recordGiftSchema = z.object({
	type: z.enum(TRANSACTION_TYPES),
	amount: z
		.string()
		.min(1, "Amount is required")
		.refine((v) => Number(v) > 0, "Amount must be greater than 0"),
	date: z.string().min(1, "Date is required"),
	memberId: z.string(),
	campaignId: z.string(),
	campaignItemId: z.string(),
	pledgeId: z.string(),
	referenceNumber: z.string(),
	note: z.string(),
});

export type RecordGiftFormValues = z.infer<typeof recordGiftSchema>;

const todayInputValue = (): string => dayjs().format("YYYY-MM-DD");

export const buildRecordGiftDefaults = (overrides?: {
	defaultMemberId?: string;
	defaultCampaignId?: string;
	defaultPledgeId?: string;
}): RecordGiftFormValues => ({
	type: "TITHE",
	amount: "",
	date: todayInputValue(),
	memberId: overrides?.defaultMemberId ?? "",
	campaignId: overrides?.defaultCampaignId ?? "",
	campaignItemId: "",
	pledgeId: overrides?.defaultPledgeId ?? "",
	referenceNumber: "",
	note: "",
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
