"use client";

import { SANCTUARY as S } from "@/lib/design/tokens";

export const CampaignsStatsBar = ({
  total,
  active,
  draft,
  completed,
}: {
  total: number;
  active: number;
  draft: number;
  completed: number;
}) => {
  return (
    <div style={{ display: "flex", gap: 32, padding: "8px 24px 20px", fontSize: 13, color: S.onSurfaceVariant }}>
      <span>
        <strong style={{ color: S.onSurface }}>{total}</strong> total
      </span>
      <span>
        <strong style={{ color: S.onSurface }}>{active}</strong> active
      </span>
      <span>
        <strong style={{ color: S.onSurface }}>{draft}</strong> draft
      </span>
      <span>
        <strong style={{ color: S.onSurface }}>{completed}</strong> completed
      </span>
    </div>
  );
}
