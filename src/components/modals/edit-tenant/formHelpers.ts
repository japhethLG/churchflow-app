import { z } from "zod";

export const editTenantSchema = z.object({
	name: z.string().trim().min(1, "Church name is required"),
	description: z.string().optional(),
});

export type EditTenantFormValues = z.infer<typeof editTenantSchema>;

export const buildDefaultValues = (
	currentName: string,
	currentDescription?: string | null,
): EditTenantFormValues => ({
	name: currentName,
	description: currentDescription ?? "",
});
