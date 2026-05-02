import { z } from "zod";
import type { components } from "@/lib/api";

type Member = components["schemas"]["MemberResponseDto"];

export const editMemberSchema = z.object({
	firstName: z.string().trim().min(1, "First name is required"),
	lastName: z.string().trim().min(1, "Last name is required"),
	email: z.union([z.literal(""), z.string().email("Enter a valid email")]),
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

export const ROLE_OPTIONS = [
	{ value: "USER", label: "Member" },
	{ value: "ADMIN", label: "Admin" },
] as const;

export const STATUS_OPTIONS = [
	{ value: "ACTIVE", label: "Active" },
	{ value: "INACTIVE", label: "Inactive" },
] as const;
