"use client";

import {
	Amount,
	Avatar,
	type TransactionType as BadgeType,
	type DataTableColumn,
	DeletedLabel,
	RowActionsMenu,
	TypeBadge,
} from "@/components/primitives";
import { type components, nstr } from "@/lib/api";
import dayjs from "@/lib/dayjs";

export type TransactionRow = components["schemas"]["TransactionResponseDto"];
type Member = components["schemas"]["MemberResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

const TYPE_BADGE_LABEL: Record<TransactionRow["type"], BadgeType> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

const fmtDate = (iso: string): string => {
	return dayjs(iso).format("MMM D");
};

const fullName = (m: Member | undefined): string => {
	if (!m) {
		return "—";
	}
	return `${m.firstName} ${m.lastName}`.trim();
};

export type TransactionsTableHandlers = {
	onView: (t: TransactionRow) => void;
	onEdit: (t: TransactionRow) => void;
	onDelete: (t: TransactionRow) => void;
	onRestore: (t: TransactionRow) => void;
};

export const transactionColumns = ({
	handlers,
	membersById,
	campaignsById,
}: {
	handlers: TransactionsTableHandlers;
	membersById: Record<string, Member>;
	campaignsById: Record<string, Campaign>;
}): DataTableColumn<TransactionRow>[] => [
	{
		key: "date",
		label: "Date",
		width: "100px",
		render: (t) => <span className="text-sm">{fmtDate(t.date)}</span>,
	},
	{
		key: "member",
		label: "Member",
		render: (t) => {
			const memberId = nstr(t.memberId);
			if (!memberId) {
				return (
					<span className="text-sm italic text-muted-foreground">
						Anonymous
					</span>
				);
			}
			const m = membersById[memberId];
			const isDeleted = Boolean(m?.deletedAt);
			return (
				<span className="inline-flex min-w-0 items-center gap-2">
					<Avatar name={fullName(m)} size={26} />
					{isDeleted ? (
						<DeletedLabel deletedAt={m?.deletedAt} className="truncate text-sm">
							{fullName(m)}
						</DeletedLabel>
					) : (
						<span className="truncate text-sm">{fullName(m)}</span>
					)}
				</span>
			);
		},
	},
	{
		key: "type",
		label: "Type",
		width: "130px",
		render: (t) => <TypeBadge type={TYPE_BADGE_LABEL[t.type]} />,
	},
	{
		key: "campaign",
		label: "Campaign",
		width: "180px",
		render: (t) => {
			const cid = nstr(t.campaignId);
			if (!cid) {
				return <span className="text-muted-foreground">—</span>;
			}
			const c = campaignsById[cid];
			if (c?.deletedAt) {
				return (
					<DeletedLabel
						deletedAt={c.deletedAt}
						className="block truncate text-sm"
					>
						{c.title}
					</DeletedLabel>
				);
			}
			return (
				<span className="block truncate text-sm text-primary">
					{c?.title ?? "Campaign"}
				</span>
			);
		},
	},
	{
		key: "ref",
		label: "Ref #",
		width: "100px",
		render: (t) => {
			const r = nstr(t.referenceNumber);
			return r ? (
				<span className="font-mono text-xs text-muted-foreground">{r}</span>
			) : (
				<span className="text-muted-foreground">—</span>
			);
		},
	},
	{
		key: "amt",
		label: "Amount",
		width: "120px",
		align: "right",
		render: (t) => <Amount value={t.amount} />,
	},
	{
		key: "actions",
		label: "",
		width: "48px",
		align: "right",
		overflow: "visible",
		render: (t) => {
			if (t.deletedAt) {
				return (
					<RowActionsMenu
						actions={[
							{ label: "View details", onClick: () => handlers.onView(t) },
							{
								label: "Restore",
								onClick: () => handlers.onRestore(t),
								separatorBefore: true,
							},
						]}
					/>
				);
			}
			return (
				<RowActionsMenu
					actions={[
						{ label: "View details", onClick: () => handlers.onView(t) },
						{
							label: "Edit",
							onClick: () => handlers.onEdit(t),
							separatorBefore: true,
						},
						{
							label: "Delete",
							onClick: () => handlers.onDelete(t),
							destructive: true,
						},
					]}
				/>
			);
		},
	},
];
