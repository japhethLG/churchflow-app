import { z } from "zod";

export const inviteMemberSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.email("Enter a valid email"),
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
