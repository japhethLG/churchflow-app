import { z } from "zod";
import { type components, nstr } from "@/lib/api";
import { PLEDGE_STATUS_OPTIONS } from "@/lib/constants/pledge";
import { positiveAmount } from "@/lib/form-validators";

type Pledge = components["schemas"]["PledgeResponseDto"];

export const editPledgeSchema = z.object({
	amount: positiveAmount(),
	status: z.enum(["ACTIVE", "FULFILLED", "CANCELLED"]),
	note: z.string(),
});

export type EditPledgeFormValues = z.infer<typeof editPledgeSchema>;

export const buildEditPledgeDefaults = (
	pledge: Pledge,
): EditPledgeFormValues => ({
	amount: pledge.pledgedAmount.toString(),
	status: pledge.status,
	note: nstr(pledge.note) ?? "",
});

export const STATUS_OPTIONS = PLEDGE_STATUS_OPTIONS;
