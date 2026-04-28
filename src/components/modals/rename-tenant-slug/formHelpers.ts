import { z } from "zod";

export const renameTenantSlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, digits, and dashes only"),
});

export type RenameTenantSlugFormValues = z.infer<typeof renameTenantSlugSchema>;
