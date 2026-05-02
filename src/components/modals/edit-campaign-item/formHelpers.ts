import { z } from "zod";
import { type components, nstr } from "@/lib/api";
import dayjs from "@/lib/dayjs";

type Item = components["schemas"]["CampaignItemResponseDto"];

export const editCampaignItemSchema = z.object({
	title: z.string().trim().min(1, "Title is required"),
	description: z.string(),
	target: z
		.string()
		.min(1, "Target amount is required")
		.refine((v) => Number(v) > 0, "Target must be greater than 0"),
	deadline: z.string(),
});

export type EditCampaignItemFormValues = z.infer<typeof editCampaignItemSchema>;

const toDateInput = (d: unknown): string => {
	const s = nstr(d);
	if (!s) return "";
	return dayjs(s).format("YYYY-MM-DD");
};

export const buildEditCampaignItemDefaults = (
	item: Item,
): EditCampaignItemFormValues => ({
	title: item.title,
	description: nstr(item.description) ?? "",
	target: item.targetAmount.toString(),
	deadline: toDateInput(item.deadline),
});
