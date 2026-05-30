"use client";

import { Badge, type Status, StatusBadge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import type { DataTableColumn } from "@/components/primitives/DataTable";
import type { components } from "@/lib/api";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";

export type Invitation = components["schemas"]["InvitationResponseDto"];

export const INVITATION_STATUS_MAP: Record<Invitation["status"], Status> = {
	PENDING: "Pending",
	ACCEPTED: "Completed",
	EXPIRED: "Cancelled",
	CANCELLED: "Cancelled",
};

export const invitationColumns = ({
	onCancel,
}: {
	onCancel: (inv: Invitation) => void;
}): DataTableColumn<Invitation>[] => [
	{
		key: "email",
		label: "Recipient",
		render: (row) => (
			<div className="flex flex-col">
				<span className="font-medium text-foreground">{row.email}</span>
				<span className="text-xs text-muted-foreground">
					Sent {dayjs(row.createdAt).format("ll")}
				</span>
			</div>
		),
	},
	{
		key: "role",
		label: "Role",
		width: "120px",
		render: (row) => (
			<Badge color={row.role === "ADMIN" ? "indigo" : "neutral"}>
				{row.role === "ADMIN" ? "Admin" : "Member"}
			</Badge>
		),
	},
	{
		key: "status",
		label: "Status",
		width: "140px",
		render: (row) => <StatusBadge status={INVITATION_STATUS_MAP[row.status]} />,
	},
	{
		key: "expires",
		label: "Expires",
		width: "120px",
		render: (row) => {
			if (row.status !== "PENDING") {
				return <span className="text-muted-foreground">—</span>;
			}
			const diff = dayjs(row.expiresAt).diff(dayjs());
			const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

			return (
				<span
					className={cn(
						days < 3 && days > 0
							? "text-destructive"
							: "text-secondary-foreground",
					)}
				>
					{days <= 0 ? "Expired" : `${days}d left`}
				</span>
			);
		},
	},
	{
		key: "actions",
		label: "",
		width: "100px",
		align: "right",
		render: (row) =>
			row.status === "PENDING" ? (
				<Button
					role="danger"
					recipe="outline"
					size="sm"
					onClick={() => onCancel(row)}
				>
					Cancel
				</Button>
			) : null,
	},
];
