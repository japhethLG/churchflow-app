"use client";

import type { CSSProperties, ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Button } from "./Button";

export type DataTableColumn<Row> = {
  key: string;
  label: ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
  render: (row: Row) => ReactNode;
  overflow?: "visible" | "hidden" | "scroll" | "auto";
};

export type DataTablePagination = {
  total: number;
  offset: number;
  limit: number;
  onChange: (offset: number) => void;
};

export type DataTableProps<Row> = {
  columns: DataTableColumn<Row>[];
  rows: Row[] | undefined;
  rowKey: (row: Row) => string;
  loading?: boolean;
  loadingRows?: number;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: ReactNode;
  onRowClick?: (row: Row) => void;
  pagination?: DataTablePagination;
};

const cellBase: CSSProperties = { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" };

export const DataTable = <Row,>({
  columns,
  rows,
  rowKey,
  loading,
  loadingRows = 5,
  emptyTitle = "Nothing to show",
  emptySubtitle,
  emptyAction,
  onRowClick,
  pagination,
}: DataTableProps<Row>) => {
  const gridTemplate = columns.map((c) => c.width || "1fr").join(" ");

  return (
    <div style={{ background: S.surfaceContainerLowest, borderRadius: 16, padding: "8px 0", overflow: "visible" }}>
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
        {columns.map((c) => (
          <div key={c.key} style={{ textAlign: c.align ?? "left" }}>
            {c.label}
          </div>
        ))}
      </div>

      {loading
        ? Array.from({ length: loadingRows }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: gridTemplate,
                padding: "14px 24px",
                gap: 16,
                alignItems: "center",
                margin: "2px 8px",
                minHeight: 40,
              }}
            >
              {columns.map((c) => (
                <div key={c.key} style={{ textAlign: c.align ?? "left" }}>
                  <div style={{ height: 16, background: S.surfaceContainer, borderRadius: 6, width: "70%" }} />
                </div>
              ))}
            </div>
          ))
        : (rows ?? []).map((row) => {
            const key = rowKey(row);
            const clickable = Boolean(onRowClick);
            return (
              <div
                key={key}
                onClick={clickable ? () => onRowClick?.(row) : undefined}
                style={{
                  display: "grid",
                  gridTemplateColumns: gridTemplate,
                  padding: "14px 24px",
                  gap: 16,
                  alignItems: "center",
                  borderRadius: 12,
                  margin: "2px 8px",
                  fontSize: 14,
                  color: S.onSurface,
                  minHeight: 40,
                  cursor: clickable ? "pointer" : "default",
                  transition: "background 80ms",
                }}
                onMouseEnter={(e) => {
                  if (clickable) (e.currentTarget as HTMLDivElement).style.background = S.surfaceContainerLow;
                }}
                onMouseLeave={(e) => {
                  if (clickable) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                {columns.map((c) => (
                  <div
                    key={c.key}
                    style={{
                      textAlign: c.align ?? "left",
                      ...cellBase,
                      overflow: c.overflow ?? "hidden",
                      textOverflow: c.overflow === "visible" ? "clip" : "ellipsis",
                      whiteSpace: c.overflow === "visible" ? "normal" : "nowrap",
                    }}
                  >
                    {c.render(row)}
                  </div>
                ))}
              </div>
            );
          })}

      {!loading && (rows?.length ?? 0) === 0 && (
        <div style={{ padding: "60px 24px", textAlign: "center", color: S.onSurfaceMuted }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: S.onSurface, marginBottom: 4 }}>{emptyTitle}</div>
          {emptySubtitle && <div style={{ fontSize: 13, marginBottom: 16 }}>{emptySubtitle}</div>}
          {emptyAction}
        </div>
      )}

      {pagination && pagination.total > pagination.limit && <Pagination {...pagination} />}
    </div>
  );
}

const Pagination = ({ total, offset, limit, onChange }: DataTablePagination) => {
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));
  const last = Math.min(total, offset + limit);

  const goto = (p: number) => onChange(Math.max(0, (p - 1) * limit));

  const visible: number[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) visible.push(p);
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        fontSize: 13,
        color: S.onSurfaceMuted,
      }}
    >
      <span>
        Showing {offset + 1}–{last} of {total}
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => goto(page - 1)}>
          ←
        </Button>
        {visible.map((p, i) => {
          const prev = visible[i - 1];
          const gap = prev != null && p - prev > 1;
          return (
            <span key={p} style={{ display: "inline-flex", gap: 6 }}>
              {gap && (
                <Button variant="secondary" size="sm" disabled>
                  …
                </Button>
              )}
              <Button variant={p === page ? "primary" : "secondary"} size="sm" onClick={() => goto(p)}>
                {p}
              </Button>
            </span>
          );
        })}
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => goto(page + 1)}>
          →
        </Button>
      </div>
    </div>
  );
}
