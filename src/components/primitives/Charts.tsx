import { SANCTUARY as S } from "@/lib/design/tokens";

export type BarDatum = { label: string; v: number; label2?: string; highlight?: boolean };

export function BarChart({
  data,
  height = 220,
  gradient,
}: {
  data: BarDatum[];
  height?: number;
  gradient?: boolean;
}) {
  const max = Math.max(...data.map((d) => d.v));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 10,
        height,
        paddingTop: 20,
      }}
    >
      {data.map((d, i) => {
        const h = (d.v / max) * (height - 40);
        return (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: S.onSurfaceMuted,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {d.label2 || ""}
            </div>
            <div
              style={{
                width: "100%",
                height: h,
                borderRadius: 6,
                background: d.highlight
                  ? `linear-gradient(180deg, ${S.primaryContainer}, ${S.primary})`
                  : gradient
                    ? `linear-gradient(180deg, ${S.primaryContainer}88, ${S.primary}66)`
                    : S.surfaceContainerHigh,
              }}
            />
            <div style={{ fontSize: 11, color: S.onSurfaceMuted, fontWeight: 500 }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export type DonutDatum = { v: number; color: string };

export function Donut({
  data,
  size = 200,
  total,
}: {
  data: DonutDatum[];
  size?: number;
  total: string;
}) {
  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;
  const sum = data.reduce((a, d) => a + d.v, 0);
  let offset = 0;
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d, i) => {
          const frac = d.v / sum;
          const dash = frac * circumference;
          const rot = (offset / circumference) * 360 - 90;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={28}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={0}
              transform={`rotate(${rot} ${size / 2} ${size / 2})`}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: S.onSurfaceMuted,
            }}
          >
            Total
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
              marginTop: 4,
            }}
          >
            {total}
          </div>
        </div>
      </div>
    </div>
  );
}
