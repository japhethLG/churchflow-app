"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Amount,
	Avatar,
	type TransactionType as BadgeType,
	Card,
	type DataTableColumn,
	DataTableShell,
	DeletedLabel,
	TypeBadge,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { relativeUtcDate } from "@/lib/dayjs";
import { cn } from "@/lib/utils";

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
					{relativeUtcDate(t.date)}
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

	const memberName = (t: Transaction): string | null => {
		const m = t.member;
		if (!m) {
			return null;
		}
		return `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || "Unnamed";
	};

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

			{/* Desktop: the full data table. */}
			<div className="hidden md:block">
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

			{/* Mobile: a tap-through list — a table doesn't fit a phone. */}
			<div className="md:hidden">
				{recent.length === 0 ? (
					<Card padding={20}>
						<p className="text-center text-sm text-muted-foreground">
							No transactions recorded yet
						</p>
					</Card>
				) : (
					<Card padding={8}>
						{recent.map((t, i) => {
							const name = memberName(t);
							const c = t.campaign;
							return (
								<Link
									key={t.id}
									href={`/${tenantSlug}/admin/transactions/${t.id}`}
									className={cn(
										"flex items-center gap-3 rounded-xl p-2.5 no-underline transition-colors hover:bg-muted",
										t.deletedAt && "opacity-60",
										i < recent.length - 1 &&
											"border-b border-border/60 rounded-b-none",
									)}
								>
									<Avatar name={name ?? "?"} size={32} />
									<div className="min-w-0 flex-1">
										<div className="flex items-baseline justify-between gap-2">
											<span
												className={cn(
													"truncate text-sm font-semibold",
													name
														? "text-foreground"
														: "italic text-muted-foreground",
												)}
											>
												{name ?? "Anonymous"}
											</span>
											<span className="shrink-0 text-sm font-bold tabular-nums">
												<Amount value={t.amount} />
											</span>
										</div>
										<div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
											<TypeBadge type={TYPE_BADGE_LABEL[t.type]} />
											{c ? (
												<span className="truncate text-primary">{c.title}</span>
											) : (
												<span className="italic text-amber-600">
													No campaign
												</span>
											)}
											<span className="ml-auto shrink-0 whitespace-nowrap">
												{relativeUtcDate(t.date)}
											</span>
										</div>
									</div>
								</Link>
							);
						})}
					</Card>
				)}
			</div>
		</div>
	);
};
