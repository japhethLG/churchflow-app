import { z } from "zod";
import { nstr, type components } from "@/lib/api";

type Pledge = components["schemas"]["PledgeResponseDto"];

export const editPledgeSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => Number(v) > 0, "Amount must be greater than 0"),
  status: z.enum(["ACTIVE", "FULFILLED", "CANCELLED"]),
  note: z.string(),
});

export type EditPledgeFormValues = z.infer<typeof editPledgeSchema>;

export const buildEditPledgeDefaults = (pledge: Pledge): EditPledgeFormValues => ({
  amount: pledge.pledgedAmount.toString(),
  status: pledge.status,
  note: nstr(pledge.note) ?? "",
});

export const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active", description: "Still owed" },
  { value: "FULFILLED", label: "Fulfilled", description: "Fully paid" },
  { value: "CANCELLED", label: "Cancelled", description: "Withdrawn" },
] as const;
