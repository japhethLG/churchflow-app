import { z } from "zod";

export const addCampaignItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string(),
  target: z
    .string()
    .min(1, "Target amount is required")
    .refine((v) => Number(v) > 0, "Target must be greater than 0"),
  deadline: z.string(),
});

export type AddCampaignItemFormValues = z.infer<typeof addCampaignItemSchema>;

export const addCampaignItemDefaults: AddCampaignItemFormValues = {
  title: "",
  description: "",
  target: "",
  deadline: "",
};
