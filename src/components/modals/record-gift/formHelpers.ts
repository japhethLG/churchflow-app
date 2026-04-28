import { z } from "zod";
import type { IconName } from "@/components/primitives/Icon";

const TRANSACTION_TYPES = [
  "TITHE",
  "OFFERING",
  "MISSION_GIVING",
  "FIRST_FRUIT",
  "COMMITMENT",
  "DONATION",
  "OTHER",
] as const;

const PAYMENT_METHODS = [
  "CASH",
  "CHECK",
  "BANK_TRANSFER",
  "MOBILE_MONEY",
  "ONLINE",
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
  paymentMethod: z.enum(PAYMENT_METHODS),
  referenceNumber: z.string(),
  note: z.string(),
});

export type RecordGiftFormValues = z.infer<typeof recordGiftSchema>;

const todayInputValue = (): string => new Date().toISOString().slice(0, 10);

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
  paymentMethod: "CASH",
  referenceNumber: "",
  note: "",
});

export const TYPE_OPTIONS: { value: (typeof TRANSACTION_TYPES)[number]; label: string }[] = [
  { value: "TITHE", label: "Tithe" },
  { value: "OFFERING", label: "Offering" },
  { value: "MISSION_GIVING", label: "Mission" },
  { value: "FIRST_FRUIT", label: "First Fruit" },
  { value: "COMMITMENT", label: "Commitment" },
  { value: "DONATION", label: "Donation" },
  { value: "OTHER", label: "Other" },
];

export const METHOD_OPTIONS: {
  value: (typeof PAYMENT_METHODS)[number];
  label: string;
  icon: IconName;
}[] = [
  { value: "CASH", label: "Cash", icon: "cash" },
  { value: "CHECK", label: "Check", icon: "check_rect" },
  { value: "BANK_TRANSFER", label: "Bank", icon: "bank" },
  { value: "MOBILE_MONEY", label: "Mobile", icon: "phone" },
  { value: "ONLINE", label: "Online", icon: "link" },
  { value: "OTHER", label: "Other", icon: "dots" },
];
