import { z } from "zod";
import { optionalEmail, requiredString } from "@/lib/form-validators";

export const addMemberSchema = z.object({
	firstName: requiredString("First name"),
	lastName: requiredString("Last name"),
	email: optionalEmail(),
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
