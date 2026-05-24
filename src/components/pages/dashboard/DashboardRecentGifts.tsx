"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Amount,
	Avatar,
	type TransactionType as BadgeType,
	type DataTableColumn,
	DataTableShell,
	DeletedLabel,
	TypeBadge,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import dayjs from "@/lib/dayjs";

type Transaction = components["schemas"]["TransactionResponseDto"];

const TYPE_BADGE_LABEL: Record<Transaction["type"], BadgeType> = {
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

export const DashboardRecentGifts = ({
	transactions,
	loading,
	tenantSlug,
}: {
	transactions: Transaction[];
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
				const name =
					`${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || "Unnamed";
				const isDeleted = Boolean(m.deletedAt);
				return (
					<span className="inline-flex min-w-0 items-center gap-2">
						<Avatar name={name} size={26} />
						{isDeleted ? (
							<DeletedLabel
								deletedAt={m.deletedAt}
								className="truncate text-sm"
							>
								{name}
							</DeletedLabel>
						) : (
							<Link
								href={`/${tenantSlug}/admin/members/${m.id}`}
								onClick={(e) => e.stopPropagation()}
								className="truncate text-sm hover:underline"
							>
								{name}
							</Link>
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
			width: "200px",
			render: (t) => {
				const c = t.campaign;
				if (!c) {
					return (
						<span className="text-sm italic text-amber-600">No campaign</span>
					);
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
				return (
					<Link
						href={`/${tenantSlug}/admin/campaigns/${c.id}`}
						onClick={(e) => e.stopPropagation()}
						className="block truncate text-sm text-primary hover:underline"
					>
						{c.title}
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

	return (
		<div>
			<div className="mb-3 flex items-baseline justify-between px-1">
				<h2 className="text-base font-semibold">Recent gifts</h2>
				<Link
					href={`/${tenantSlug}/admin/transactions`}
					className="text-sm font-medium text-primary hover:underline"
				>
					View all →
				</Link>
			</div>
			<DataTableShell<Transaction>
				columns={columns}
				rows={recent}
				rowKey={(t) => t.id}
				loading={loading}
				loadingRows={5}
				onRowClick={(t) =>
					router.push(`/${tenantSlug}/admin/transactions/${t.id}`)
				}
				rowClassName={(t) => (t.deletedAt ? "bg-muted/30" : undefined)}
				emptyTitle="No transactions recorded yet"
			/>
		</div>
	);
};
