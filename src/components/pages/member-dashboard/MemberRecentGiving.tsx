"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Amount,
	type DataTableColumn,
	DataTableShell,
	DeletedLabel,
	ExpandableCard,
	TypeBadge,
} from "@/components/primitives";
import type { TransactionType } from "@/components/primitives/Badge";
import { type components, nstr } from "@/lib/api";
import dayjs from "@/lib/dayjs";

type Transaction = components["schemas"]["TransactionResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

const TYPE_BADGE: Record<Transaction["type"], TransactionType> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

const relativeDate = (iso: string): string => {
	const d = dayjs(iso);
	const now = dayjs();
	const hours = now.diff(d, "hour", true);
	if (hours < 24) {
		return `Today · ${d.format("h:mma")}`;
	}
	if (hours < 48) {
		return "Yesterday";
	}
	if (hours < 24 * 7) {
		return `${Math.floor(hours / 24)}d ago`;
	}
	return d.format("MMM D");
};

// Member-side recent-giving table — mirrors the admin DashboardRecentGifts
// composition but scopes to the caller's own transactions (the self
// endpoint enforces this server-side). Rows are click-through into the
// member's transactions list (we don't have a per-transaction detail
// route on the member side).
export const MemberRecentGiving = ({
	transactions,
	campaignsById,
	loading,
	tenantSlug,
}: {
	transactions: Transaction[];
	campaignsById: Record<string, Campaign>;
	loading?: boolean;
	tenantSlug: string;
}) => {
	const router = useRouter();
	const recent = transactions.slice(0, 8);

	const columns: DataTableColumn<Transaction>[] = [
		{
			key: "date",
			label: "Date",
			width: "120px",
			render: (t) => (
				<span className="text-sm text-muted-foreground">
					{relativeDate(t.date)}
				</span>
			),
		},
		{
			key: "type",
			label: "Type",
			width: "130px",
			render: (t) => <TypeBadge type={TYPE_BADGE[t.type]} />,
		},
		{
			key: "campaign",
			label: "Campaign",
			render: (t) => {
				const cid = nstr(t.campaignId);
				if (!cid) {
					return (
						<span className="text-sm italic text-muted-foreground">
							Unscoped
						</span>
					);
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
					<Link
						href={`/${tenantSlug}/member/campaigns/${cid}`}
						onClick={(e) => e.stopPropagation()}
						className="block truncate text-sm text-primary hover:underline"
					>
						{c?.title ?? "Campaign"}
					</Link>
				);
			},
		},
		{
			key: "amount",
			label: "Amount",
			width: "120px",
			align: "right",
			render: (t) => <Amount value={t.amount} />,
		},
	];

	// Sub-`md` row → compact info card (no drill-down — the whole list links
	// out to the member's transactions page via "View all").
	const renderGiftCard = (t: Transaction) => {
		const cid = nstr(t.campaignId);
		const c = cid ? campaignsById[cid] : null;
		return (
			<ExpandableCard deleted={Boolean(t.deletedAt)}>
				<div className="flex items-center gap-3">
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<TypeBadge type={TYPE_BADGE[t.type]} />
							<span className="truncate text-xs text-muted-foreground">
								{c?.deletedAt ? (
									<DeletedLabel deletedAt={c.deletedAt}>{c.title}</DeletedLabel>
								) : c ? (
									c.title
								) : (
									<span className="italic">Unscoped</span>
								)}
							</span>
						</div>
						<div className="mt-0.5 text-xs text-muted-foreground">
							{relativeDate(t.date)}
						</div>
					</div>
					<span className="shrink-0 text-sm font-bold tabular-nums">
						<Amount value={t.amount} />
					</span>
				</div>
			</ExpandableCard>
		);
	};

	return (
		<div>
			<div className="mb-3 flex items-baseline justify-between px-1">
				<h2 className="text-base font-semibold">Your Recent giving</h2>
				<Link
					href={`/${tenantSlug}/member/my-transactions`}
					className="text-sm font-medium text-primary hover:underline"
				>
					View all →
				</Link>
			</div>
			<DataTableShell<Transaction>
				columns={columns}
				mobileCard={renderGiftCard}
				rows={recent}
				rowKey={(t) => t.id}
				loading={loading}
				loadingRows={5}
				onRowClick={() => router.push(`/${tenantSlug}/member/my-transactions`)}
				rowClassName={(t) => (t.deletedAt ? "bg-muted/30" : undefined)}
				emptyTitle="No giving recorded yet"
				emptySubtitle="Your gifts will appear here once they're recorded."
			/>
		</div>
	);
};
