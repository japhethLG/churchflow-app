"use client";

import Link from "next/link";
import { TX_TYPE_LABEL } from "@/components/pages/admin-shared";
import {
	Amount,
	Avatar,
	type DataTableColumn,
	DeletedLabel,
	ExpandableCard,
	Icon,
	RowActionsMenu,
	TypeBadge,
} from "@/components/primitives";
import { type components, nstr } from "@/lib/api";
import { formatUtcDate } from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";

export type TransactionRow = components["schemas"]["TransactionResponseDto"];
type EmbeddedMember = NonNullable<TransactionRow["member"]>;

const fmtDate = (iso: string): string => {
	return formatUtcDate(iso, "MMM D");
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
		render: (t) => <TypeBadge type={TX_TYPE_LABEL[t.type]} />,
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

// Sub-`md` row → expandable card, shared by the transactions list and the
// member-detail transactions tab. Collapsed: member/anonymous + date·campaign
// + type + amount; expanded: campaign, reference #, full date, note. Links to
// the transaction detail page (matching the desktop row click).
export const transactionMobileCard =
	(tenantSlug: string) => (t: TransactionRow) => {
		const m = t.member;
		const name = m ? fullName(m) : "";
		const campaignTitle = t.campaign?.title ?? null;
		const ref = nstr(t.referenceNumber);
		const note = nstr(t.note);
		return (
			<ExpandableCard
				href={`/${tenantSlug}/admin/transactions/${t.id}`}
				deleted={Boolean(t.deletedAt)}
				details={[
					{
						label: "Campaign",
						value: campaignTitle ? (
							<span className="text-sm font-medium text-primary">
								{campaignTitle}
							</span>
						) : (
							<span className="text-sm text-muted-foreground">—</span>
						),
					},
					{
						label: "Reference #",
						value: ref ? (
							<span className="font-mono text-xs font-medium text-foreground">
								{ref}
							</span>
						) : (
							<span className="text-sm text-muted-foreground">—</span>
						),
					},
					{
						label: "Date",
						value: (
							<span className="text-sm font-medium text-foreground">
								{formatUtcDate(t.date, "MMM D, YYYY")}
							</span>
						),
					},
					...(note
						? [
								{
									label: "Note",
									value: (
										<span className="text-sm font-medium text-foreground">
											{note}
										</span>
									),
								},
							]
						: []),
				]}
			>
				<div className="flex items-center gap-3">
					{m ? (
						<Avatar name={name} size={36} />
					) : (
						<div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
							<Icon name="user" size={17} />
						</div>
					)}
					<div className="min-w-0 flex-1">
						<div
							className={`truncate text-sm font-semibold tracking-tight ${
								m ? "" : "italic text-muted-foreground"
							}`}
						>
							{m ? name : "Anonymous"}
						</div>
						<div className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
							<span>{formatUtcDate(t.date, "MMM D")}</span>
							<span className="size-0.5 rounded-full bg-muted-foreground" />
							<span className="truncate">{campaignTitle ?? "No campaign"}</span>
						</div>
					</div>
					<div className="flex shrink-0 flex-col items-end gap-1">
						<span className="text-[15px] font-bold tabular-nums tracking-tight">
							{formatCurrency(t.amount, { decimals: 0 })}
						</span>
						<TypeBadge type={TX_TYPE_LABEL[t.type]} />
					</div>
				</div>
			</ExpandableCard>
		);
	};
