import { z } from "zod";

export const settingsSchema = z.object({
	name: z.string().min(1, "Church name is required").max(100),
	address: z.string().max(200).optional(),
	phone: z.string().max(30).optional(),
	email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
