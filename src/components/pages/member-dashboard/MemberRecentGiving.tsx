"use client";

import Link from "next/link";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Card, SectionTitle, Amount } from "@/components/primitives";
import { TypeBadge } from "@/components/primitives/Badge";
import type { components } from "@/lib/api";

type Transaction = components["schemas"]["TransactionResponseDto"];

const TYPE_LABEL: Record<string, string> = {
  TITHE: "Tithe",
  OFFERING: "Offering",
  MISSION_GIVING: "Mission",
  FIRST_FRUIT: "First Fruit",
  COMMITMENT: "Commitment",
  DONATION: "Donation",
  OTHER: "Other",
};

const METHOD_LABEL: Record<string, string> = {
  CASH: "Cash",
  CHECK: "Check",
  BANK_TRANSFER: "Bank transfer",
  ONLINE: "Online",
  MOBILE_MONEY: "Mobile money",
  OTHER: "Other",
};

const fmtDate = (iso: string): string  => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const fmtCurrency = (v: number | string): string  => {
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const MemberRecentGiving = ({
  transactions,
  loading,
  tenantSlug,
}: {
  transactions: Transaction[];
  loading?: boolean;
  tenantSlug: string;
}) => {
  if (loading) {
    return (
      <Card>
        <SectionTitle title="Recent giving" />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "70px 110px 1fr auto",
              gap: 16,
              alignItems: "center",
              padding: "14px 12px",
            }}
          >
            <div style={{ height: 14, width: 50, background: S.surfaceContainer, borderRadius: 4 }} />
            <div style={{ height: 22, width: 80, background: S.surfaceContainer, borderRadius: 9999 }} />
            <div style={{ height: 14, width: 100, background: S.surfaceContainer, borderRadius: 4 }} />
            <div style={{ height: 14, width: 60, background: S.surfaceContainer, borderRadius: 4 }} />
          </div>
        ))}
      </Card>
    );
  }

  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Card>
      <SectionTitle
        title="Recent giving"
        action={
          <Link
            href={`/${tenantSlug}/member/my-transactions`}
            style={{ fontSize: 13, color: S.primary, fontWeight: 500, textDecoration: "none" }}
          >
            View all my giving →
          </Link>
        }
      />
      {recent.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: S.onSurfaceMuted, fontSize: 14 }}>
          No giving history yet.
        </div>
      ) : (
        recent.map((t, i) => (
          <div
            key={t.id}
            style={{
              display: "grid",
              gridTemplateColumns: "70px 110px 1fr auto",
              gap: 16,
              alignItems: "center",
              padding: "14px 12px",
              borderRadius: 10,
              background: i === 0 ? S.surfaceContainerLow : "transparent",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: S.onSurfaceMuted,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fmtDate(t.date)}
            </div>
            <TypeBadge type={(TYPE_LABEL[t.type] ?? t.type) as "Tithe"} />
            <div style={{ fontSize: 13, color: S.onSurfaceMuted }}>
              {METHOD_LABEL[t.paymentMethod] ?? t.paymentMethod}
            </div>
            <Amount value={fmtCurrency(t.amount)} currency={t.currency === "USD" ? "$" : t.currency} />
          </div>
        ))
      )}
    </Card>
  );
}
