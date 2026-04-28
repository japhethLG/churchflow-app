import { z } from "zod";

export const addMemberSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.union([z.literal(""), z.string().email("Enter a valid email")]),
  phone: z.string(),
  address: z.string(),
});

export type AddMemberFormValues = z.infer<typeof addMemberSchema>;

export const addMemberDefaults: AddMemberFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
};
