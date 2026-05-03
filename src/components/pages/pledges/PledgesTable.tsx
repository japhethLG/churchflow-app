"use client";

import {
	Amount,
	Avatar,
	DataTable,
	type DataTableColumn,
	type DataTablePagination,
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
	onOpenCampaign: (campaignId: string) => void;
};

export const PledgesTable = ({
	rows,
	loading,
	pagination,
	membersById,
	campaignsById,
	handlers,
}: {
	rows: PledgeRow[] | undefined;
	loading?: boolean;
	pagination?: DataTablePagination;
	membersById: Record<string, Member>;
	campaignsById: Record<string, Campaign>;
	handlers: PledgesTableHandlers;
}) => {
	const columns: DataTableColumn<PledgeRow>[] = [
		{
			key: "member",
			label: "Member",
			render: (p) => (
				<span className="inline-flex min-w-0 items-center gap-2.5">
					<Avatar name={fullName(membersById[p.memberId])} size={28} />
					<span className="truncate font-medium">
						{fullName(membersById[p.memberId])}
					</span>
				</span>
			),
		},
		{
			key: "campaign",
			label: "Campaign",
			render: (p) => {
				const c = campaignsById[p.campaignId];
				if (!c) {
					return <span className="text-muted-foreground">—</span>;
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
			key: "amount",
			label: "Pledged",
			width: "140px",
			align: "right",
			render: (p) => <Amount value={p.pledgedAmount.toString()} />,
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
				<span className="text-[13px] text-muted-foreground">
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
			render: (p) => (
				<RowActionsMenu
					actions={[
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
							separatorBefore: true,
						},
					]}
				/>
			),
		},
	];

	return (
		<DataTable<PledgeRow>
			columns={columns}
			rows={rows}
			rowKey={(p) => p.id}
			loading={loading}
			pagination={pagination}
			emptyTitle="No pledges yet"
			emptySubtitle="When members commit to a campaign, those pledges show up here."
		/>
	);
};
