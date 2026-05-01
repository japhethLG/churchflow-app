import { z } from "zod";

export const settingsSchema = z.object({
  name: z.string().min(1, "Church name is required").max(100),
  address: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  currency: z.string().length(3, "Must be a 3-letter currency code"),
  timezone: z.string().min(1, "Timezone is required"),
  fiscalYearStart: z.coerce.number().min(1).max(12),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
