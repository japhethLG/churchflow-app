import { z } from "zod";

export const inviteTenantAdminSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.email("Enter a valid email"),
});

export type InviteTenantAdminFormValues = z.infer<
	typeof inviteTenantAdminSchema
>;
