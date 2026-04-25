"use client";

import { SANCTUARY as S } from "@/lib/design/tokens";
import { Icon } from "@/components/primitives/Icon";

type StatsProps = {
  total: number;
  pending: number;
  accepted: number;
  cancelled: number;
};

export function InvitationsStatsBar({ total, pending, accepted, cancelled }: StatsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "0 24px 24px",
        overflowX: "auto",
      }}
    >
      <StatCard
        label="Total sent"
        value={total}
        icon="mail"
        color={S.primary}
      />
      <StatCard
        label="Pending"
        value={pending}
        icon="clock"
        color={S.warning}
      />
      <StatCard
        label="Accepted"
        value={accepted}
        icon="check"
        color={S.success}
      />
      <StatCard
        label="Expired/Cancelled"
        value={cancelled}
        icon="close"
        color={S.error}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 160,
        background: S.surfaceContainerLowest,
        borderRadius: 16,
        padding: "16px 20px",
        border: `1px solid ${S.surfaceContainer}`,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: `${color}14`,
          display: "grid",
          placeItems: "center",
          color: color,
        }}
      >
        <Icon name={icon} size={20} />
      </div>
      <div>
        <div style={{ fontSize: 13, color: S.onSurfaceVariant, fontWeight: 500 }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: S.onSurface,
            marginTop: 2,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
