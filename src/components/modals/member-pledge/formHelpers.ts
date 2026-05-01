import { z } from "zod";
import { getCurrencySymbol } from "@/lib/format-currency";

export const memberPledgeSchema = z.object({
  itemId: z.string(),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => Number(v) > 0, "Amount must be greater than 0"),
  note: z.string(),
});

export type MemberPledgeFormValues = z.infer<typeof memberPledgeSchema>;

export const memberPledgeDefaults: MemberPledgeFormValues = {
  itemId: "",
  amount: "",
  note: "",
};

export const currencySymbol = (currency: string): string =>
  getCurrencySymbol(currency);
