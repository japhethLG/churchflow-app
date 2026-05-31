import { z } from "zod";
import type { components } from "@/lib/api";
import { optionalEmail, requiredString } from "@/lib/form-validators";

type Member = components["schemas"]["MemberResponseDto"];

export const editMemberSchema = z.object({
	firstName: requiredString("First name"),
	lastName: requiredString("Last name"),
	email: optionalEmail(),
	phone: z.string(),
	address: z.string(),
	role: z.enum(["USER", "ADMIN"]),
	status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type EditMemberFormValues = z.infer<typeof editMemberSchema>;

const asString = (v: unknown): string => (typeof v === "string" ? v : "");

export const buildEditMemberDefaults = (
	member: Member,
): EditMemberFormValues => ({
	firstName: member.firstName,
	lastName: member.lastName,
	email: asString(member.email),
	phone: asString(member.phone),
	address: asString(member.address),
	role: member.role,
	status: member.status,
});

export { MEMBER_STATUS_OPTIONS as STATUS_OPTIONS } from "@/lib/constants/member";
export { ROLE_OPTIONS } from "@/lib/constants/role";
