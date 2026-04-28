"use client";

import type { components } from "@/lib/api";
import { Card, SectionTitle } from "@/components/primitives";
import { CAMPAIGN_RANK_COLORS, fmtCurrency } from "./reports-shared";
import {
  ReportsHorizontalLeaderBoard,
  type LeaderBoardRowData,
} from "./ReportsHorizontalLeaderBoard";
import { ReportsLoadingPlaceholder } from "./ReportsLoadingPlaceholder";

type Transaction = components["schemas"]["TransactionResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

const ellipsize = (s: string, max = 42) => {
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(0, max - 1))}\u2026`;
};

export const ReportsByCampaign = ({
  transactions,
  campaignsById,
  currency,
  loading,
}: {
  transactions: Transaction[];
  campaignsById: Record<string, Campaign>;
  currency: string;
  loading?: boolean;
}) => {
  if (loading) {
    return <ReportsLoadingPlaceholder />;
  }

  const byCampaign: Record<
    string,
    { name: string; total: number; count: number }
  > = {};
  for (const t of transactions) {
    const cid = typeof t.campaignId === "string" ? t.campaignId : "__none__";
    const c = cid !== "__none__" ? campaignsById[cid] : null;
    const name = c ? c.title : "Unattributed";
    if (!byCampaign[cid]) byCampaign[cid] = { name, total: 0, count: 0 };
    byCampaign[cid].total += t.amount;
    byCampaign[cid].count += 1;
  }

  const sorted = Object.entries(byCampaign).sort(
    ([, a], [, b]) => b.total - a.total,
  );

  const chartRows: LeaderBoardRowData[] = sorted.map(([cid, data], idx) => ({
    key: cid,
    axisLabel: ellipsize(data.name),
    title:
      cid === "__none__"
        ? `${data.name} — not linked to a campaign`
        : data.name,
    metric: data.total,
    amountDisplay: `${currency} ${fmtCurrency(data.total)}`,
    rank: idx + 1,
    fill: CAMPAIGN_RANK_COLORS[idx % CAMPAIGN_RANK_COLORS.length],
    countLabel: `${data.count} gifts`,
  }));

  return (
    <Card className="mb-6">
      <SectionTitle title="By campaign" />
      {chartRows.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No transactions found.
        </div>
      ) : (
        <ReportsHorizontalLeaderBoard rows={chartRows} />
      )}
    </Card>
  );
}
