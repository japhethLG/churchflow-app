"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SectionTitle } from "@/components/primitives";
import {
  fmtCompact,
  fmtCurrency,
  MONTH_SHORT,
  type ByMonthDto,
  type SummaryDto,
} from "./reports-shared";
import { ReportsBarTooltip } from "./ReportsChartTooltip";
import { ReportsLoadingPlaceholder } from "./ReportsLoadingPlaceholder";

export const ReportsByMonth = ({
  summary,
  loading,
}: {
  summary: SummaryDto | undefined;
  loading?: boolean;
}) => {
  if (loading || !summary) {
    return <ReportsLoadingPlaceholder />;
  }

  const byMonth: ByMonthDto[] = summary.byMonth ?? [];
  const now = new Date();
  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const barData = byMonth.map((m) => {
    const [, mm] = m.month.split("-");
    const monthIdx = parseInt(mm, 10) - 1;
    return {
      label: MONTH_SHORT[monthIdx] ?? m.month,
      total: m.total,
      count: m.count,
      isCurrent: m.month === currentMonth,
      isCurrentLabel: m.month === currentMonth ? " (MTD)" : "",
    };
  });

  return (
    <Card className="mb-6">
      <SectionTitle title="Month-over-month" />
      {barData.length > 0 ? (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barCategoryGap="16%">
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="var(--input)"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => fmtCompact(Number(v))}
                width={50}
              />
              <Tooltip
                content={<ReportsBarTooltip />}
                cursor={{
                  fill: "color-mix(in srgb, var(--accent) 27%, transparent)",
                }}
              />
              <defs>
                <linearGradient id="reportBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--ring)" stopOpacity={0.9} />
                  <stop
                    offset="100%"
                    stopColor="var(--primary)"
                    stopOpacity={0.7}
                  />
                </linearGradient>
                <linearGradient id="reportBarActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--ring)" />
                  <stop offset="100%" stopColor="var(--primary)" />
                </linearGradient>
              </defs>
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {barData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      entry.isCurrent
                        ? "url(#reportBarActive)"
                        : "url(#reportBarGradient)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="grid h-[200px] place-items-center text-sm text-muted-foreground">
          No data for this period
        </div>
      )}
    </Card>
  );
}
