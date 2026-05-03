"use client";

import type { ReactNode } from "react";
import {
	Avatar,
	Badge,
	Card,
	SectionTitle,
	StatusBadge,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { cn } from "@/lib/utils";

type Member = components["schemas"]["MemberResponseDto"];

const asString = (v: unknown): string | null => {
	return typeof v === "string" && v.length > 0 ? v : null;
};

export const MemberInfoCard = ({
	member,
	footer,
}: {
	member: Member;
	footer?: ReactNode;
}) => {
	const name = `${member.firstName} ${member.lastName}`.trim();
	return (
		<Card padding={28}>
			<div className="mb-6 flex items-start gap-4">
				<Avatar name={name} size={64} />
				<div className="min-w-0 flex-1">
					<div className="mb-1 flex flex-wrap items-center gap-2.5">
						<h2 className="m-0 text-2xl font-semibold tracking-tight">
							{name}
						</h2>
						{!member.userId && <Badge color="clay">temp</Badge>}
					</div>
					<div className="flex flex-wrap gap-2.5">
						<Badge color={member.role === "ADMIN" ? "indigo" : "neutral"}>
							{member.role}
						</Badge>
						<StatusBadge
							status={member.status === "ACTIVE" ? "Active" : "Inactive"}
						/>
					</div>
				</div>
				{footer}
			</div>

			<SectionTitle title="Contact" />
			<div className="grid grid-cols-2 gap-4">
				<Field label="Email" value={asString(member.email)} />
				<Field label="Phone" value={asString(member.phone)} />
				<Field label="Address" value={asString(member.address)} colspan />
			</div>
		</Card>
	);
};

const Field = ({
	label,
	value,
	colspan,
}: {
	label: string;
	value: string | null;
	colspan?: boolean;
}) => {
	return (
		<div className={cn(colspan && "col-span-full")}>
			<div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				{label}
			</div>
			<div
				className={cn(
					"text-sm",
					value ? "text-foreground" : "text-muted-foreground",
				)}
			>
				{value ?? "—"}
			</div>
		</div>
	);
};
