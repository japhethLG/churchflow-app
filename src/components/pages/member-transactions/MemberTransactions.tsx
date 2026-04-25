"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  PageHeader,
  DataTable,
  Chip,
  Amount,
  Icon,
} from "@/components/primitives";
import { TypeBadge, type TransactionType } from "@/components/primitives/Badge";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { useMyMembership } from "@/lib/api/members";
import { useTransactions } from "@/lib/api/transactions";
import { useCampaigns } from "@/lib/api/campaigns";
import { useTenant } from "@/lib/api/tenants";
import { nstr } from "@/lib/api/coerce";
import type { components } from "@/lib/api";

type Transaction = components["schemas"]["TransactionResponseDto"];

function fmtCurrency(v: number | string): string {
  return Number(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const TYPE_MAP: Record<string, TransactionType> = {
  TITHE: "Tithe",
  OFFERING: "Offering",
  MISSION_GIVING: "Mission",
  FIRST_FRUIT: "First Fruit",
  COMMITMENT: "Commitment",
  DONATION: "Donation",
  OTHER: "Other",
};

export function MemberTransactions({
  campaignItemMap = {},
}: {
  campaignItemMap?: Record<string, string>;
}) {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [rangeFilter, setRangeFilter] = useState<string>("YEAR");

  // Tenant info for currency
  const tenantQ = useTenant(tenantSlug);
  const currency = tenantQ.data?.currency ?? "USD";
  const currencySymbol =
    currency === "USD"
      ? "$"
      : currency === "EUR"
        ? "€"
        : currency === "GBP"
          ? "£"
          : currency;

  // Current member
  const memberQ = useMyMembership(tenantSlug);
  const memberId = memberQ.data?.id;

  // Campaigns to resolve titles
  const campaignsQ = useCampaigns(tenantSlug);
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
    const now = new Date();
    if (rangeFilter === "MONTH") {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
    if (rangeFilter === "YEAR") {
      return new Date(now.getFullYear(), 0, 1).toISOString();
    }
    return undefined;
  }, [rangeFilter]);

  // Fetch transactions
  const txQ = useTransactions(
    tenantSlug,
    {
      memberId,
      type: typeFilter === "ALL" ? undefined : (typeFilter as any),
      dateFrom,
      limit: 1000,
    },
    Boolean(memberId),
  );
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
        <span style={{ color: S.onSurfaceMuted }}>
          {new Date(t.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "type",
      label: "Type",
      width: "140px",
      render: (t: Transaction) => <TypeBadge type={TYPE_MAP[t.type] || "Other"} />,
    },
    {
      key: "campaign",
      label: "Campaign",
      render: (t: Transaction) => {
        const title = t.campaignId ? campaignMap[t.campaignId as any] : null;
        const itemTitle = t.campaignItemId ? campaignItemMap[t.campaignItemId as any] : null;
        return (
          <span style={{ color: title ? S.onSurface : S.onSurfaceMuted }}>
            {title || "\u2014"}
            {itemTitle && (
              <span style={{ color: S.onSurfaceMuted, marginLeft: 4 }}>
                [{itemTitle}]
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "method",
      label: "Payment method",
      width: "180px",
      render: (t: Transaction) => (
        <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <Icon
            name={
              t.paymentMethod === "CASH"
                ? "cash"
                : t.paymentMethod === "CHECK"
                  ? "check_rect"
                  : t.paymentMethod === "BANK_TRANSFER"
                    ? "bank"
                    : t.paymentMethod === "MOBILE_MONEY"
                      ? "phone"
                      : "receipt"
            }
            size={16}
            color={S.onSurfaceMuted}
          />
          <span style={{ color: S.onSurfaceMuted, textTransform: "capitalize" }}>
            {t.paymentMethod.toLowerCase().replace("_", " ")}
          </span>
        </div>
      ),
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
            color: S.onSurfaceMuted,
          }}
        >
          {nstr(t.note) ? (t.note as any).slice(0, 10) : "\u2014"}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      width: "120px",
      align: "right" as const,
      render: (t: Transaction) => (
        <Amount value={fmtCurrency(t.amount)} currency={currencySymbol} />
      ),
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
          background: S.surfaceContainerLow,
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

        <div style={{ width: 1, height: 24, background: S.surfaceContainer }} />

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
          style={{ marginLeft: "auto", fontSize: 12, color: S.onSurfaceMuted }}
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
              color: S.onSurfaceMuted,
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
            {currencySymbol}
            {fmtCurrency(stats.total)}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: S.onSurfaceMuted,
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
              color: S.onSurfaceMuted,
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
            {currencySymbol}
            {fmtCurrency(stats.avg)}
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
}
