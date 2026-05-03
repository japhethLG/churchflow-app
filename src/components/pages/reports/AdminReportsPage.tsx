"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Button, Chip, PageHeader } from "@/components/primitives";
import type { components } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { useTransactionSummary, useTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { ReportsByCampaign } from "./ReportsByCampaign";
import { ReportsByMember } from "./ReportsByMember";
import { ReportsByMonth } from "./ReportsByMonth";
import { ReportsByType } from "./ReportsByType";

type Tab = "by-type" | "by-member" | "by-campaign" | "by-month";

type Campaign = components["schemas"]["CampaignResponseDto"];
type Member = components["schemas"]["MemberResponseDto"];

const TABS: { key: Tab; label: string }[] = [
	{ key: "by-type", label: "By Type" },
	{ key: "by-member", label: "By Member" },
	{ key: "by-campaign", label: "By Campaign" },
	{ key: "by-month", label: "By Month" },
];

export const AdminReportsPage = () => {
	const { tenantSlug } = useParams<{ tenantSlug: string }>();
	const [tab, setTab] = useState<Tab>("by-type");

	// Fetch YTD summary (up to 12 months)
	const _ytdMonths = dayjs().month() + 1;
	const summary = useTransactionSummary(tenantSlug, 12);

	// For By Member and By Campaign tabs, we need raw transactions
	const txQuery = useTransactions(
		tenantSlug,
		{ limit: 500 },
		tab === "by-member" || tab === "by-campaign",
	);
	const membersQ = useMembers(tenantSlug, { limit: 500 }, tab === "by-member");
	const campaignsQ = useCampaigns(tenantSlug, tab === "by-campaign");

	const members: Member[] = membersQ.data?.items ?? [];
	const campaigns: Campaign[] = campaignsQ.data?.items ?? [];
	const membersById: Record<string, Member> = Object.fromEntries(
		members.map((m) => [m.id, m]),
	);
	const campaignsById: Record<string, Campaign> = Object.fromEntries(
		campaigns.map((c) => [c.id, c]),
	);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Insights"
				title="Reports"
				subtitle="Income insights across members, types, campaigns, and time."
				action={
					<Button variant="secondary" icon="download" disabled>
						Export CSV
					</Button>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				{/* Tab bar */}
				<div className="mb-5 flex w-fit gap-1.5 rounded-full bg-muted p-1">
					{TABS.map((t) => (
						<Button
							key={t.key}
							type="button"
							variant="ghost"
							size="sm"
							className={cn(
								"h-9 px-[18px] py-2 font-inherit text-[13px] shadow-none hover:bg-transparent",
								tab === t.key
									? "bg-card text-foreground shadow-sm"
									: "bg-transparent text-muted-foreground",
							)}
							onClick={() => setTab(t.key)}
						>
							{t.label}
						</Button>
					))}
				</div>

				{/* Date range chips */}
				<div className="mb-5 flex gap-2.5">
					<Chip icon="calendar">
						Jan 1 — {dayjs().format("MMM D")}, {dayjs().year()}
					</Chip>
				</div>

				{/* Tab content */}
				{tab === "by-type" && (
					<>
						<ReportsByType summary={summary.data} loading={summary.isLoading} />
						<ReportsByMonth
							summary={summary.data}
							loading={summary.isLoading}
						/>
					</>
				)}

				{tab === "by-member" && (
					<ReportsByMember
						transactions={txQuery.data?.items ?? []}
						membersById={membersById}
						loading={txQuery.isLoading || membersQ.isLoading}
					/>
				)}

				{tab === "by-campaign" && (
					<ReportsByCampaign
						transactions={txQuery.data?.items ?? []}
						campaignsById={campaignsById}
						loading={txQuery.isLoading || campaignsQ.isLoading}
					/>
				)}

				{tab === "by-month" && (
					<ReportsByMonth summary={summary.data} loading={summary.isLoading} />
				)}
			</div>
		</div>
	);
};
