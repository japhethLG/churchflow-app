"use client";

import {
	Amount,
	Avatar,
	type DataTableColumn,
	DeletedLabel,
	Pressable,
	RowActionsMenu,
	type Status,
	StatusBadge,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import dayjs from "@/lib/dayjs";

export type PledgeRow = components["schemas"]["PledgeResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];
type Member = components["schemas"]["MemberResponseDto"];

const STATUS_LABEL: Record<PledgeRow["status"], Status> = {
	ACTIVE: "Active",
	FULFILLED: "Completed",
	CANCELLED: "Cancelled",
};

const fullName = (m: Member | undefined): string => {
	if (!m) {
		return "Unknown member";
	}
	return `${m.firstName} ${m.lastName}`.trim();
};

export type PledgesTableHandlers = {
	onEdit: (p: PledgeRow) => void;
	onDelete: (p: PledgeRow) => void;
	onRestore: (p: PledgeRow) => void;
	onOpenCampaign: (campaignId: string) => void;
	onOpenPledge: (pledgeId: string) => void;
};

export const pledgeColumns = ({
	handlers,
	membersById,
	campaignsById,
}: {
	handlers: PledgesTableHandlers;
	membersById: Record<string, Member>;
	campaignsById: Record<string, Campaign>;
}): DataTableColumn<PledgeRow>[] => [
	{
		key: "member",
		label: "Member",
		render: (p) => {
			const m = membersById[p.memberId];
			const name = fullName(m);
			return (
				<span className="inline-flex min-w-0 items-center gap-2.5">
					<Avatar name={name} size={28} />
					{m?.deletedAt ? (
						<DeletedLabel
							deletedAt={m.deletedAt}
							className="truncate font-medium"
						>
							{name}
						</DeletedLabel>
					) : (
						<span className="truncate font-medium">{name}</span>
					)}
				</span>
			);
		},
	},
	{
		key: "campaign",
		label: "Campaign",
		render: (p) => {
			const c = campaignsById[p.campaignId];
			if (!c) {
				return <span className="text-muted-foreground">—</span>;
			}
			if (c.deletedAt) {
				return (
					<DeletedLabel deletedAt={c.deletedAt} className="font-medium">
						{c.title}
					</DeletedLabel>
				);
			}
			return (
				<Pressable
					className="font-medium text-primary hover:underline text-left"
					onClick={(e) => {
						e.stopPropagation();
						handlers.onOpenCampaign(c.id);
					}}
				>
					{c.title}
				</Pressable>
			);
		},
	},
	{
		key: "pledged",
		label: "Pledged",
		width: "140px",
		align: "right",
		render: (p) => <Amount value={p.pledgedAmount.toString()} />,
	},
	{
		key: "paid",
		label: "Paid",
		width: "140px",
		align: "right",
		render: (p) => (
			<span
				className={p.paidAmount === 0 ? "text-muted-foreground" : undefined}
			>
				<Amount value={p.paidAmount.toString()} />
			</span>
		),
	},
	{
		key: "status",
		label: "Status",
		width: "120px",
		render: (p) => <StatusBadge status={STATUS_LABEL[p.status]} />,
	},
	{
		key: "created",
		label: "Pledged on",
		width: "130px",
		render: (p) => (
			<span className="text-sm text-muted-foreground">
				{dayjs(p.createdAt).format("MMM D, YYYY")}
			</span>
		),
	},
	{
		key: "actions",
		label: "",
		width: "48px",
		align: "right",
		overflow: "visible",
		render: (p) => {
			if (p.deletedAt) {
				return (
					<RowActionsMenu
						actions={[
							{
								label: "View transactions",
								onClick: () => handlers.onOpenPledge(p.id),
							},
							{
								label: "Restore",
								onClick: () => handlers.onRestore(p),
								separatorBefore: true,
							},
						]}
					/>
				);
			}
			return (
				<RowActionsMenu
					actions={[
						{
							label: "View transactions",
							onClick: () => handlers.onOpenPledge(p.id),
						},
						{
							label: "View campaign",
							onClick: () => handlers.onOpenCampaign(p.campaignId),
						},
						{
							label: "Edit",
							onClick: () => handlers.onEdit(p),
							separatorBefore: true,
						},
						{
							label: "Delete",
							onClick: () => handlers.onDelete(p),
							destructive: true,
						},
					]}
				/>
			);
		},
	},
];
