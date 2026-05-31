import { z } from "zod";
import { type components, nstr } from "@/lib/api";
import { toDateInput } from "@/lib/dayjs";
import { positiveAmount, requiredString } from "@/lib/form-validators";

type Item = components["schemas"]["CampaignItemResponseDto"];

export const editCampaignItemSchema = z.object({
	title: requiredString("Title"),
	description: z.string(),
	target: positiveAmount("Target", "Target amount"),
	deadline: z.string(),
});

export type EditCampaignItemFormValues = z.infer<typeof editCampaignItemSchema>;

export const buildEditCampaignItemDefaults = (
	item: Item,
): EditCampaignItemFormValues => ({
	title: item.title,
	description: nstr(item.description) ?? "",
	target: item.targetAmount.toString(),
	deadline: toDateInput(item.deadline),
});
