import type { ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";

export type TableColumn<Row = Record<string, ReactNode>> = {
  key: keyof Row & string;
  label: string;
  width?: string;
  align?: "left" | "right" | "center";
};

export type TableRow = Record<string, ReactNode> & { _hover?: boolean };

export function Table({ columns, rows }: { columns: TableColumn[]; rows: TableRow[] }) {
  const gridTemplate = columns.map((c) => c.width || "1fr").join(" ");
  return (
    <div
      style={{
        background: S.surfaceContainerLowest,
        borderRadius: 16,
        padding: "8px 0",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: gridTemplate,
          padding: "12px 24px",
          gap: 16,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: S.onSurfaceMuted,
        }}
      >
        {columns.map((c, i) => (
          <div key={i} style={{ textAlign: c.align || "left" }}>
            {c.label}
          </div>
        ))}
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: gridTemplate,
            padding: "14px 24px",
            gap: 16,
            alignItems: "center",
            borderRadius: 12,
            margin: "2px 8px",
            background: row._hover ? S.surfaceContainerLow : "transparent",
            fontSize: 14,
            color: S.onSurface,
            minHeight: 40,
          }}
        >
          {columns.map((c, j) => (
            <div key={j} style={{ textAlign: c.align || "left", minWidth: 0 }}>
              {row[c.key]}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
