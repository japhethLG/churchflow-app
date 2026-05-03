"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Amount, Chip, DataTable, PageHeader } from "@/components/primitives";
import { type TransactionType, TypeBadge } from "@/components/primitives/Badge";
import type { components } from "@/lib/api";
import { useMyCampaigns } from "@/lib/api/campaigns";
import { nstr } from "@/lib/api/coerce";
import { useMyProfile } from "@/lib/api/members";
import { useMyTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";

type Transaction = components["schemas"]["TransactionResponseDto"];

const TYPE_MAP: Record<string, TransactionType> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

export const MemberTransactions = ({
	campaignItemMap = {},
}: {
	campaignItemMap?: Record<string, string>;
}) => {
	const { tenantSlug } = useParams<{ tenantSlug: string }>();
	const [typeFilter, setTypeFilter] = useState<string>("ALL");
	const [rangeFilter, setRangeFilter] = useState<string>("YEAR");

	// Current member (kept around for any downstream side effects)
	useMyProfile(tenantSlug);

	// Campaigns to resolve titles (member-visible)
	const campaignsQ = useMyCampaigns(tenantSlug);
	const campaigns = campaignsQ.data?.items ?? [];
	const campaignMap = useMemo(() => {
		return campaigns.reduce(
			(acc, c) => {
				acc[c.id] = c.title;
				return acc;
			},
			{} as Record<string, string>,
		);
	}, [campaigns]);

	// Date range logic
	const dateFrom = useMemo(() => {
		const now = dayjs();
		if (rangeFilter === "MONTH") {
			return now.startOf("month").toISOString();
		}
		if (rangeFilter === "YEAR") {
			return now.startOf("year").toISOString();
		}
		return undefined;
	}, [rangeFilter]);

	// Fetch the caller's own transactions — self-scoped automatically
	const txQ = useMyTransactions(tenantSlug, {
		type:
			typeFilter === "ALL" ? undefined : (typeFilter as Transaction["type"]),
		dateFrom,
		limit: 1000,
	});
	const transactions = txQ.data?.items ?? [];

	// Summary stats
	const stats = useMemo(() => {
		const total = transactions.reduce((s, t) => s + Number(t.amount), 0);
		const count = transactions.length;
		const avg = count > 0 ? total / count : 0;
		return { total, count, avg };
	}, [transactions]);

	const columns = [
		{
			key: "date",
			label: "Date",
			width: "120px",
			render: (t: Transaction) => (
				<span style={{ color: "var(--muted-foreground)" }}>
					{dayjs(t.date).format("MMM D, YYYY")}
				</span>
			),
		},
		{
			key: "type",
			label: "Type",
			width: "140px",
			render: (t: Transaction) => (
				<TypeBadge type={TYPE_MAP[t.type] || "Other"} />
			),
		},
		{
			key: "campaign",
			label: "Campaign",
			render: (t: Transaction) => {
				const title = t.campaignId
					? campaignMap[t.campaignId as unknown as string]
					: null;
				const itemTitle = t.campaignItemId
					? campaignItemMap[t.campaignItemId as unknown as string]
					: null;
				return (
					<span
						style={{
							color: title ? "var(--foreground)" : "var(--muted-foreground)",
						}}
					>
						{title || "\u2014"}
						{itemTitle && (
							<span style={{ color: "var(--muted-foreground)", marginLeft: 4 }}>
								[{itemTitle}]
							</span>
						)}
					</span>
				);
			},
		},
		{
			key: "ref",
			label: "Reference #",
			width: "140px",
			render: (t: Transaction) => (
				<span
					style={{
						fontFamily: "var(--font-mono, monospace)",
						fontSize: 12,
						color: "var(--muted-foreground)",
					}}
				>
					{nstr(t.note) ? (t.note as unknown as string).slice(0, 10) : "\u2014"}
				</span>
			),
		},
		{
			key: "amount",
			label: "Amount",
			width: "120px",
			align: "right" as const,
			render: (t: Transaction) => <Amount value={t.amount} />,
		},
	];

	const types: { label: string; value: string }[] = [
		{ label: "All types", value: "ALL" },
		{ label: "Tithe", value: "TITHE" },
		{ label: "Offering", value: "OFFERING" },
		{ label: "Mission", value: "MISSION_GIVING" },
		{ label: "First Fruit", value: "FIRST_FRUIT" },
	];

	return (
		<div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
			<PageHeader
				overline="My Giving"
				title="Your giving history."
				subtitle="Everything Grace Community has recorded for you \u2014 private, and always yours."
			/>

			{/* Filter bar */}
			<div
				style={{
					background: "var(--muted)",
					borderRadius: 16,
					padding: 12,
					display: "flex",
					gap: 10,
					alignItems: "center",
					marginBottom: 20,
					flexWrap: "wrap",
				}}
			>
				<div style={{ display: "flex", gap: 6 }}>
					<Chip
						active={rangeFilter === "MONTH"}
						onClick={() => setRangeFilter("MONTH")}
					>
						This month
					</Chip>
					<Chip
						active={rangeFilter === "YEAR"}
						onClick={() => setRangeFilter("YEAR")}
					>
						This year
					</Chip>
					<Chip
						active={rangeFilter === "ALL"}
						onClick={() => setRangeFilter("ALL")}
					>
						All time
					</Chip>
				</div>

				<div style={{ width: 1, height: 24, background: "var(--secondary)" }} />

				<div style={{ display: "flex", gap: 6 }}>
					{types.map((t) => (
						<Chip
							key={t.value}
							active={typeFilter === t.value}
							onClick={() => setTypeFilter(t.value)}
						>
							{t.label}
						</Chip>
					))}
				</div>

				<div
					style={{
						marginLeft: "auto",
						fontSize: 12,
						color: "var(--muted-foreground)",
					}}
				>
					{transactions.length} gift{transactions.length !== 1 ? "s" : ""}
				</div>
			</div>

			{/* Summary strip */}
			<div
				style={{
					display: "flex",
					gap: 40,
					padding: "16px 24px",
					marginBottom: 24,
				}}
			>
				<div>
					<div
						style={{
							fontSize: 11,
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "var(--muted-foreground)",
							marginBottom: 6,
						}}
					>
						Total in range
					</div>
					<div
						style={{
							fontSize: 24,
							fontWeight: 600,
							letterSpacing: "-0.02em",
							fontVariantNumeric: "tabular-nums",
						}}
					>
						{formatCurrency(stats.total)}
					</div>
				</div>
				<div>
					<div
						style={{
							fontSize: 11,
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "var(--muted-foreground)",
							marginBottom: 6,
						}}
					>
						Gifts in range
					</div>
					<div
						style={{
							fontSize: 24,
							fontWeight: 600,
							letterSpacing: "-0.02em",
							fontVariantNumeric: "tabular-nums",
						}}
					>
						{stats.count}
					</div>
				</div>
				<div>
					<div
						style={{
							fontSize: 11,
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "var(--muted-foreground)",
							marginBottom: 6,
						}}
					>
						Average per gift
					</div>
					<div
						style={{
							fontSize: 24,
							fontWeight: 600,
							letterSpacing: "-0.02em",
							fontVariantNumeric: "tabular-nums",
						}}
					>
						{formatCurrency(stats.avg)}
					</div>
				</div>
			</div>

			{/* Table */}
			<DataTable
				columns={columns}
				rows={transactions}
				rowKey={(t) => t.id}
				loading={txQ.isLoading}
				emptyTitle="No transactions found"
				emptySubtitle="Try adjusting your filters or date range."
			/>
		</div>
	);
};
