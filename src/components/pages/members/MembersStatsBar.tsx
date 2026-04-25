"use client";

import { SANCTUARY as S } from "@/lib/design/tokens";

export function MembersStatsBar({
  total,
  active,
  unregistered,
}: {
  total: number;
  active: number;
  unregistered: number;
}) {
  return (
    <div style={{ display: "flex", gap: 32, padding: "8px 24px 20px", fontSize: 13, color: S.onSurfaceVariant }}>
      <span>
        <strong style={{ color: S.onSurface }}>{total}</strong> total
      </span>
      <span>
        <strong style={{ color: S.onSurface }}>{active}</strong> active
      </span>
      <span>
        <strong style={{ color: S.onSurface }}>{unregistered}</strong> unregistered (temp)
      </span>
    </div>
  );
}
