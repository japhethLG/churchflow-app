import { z } from "zod";
import { type components } from "@/lib/api";

type CampaignStatus = components["schemas"]["CampaignResponseDto"]["status"];


export const campaignItemSchema = z.object({
  id: z.string().optional(),
  tempId: z.string(),
  title: z.string().min(1, "Item title is required"),
  description: z.string().optional(),
  targetAmount: z.coerce.number().min(0, "Amount must be at least 0"),
  deadline: z.string().optional(),
});

export const STATUS_CONFIG: Record<CampaignStatus, { label: string; hint: string }> = {
  DRAFT: { label: "Draft", hint: "Hidden from members" },
  ACTIVE: { label: "Active", hint: "Open for pledges" },
  COMPLETED: { label: "Completed", hint: "Closed for pledges" },
  CANCELLED: { label: "Cancelled", hint: "Campaign ended early" },
};

export const campaignSchema = z.object({
  title: z.string().min(1, "Campaign title is required"),
  description: z.string().optional(),
  currency: z.string().length(3, "Must be a 3-letter currency code"),
  deadline: z.string().optional(),
  status: z.enum(Object.keys(STATUS_CONFIG) as [CampaignStatus, ...CampaignStatus[]]),
  items: z.array(campaignItemSchema).min(1, "At least one item is required"),
});

export type CampaignFormValues = z.infer<typeof campaignSchema>;
export type CampaignItemValues = z.infer<typeof campaignItemSchema>;

export const STATUS_OPTIONS = (Object.keys(STATUS_CONFIG) as CampaignStatus[])
  .filter((key) => key !== "COMPLETED" && key !== "CANCELLED")
  .map((key) => ({
    value: key,
    ...STATUS_CONFIG[key],
  }));

let _itemIdCounter = 0;
export const newItemDraft = (seed: Partial<CampaignItemValues> = {}): CampaignItemValues => {
  _itemIdCounter += 1;
  return {
    tempId: `tmp-${_itemIdCounter}`,
    title: "",
    description: "",
    targetAmount: 0,
    deadline: "",
    ...seed,
  };
};
