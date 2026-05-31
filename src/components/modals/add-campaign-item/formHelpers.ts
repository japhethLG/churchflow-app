import { z } from "zod";
import { positiveAmount, requiredString } from "@/lib/form-validators";

export const addCampaignItemSchema = z.object({
	title: requiredString("Title"),
	description: z.string(),
	target: positiveAmount("Target", "Target amount"),
	deadline: z.string(),
});

export type AddCampaignItemFormValues = z.infer<typeof addCampaignItemSchema>;

export const addCampaignItemDefaults: AddCampaignItemFormValues = {
	title: "",
	description: "",
	target: "",
	deadline: "",
};
