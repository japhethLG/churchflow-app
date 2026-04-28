"use client";

import { StatCard, Amount } from "@/components/primitives";
import { TypeBadge } from "@/components/primitives/Badge";

type Transaction = {
  type: string;
  amount: number;
  date: string;
};

const fmtCurrency = (v: number | string): string  => {
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TYPE_LABEL: Record<string, string> = {
  TITHE: "Tithe",
  OFFERING: "Offering",
  MISSION_GIVING: "Mission",
  FIRST_FRUIT: "First Fruit",
  COMMITMENT: "Commitment",
  DONATION: "Donation",
  OTHER: "Other",
};

export const MemberKpiStrip = ({
  transactions,
  loading,
  currency = "$",
}: {
  transactions: Transaction[];
  loading?: boolean;
  currency?: string;
}) => {
  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <StatCard key={i} label="Loading…" value="" caption="" />
        ))}
      </div>
    );
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const thisMonth = transactions.filter((t) => new Date(t.date) >= monthStart);
  const thisYear = transactions.filter((t) => new Date(t.date) >= yearStart);

  const monthTotal = thisMonth.reduce((s, t) => s + Number(t.amount), 0);
  const yearTotal = thisYear.reduce((s, t) => s + Number(t.amount), 0);

  // Most recent gift
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const recent = sorted[0];
  const recentDays = recent
    ? Math.floor((now.getTime() - new Date(recent.date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const recentCaption = recent
    ? (() => {
        const typeLabel = TYPE_LABEL[recent.type] ?? recent.type;
        const daysText = recentDays === 0 ? "Today" : recentDays === 1 ? "Yesterday" : `${recentDays}d ago`;
        return (
          <span className="inline-flex items-center gap-2">
            <TypeBadge type={typeLabel as "Tithe"} /> {daysText}
          </span>
        );
      })()
    : "No gifts yet";

  return (
    <div className="mb-6 grid grid-cols-3 gap-4">
      <StatCard
        label="Your giving this month"
        value={<Amount value={fmtCurrency(monthTotal)} size="display" gradient currency={currency} />}
        caption={`${thisMonth.length} gift${thisMonth.length !== 1 ? "s" : ""} recorded`}
      />
      <StatCard
        label="Your giving this year"
        value={<Amount value={fmtCurrency(yearTotal)} size="display" currency={currency} />}
        caption={`Fiscal year started January`}
      />
      <StatCard
        label="Most recent gift"
        value={
          recent ? (
            <Amount value={fmtCurrency(recent.amount)} size="display" currency={currency} />
          ) : (
            <span className="text-5xl font-semibold text-muted-foreground">—</span>
          )
        }
        caption={recentCaption}
      />
    </div>
  );
}
