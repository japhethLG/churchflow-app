"use client";

import Link from "next/link";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Card, SectionTitle, Avatar, TypeBadge, Amount } from "@/components/primitives";
import type { components } from "@/lib/api";
import { nstr } from "@/lib/api/coerce";

type Transaction = components["schemas"]["TransactionResponseDto"];
type Member = components["schemas"]["MemberResponseDto"];

const TYPE_UI: Record<Transaction["type"], string> = {
  TITHE: "Tithe",
  OFFERING: "Offering",
  MISSION_GIVING: "Mission",
  FIRST_FRUIT: "First Fruit",
  COMMITMENT: "Commitment",
  DONATION: "Donation",
  OTHER: "Other",
};

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 24) {
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "pm" : "am";
    const hr = h % 12 || 12;
    return `Today, ${hr}:${String(m).padStart(2, "0")}${ampm}`;
  }
  if (hours < 48) return "Yesterday";
  if (hours < 24 * 7) return `${Math.floor(hours / 24)} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DashboardRecentGifts({
  transactions,
  membersById,
  loading,
  tenantSlug,
}: {
  transactions: Transaction[];
  membersById: Record<string, Member>;
  loading?: boolean;
  tenantSlug: string;
}) {
  if (loading) {
    return (
      <Card>
        <SectionTitle title="Recent gifts" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "36px 1fr auto auto",
              gap: 12,
              alignItems: "center",
              padding: "10px 8px",
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: S.surfaceContainer }} />
            <div>
              <div style={{ height: 14, width: 120, background: S.surfaceContainer, borderRadius: 4, marginBottom: 4 }} />
              <div style={{ height: 10, width: 80, background: S.surfaceContainer, borderRadius: 3 }} />
            </div>
            <div style={{ height: 20, width: 50, background: S.surfaceContainer, borderRadius: 9999 }} />
            <div style={{ height: 14, width: 60, background: S.surfaceContainer, borderRadius: 4 }} />
          </div>
        ))}
      </Card>
    );
  }

  const recent = transactions.slice(0, 6);

  return (
    <Card>
      <SectionTitle
        title="Recent gifts"
        action={
          <Link
            href={`/${tenantSlug}/admin/transactions`}
            style={{ fontSize: 13, color: S.primary, fontWeight: 500, textDecoration: "none" }}
          >
            View all →
          </Link>
        }
      />
      {recent.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: S.onSurfaceMuted, fontSize: 14 }}>
          No transactions recorded yet.
        </div>
      ) : (
        recent.map((t, i) => {
          const memberId = nstr(t.memberId);
          const member = memberId ? membersById[memberId] : null;
          const isAnon = !member;
          const name = member
            ? `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || "Unnamed"
            : "Anonymous";
          const typeLabel = TYPE_UI[t.type] as
            | "Tithe" | "Offering" | "Mission" | "First Fruit"
            | "Commitment" | "Donation" | "Other";

          return (
            <div
              key={t.id}
              style={{
                display: "grid",
                gridTemplateColumns: "36px 1fr auto auto",
                gap: 12,
                alignItems: "center",
                padding: "10px 8px",
                borderRadius: 10,
                background: i === 0 ? S.surfaceContainerLow : "transparent",
                transition: "background 0.15s",
              }}
            >
              {isAnon ? (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: S.surfaceContainer,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                    color: S.onSurfaceMuted,
                  }}
                >
                  ?
                </div>
              ) : (
                <Avatar name={name} size={32} />
              )}
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: isAnon ? S.onSurfaceMuted : S.onSurface,
                    fontStyle: isAnon ? "italic" : "normal",
                  }}
                >
                  {name}
                </div>
                <div style={{ fontSize: 11, color: S.onSurfaceMuted }}>{relativeDate(t.date)}</div>
              </div>
              <TypeBadge type={typeLabel} />
              <Amount value={Number(t.amount).toFixed(2)} currency={t.currency} />
            </div>
          );
        })
      )}
    </Card>
  );
}
