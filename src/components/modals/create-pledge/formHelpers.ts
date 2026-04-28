import { z } from "zod";

export const createPledgeSchema = z.object({
  campaignId: z.string().min(1, "Choose a campaign"),
  itemId: z.string(),
  memberId: z.string().min(1, "Choose a member"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => Number(v) > 0, "Amount must be greater than 0"),
  note: z.string(),
});

export type CreatePledgeFormValues = z.infer<typeof createPledgeSchema>;

export const buildCreatePledgeDefaults = (
  campaignId: string,
  defaultMemberId?: string,
): CreatePledgeFormValues => ({
  campaignId,
  itemId: "",
  memberId: defaultMemberId ?? "",
  amount: "",
  note: "",
});
