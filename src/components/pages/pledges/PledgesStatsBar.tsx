"use client";

import { SANCTUARY as S } from "@/lib/design/tokens";
import { Amount } from "@/components/primitives";

export function PledgesStatsBar({
  total,
  active,
  fulfilled,
  totalAmount,
}: {
  total: number;
  active: number;
  fulfilled: number;
  totalAmount: number;
}) {
  return (
    <div style={{ display: "flex", gap: 32, padding: "8px 24px 20px", fontSize: 13, color: S.onSurfaceVariant }}>
      <span>
        <strong style={{ color: S.onSurface }}>{total}</strong> pledges
      </span>
      <span>
        <strong style={{ color: S.onSurface }}>{active}</strong> active
      </span>
      <span>
        <strong style={{ color: S.onSurface }}>{fulfilled}</strong> fulfilled
      </span>
      <span>
        <strong style={{ color: S.onSurface }}>
          <Amount value={totalAmount.toString()} />
        </strong>{" "}
        committed
      </span>
    </div>
  );
}
