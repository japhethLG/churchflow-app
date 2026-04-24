import type { ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";

export type BadgeColor =
  | "neutral" | "indigo" | "green" | "blue" | "amber" | "purple"
  | "teal" | "clay" | "red" | "gray";

const PALETTES: Record<BadgeColor, { bg: string; fg: string }> = {
  neutral: { bg: S.surfaceContainerHigh, fg: S.onSurfaceVariant },
  indigo: { bg: "#E0E7FF", fg: "#3730A3" },
  green: { bg: "#D1FAE5", fg: "#065F46" },
  blue: { bg: "#DBEAFE", fg: "#1E40AF" },
  amber: { bg: "#FEF3C7", fg: "#92400E" },
  purple: { bg: "#EDE9FE", fg: "#5B21B6" },
  teal: { bg: "#CCFBF1", fg: "#115E59" },
  clay: { bg: S.tertiaryContainer, fg: S.tertiary },
  red: { bg: S.errorContainer, fg: S.error },
  gray: { bg: S.surfaceContainer, fg: S.onSurfaceMuted },
};

export function Badge({
  children,
  color = "neutral",
  dot,
}: {
  children: ReactNode;
  color?: BadgeColor;
  dot?: boolean;
}) {
  const p = PALETTES[color];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 9999,
        background: p.bg,
        color: p.fg,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: p.fg,
          }}
        />
      )}
      {children}
    </span>
  );
}

export type TransactionType =
  | "Tithe" | "Offering" | "Mission" | "First Fruit"
  | "Commitment" | "Donation" | "Other";

export function TypeBadge({ type }: { type: TransactionType }) {
  const map: Record<TransactionType, BadgeColor> = {
    Tithe: "indigo",
    Offering: "green",
    Mission: "blue",
    "First Fruit": "amber",
    Commitment: "purple",
    Donation: "teal",
    Other: "neutral",
  };
  return (
    <Badge color={map[type]} dot>
      {type}
    </Badge>
  );
}

export type Status =
  | "Active" | "Upcoming" | "Pending" | "Completed"
  | "Cancelled" | "Inactive" | "Ongoing";

export function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { c: BadgeColor; label: string }> = {
    Active: { c: "green", label: "Active" },
    Upcoming: { c: "green", label: "Upcoming" },
    Pending: { c: "amber", label: "Pending" },
    Completed: { c: "gray", label: "Completed" },
    Cancelled: { c: "red", label: "Cancelled" },
    Inactive: { c: "neutral", label: "Inactive" },
    Ongoing: { c: "blue", label: "Ongoing" },
  };
  const s = map[status];
  return (
    <Badge color={s.c} dot>
      {s.label}
    </Badge>
  );
}
