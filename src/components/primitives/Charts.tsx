import { cn } from "@/lib/utils";

export type BarDatum = { label: string; v: number; label2?: string; highlight?: boolean };

export const BarChart = ({
  data,
  height = 220,
  gradient,
  className,
}: {
  data: BarDatum[];
  height?: number;
  gradient?: boolean;
  className?: string;
}) => {
  const max = Math.max(...data.map((d) => d.v));
  return (
    <div
      className={cn("flex items-end gap-2.5 pt-5", className)}
      style={{ height }}
    >
      {data.map((d, i) => {
        const h = (d.v / max) * (height - 40);
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-2 min-w-0"
          >
            <div className="text-[10px] text-muted-foreground tabular-nums">
              {d.label2 || ""}
            </div>
            <div
              className={cn(
                "w-full rounded-md transition-all duration-300",
                d.highlight
                  ? "bg-linear-to-t from-primary to-ring shadow-sm"
                  : gradient
                    ? "bg-linear-to-t from-primary/40 to-ring/50"
                    : "bg-input"
              )}
              style={{ height: h }}
            />
            <div className="text-[11px] text-muted-foreground font-medium truncate w-full text-center">
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type DonutDatum = { v: number; color: string };

export const Donut = ({
  data,
  size = 200,
  total,
  className,
}: {
  data: DonutDatum[];
  size?: number;
  total: string;
  className?: string;
}) => {
  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;
  const sum = data.reduce((a, d) => a + d.v, 0);
  let offset = 0;
  
  return (
    <div className={cn("relative inline-block", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {data.map((d, i) => {
          const frac = d.v / sum;
          const dash = frac * circumference;
          const rot = (offset / circumference) * 360;
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
              className="transition-all duration-500 ease-in-out"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
        <div>
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">
            Total
          </div>
          <div className="text-2xl font-bold tracking-tight tabular-nums mt-1 text-foreground">
            {total}
          </div>
        </div>
      </div>
    </div>
  );
}
