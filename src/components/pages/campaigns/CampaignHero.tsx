"use client";

import { SANCTUARY as S } from "@/lib/design/tokens";
import type { ReactNode } from "react";
import { nstr, type components } from "@/lib/api";

type Campaign = components["schemas"]["CampaignWithItemsResponseDto"];

const STATUS_LABEL: Record<Campaign["status"], string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function fmtDeadline(d: string | null): string {
  if (!d) return "Open-ended · no deadline";
  const date = new Date(d);
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  const fmt = date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  if (days < 0) return `Deadline · ${fmt} (passed)`;
  if (days === 0) return `Deadline · ${fmt} (today)`;
  return `Deadline · ${fmt} (${days} days left)`;
}

export function CampaignHero({
  campaign,
  actions,
}: {
  campaign: Campaign;
  actions?: ReactNode;
}) {
  const isActive = campaign.status === "ACTIVE";
  return (
    <div
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`
          : S.surfaceContainerLow,
        borderRadius: 20,
        padding: "28px 32px",
        color: isActive ? "#fff" : S.onSurface,
        marginBottom: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 24,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Pill bg={isActive ? "rgba(255,255,255,0.2)" : S.surfaceContainer}>
            {STATUS_LABEL[campaign.status]}
          </Pill>
          <Pill bg={isActive ? "rgba(255,255,255,0.2)" : S.surfaceContainer}>
            {campaign.currency}
          </Pill>
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {campaign.title}
        </h1>
        <div
          style={{
            fontSize: 14,
            opacity: isActive ? 0.85 : 1,
            color: isActive ? "#fff" : S.onSurfaceMuted,
            marginTop: 8,
          }}
        >
          {fmtDeadline(nstr(campaign.deadline))}
        </div>
        {nstr(campaign.description) && (
          <p
            style={{
              margin: "16px 0 0",
              fontSize: 14,
              lineHeight: 1.6,
              maxWidth: 640,
              opacity: isActive ? 0.9 : 1,
              color: isActive ? "#fff" : S.onSurfaceVariant,
            }}
          >
            {nstr(campaign.description)}
          </p>
        )}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

function Pill({ children, bg }: { children: ReactNode; bg: string }) {
  return (
    <span
      style={{
        background: bg,
        padding: "3px 10px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}
