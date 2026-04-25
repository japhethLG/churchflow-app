import type { ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Card } from "./Card";
import { Badge } from "./Badge";

export const StatCard = ({
  label,
  value,
  caption,
  delta,
  deltaDirection,
  accent,
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  delta?: string;
  deltaDirection?: "up" | "down" | "flat";
  accent?: boolean;
}) => {
  return (
    <Card padding={24}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: S.onSurfaceMuted,
          }}
        >
          {label}
        </div>
        {delta && (
          <Badge color={deltaDirection === "up" ? "green" : deltaDirection === "down" ? "red" : "neutral"}>
            {deltaDirection === "up" ? "▲" : deltaDirection === "down" ? "▼" : ""} {delta}
          </Badge>
        )}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: S.onSurface,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          background: accent ? `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})` : undefined,
          WebkitBackgroundClip: accent ? "text" : undefined,
          WebkitTextFillColor: accent ? "transparent" : undefined,
        }}
      >
        {value}
      </div>
      {caption && (
        <div style={{ fontSize: 13, color: S.onSurfaceMuted, marginTop: 10 }}>{caption}</div>
      )}
    </Card>
  );
}
