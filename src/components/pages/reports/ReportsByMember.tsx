"use client";

import { Card, SectionTitle } from "@/components/primitives";
import type { components } from "@/lib/api";
import { formatCurrency } from "@/lib/format-currency";
import { ReportsHorizontalLeaderBoard } from "./ReportsHorizontalLeaderBoard";
import { ReportsLoadingPlaceholder } from "./ReportsLoadingPlaceholder";
import { MEMBER_RANK_COLORS } from "./reports-shared";

type Transaction = components["schemas"]["TransactionResponseDto"];
type Member = components["schemas"]["MemberResponseDto"];

const ellipsize = (s: string, max = 36) => {
	if (s.length <= max) {
		return s;
	}
	return `${s.slice(0, Math.max(0, max - 1))}\u2026`;
};

export const ReportsByMember = ({
	transactions,
	membersById,
	loading,
}: {
	transactions: Transaction[];
	membersById: Record<string, Member>;
	loading?: boolean;
}) => {
	if (loading) {
		return <ReportsLoadingPlaceholder />;
	}

	const byMember: Record<
		string,
		{ name: string; total: number; count: number }
	> = {};
	for (const t of transactions) {
		const mid = typeof t.memberId === "string" ? t.memberId : "__anon__";
		const m = mid !== "__anon__" ? membersById[mid] : null;
		const name = m
			? `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || "Unnamed"
			: "Anonymous";
		if (!byMember[mid]) {
			byMember[mid] = { name, total: 0, count: 0 };
		}
		byMember[mid].total += t.amount;
		byMember[mid].count += 1;
	}

	const sorted = Object.entries(byMember)
		.sort(([, a], [, b]) => b.total - a.total)
		.slice(0, 15);

	const chartRows = sorted.map(([mid, data], idx) => ({
		key: mid,
		axisLabel: ellipsize(data.name),
		title: data.name,
		metric: data.total,
		amountDisplay: formatCurrency(data.total),
		rank: idx + 1,
		fill: MEMBER_RANK_COLORS[idx % MEMBER_RANK_COLORS.length],
		countLabel: `${data.count} gifts`,
	}));

	return (
		<Card className="mb-6">
			<SectionTitle title="Top givers" />
			{chartRows.length === 0 ? (
				<div className="py-8 text-center text-sm text-muted-foreground">
					No transactions found.
				</div>
			) : (
				<ReportsHorizontalLeaderBoard rows={chartRows} />
			)}
		</Card>
	);
};
