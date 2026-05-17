"use client";

import {
	type DataTableColumn,
	DeletedLabel,
	RowActionsMenu,
	type Status,
	StatusBadge,
} from "@/components/primitives";
import { type components, nstr } from "@/lib/api";
import dayjs from "@/lib/dayjs";

export type CampaignRow = components["schemas"]["CampaignResponseDto"];

export type CampaignsTableHandlers = {
	onView: (c: CampaignRow) => void;
	onEdit: (c: CampaignRow) => void;
	onCancel: (c: CampaignRow) => void;
	onDelete: (c: CampaignRow) => void;
	onRestore: (c: CampaignRow) => void;
};

const STATUS_LABEL: Record<CampaignRow["status"], Status> = {
	DRAFT: "Pending",
	ACTIVE: "Active",
	COMPLETED: "Completed",
	CANCELLED: "Cancelled",
};

const fmtDeadline = (d: string | null): string => {
	if (!d) {
		return "Open-ended";
	}
	const date = dayjs(d);
	const days = date.diff(dayjs(), "day");
	const fmt = date.format("MMM D, YYYY");
	if (days < 0) {
		return `${fmt} · past`;
	}
	if (days === 0) {
		return `${fmt} · today`;
	}
	if (days <= 30) {
		return `${fmt} · ${days}d left`;
	}
	return fmt;
};

export const campaignColumns = (
	handlers: CampaignsTableHandlers,
): DataTableColumn<CampaignRow>[] => [
	{
		key: "title",
		label: "Campaign",
		render: (c) => (
			<span className="inline-flex min-w-0 flex-col gap-1">
				{c.deletedAt ? (
					<DeletedLabel
						deletedAt={c.deletedAt}
						className="truncate font-medium"
					>
						{c.title}
					</DeletedLabel>
				) : (
					<span className="truncate font-medium">{c.title}</span>
				)}
				{nstr(c.description) && (
					<span className="truncate text-xs text-muted-foreground">
						{nstr(c.description)}
					</span>
				)}
			</span>
		),
	},
	{
		key: "deadline",
		label: "Deadline",
		width: "200px",
		render: (c) => (
			<span className="text-sm text-muted-foreground">
				{fmtDeadline(nstr(c.deadline))}
			</span>
		),
	},
	{
		key: "status",
		label: "Status",
		width: "130px",
		render: (c) => <StatusBadge status={STATUS_LABEL[c.status]} />,
	},
	{
		key: "created",
		label: "Created",
		width: "130px",
		render: (c) => (
			<span className="text-sm text-muted-foreground">
				{dayjs(c.createdAt).format("MMM D, YYYY")}
			</span>
		),
	},
	{
		key: "actions",
		label: "",
		width: "48px",
		align: "right",
		overflow: "visible",
		render: (c) => {
			if (c.deletedAt) {
				return (
					<RowActionsMenu
						actions={[
							{ label: "View", onClick: () => handlers.onView(c) },
							{
								label: "Restore",
								onClick: () => handlers.onRestore(c),
								separatorBefore: true,
							},
						]}
					/>
				);
			}
			const canCancel = c.status === "ACTIVE" || c.status === "DRAFT";
			const actions = [
				{ label: "View", onClick: () => handlers.onView(c) },
				{ label: "Edit", onClick: () => handlers.onEdit(c) },
				...(canCancel
					? [
							{
								label: "Cancel campaign",
								onClick: () => handlers.onCancel(c),
								separatorBefore: true,
							},
						]
					: []),
				{
					label: "Delete",
					onClick: () => handlers.onDelete(c),
					destructive: true,
					separatorBefore: !canCancel,
				},
			];
			return <RowActionsMenu actions={actions} />;
		},
	},
];
