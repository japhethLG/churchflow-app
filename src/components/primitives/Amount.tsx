import { SANCTUARY as S } from "@/lib/design/tokens";

export function Amount({
  value,
  size = "row",
  currency = "$",
  gradient,
}: {
  value: string;
  size?: "label" | "row" | "display";
  currency?: string;
  gradient?: boolean;
}) {
  const sizes = { label: 13, row: 14, display: 48 } as const;
  return (
    <span
      style={{
        fontSize: sizes[size],
        fontWeight: size === "display" ? 600 : 500,
        letterSpacing: size === "display" ? "-0.03em" : "-0.005em",
        fontVariantNumeric: "tabular-nums",
        color: gradient ? undefined : S.onSurface,
        background: gradient ? `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})` : undefined,
        WebkitBackgroundClip: gradient ? "text" : undefined,
        WebkitTextFillColor: gradient ? "transparent" : undefined,
      }}
    >
      <span style={{ opacity: 0.6, marginRight: 2 }}>{currency}</span>
      {value}
    </span>
  );
}
