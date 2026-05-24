"use client";

import Link from "next/link";
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
type EmbeddedMember = NonNullable<TransactionRow["member"]>;

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

const fullName = (m: EmbeddedMember | undefined | null): string => {
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

// Member + campaign labels now come from each row's embedded relation —
// no need for caller-supplied lookup maps. Tombstoned references still
// surface (BE opts into withDeleted) so DeletedLabel can render them.
export const transactionColumns = ({
	handlers,
	tenantSlug,
}: {
	handlers: TransactionsTableHandlers;
	// When set, member + campaign cells render as `<Link>`s to their detail
	// pages. Omit on standalone tables that have no per-tenant context.
	tenantSlug?: string;
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
			const m = t.member;
			if (!m) {
				return (
					<span className="text-sm italic text-muted-foreground">
						Anonymous
					</span>
				);
			}
			const isDeleted = Boolean(m.deletedAt);
			const name = fullName(m);
			return (
				<span className="inline-flex min-w-0 items-center gap-2">
					<Avatar name={name} size={26} />
					{isDeleted ? (
						<DeletedLabel deletedAt={m.deletedAt} className="truncate text-sm">
							{name}
						</DeletedLabel>
					) : tenantSlug ? (
						<Link
							href={`/${tenantSlug}/admin/members/${m.id}`}
							onClick={(e) => e.stopPropagation()}
							className="truncate text-sm hover:underline"
						>
							{name}
						</Link>
					) : (
						<span className="truncate text-sm">{name}</span>
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
			const c = t.campaign;
			if (!c) {
				return <span className="text-muted-foreground">—</span>;
			}
			if (c.deletedAt) {
				return (
					<DeletedLabel
						deletedAt={c.deletedAt}
						className="block truncate text-sm"
					>
						{c.title}
					</DeletedLabel>
				);
			}
			return tenantSlug ? (
				<Link
					href={`/${tenantSlug}/admin/campaigns/${c.id}`}
					onClick={(e) => e.stopPropagation()}
					className="block truncate text-sm text-primary hover:underline"
				>
					{c.title}
				</Link>
			) : (
				<span className="block truncate text-sm text-primary">{c.title}</span>
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
