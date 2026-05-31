import { z } from "zod";
import { requiredEmail } from "@/lib/form-validators";

export const inviteMemberSchema = z.object({
	email: requiredEmail(),
	role: z.enum(["USER", "ADMIN"]),
});

export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;

export const ROLE_OPTIONS = [
	{
		value: "USER",
		label: "Member",
		description:
			"Can view their own giving history, make pledges, and browse public campaigns.",
	},
	{
		value: "ADMIN",
		label: "Admin",
		description:
			"Full access to financials, member directory, campaigns, settings, and reports.",
	},
] as const;
