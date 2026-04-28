import { z } from "zod";

export const inviteAdminGlobalSchema = z.object({
  tenantId: z.string().min(1, "Choose a church"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
});

export type InviteAdminGlobalFormValues = z.infer<typeof inviteAdminGlobalSchema>;

export const inviteAdminGlobalDefaults: InviteAdminGlobalFormValues = {
  tenantId: "",
  email: "",
};
