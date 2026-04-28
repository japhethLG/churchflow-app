import type { ReactNode } from "react";
import {
  Table as ShadedTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type TableColumn<Row = Record<string, ReactNode>> = {
  key: keyof Row & string;
  label: string;
  width?: string;
  align?: "left" | "right" | "center";
};

export type TableRow = Record<string, ReactNode> & { _hover?: boolean };

export const Table = ({ columns, rows, className }: { columns: TableColumn[]; rows: TableRow[]; className?: string }) => {
  return (
    <div className={cn("rounded-2xl bg-card p-2 overflow-hidden", className)}>
      <ShadedTable>
        <TableHeader className="border-none">
          <TableRow className="border-none hover:bg-transparent">
            {columns.map((c, i) => (
              <TableHead
                key={i}
                className={cn(
                  "h-10 px-6 text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground",
                  c.align === "right" && "text-right",
                  c.align === "center" && "text-center"
                )}
                style={{ width: c.width }}
              >
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow
              key={i}
              className={cn(
                "border-none transition-colors",
                row._hover ? "bg-muted/50" : "hover:bg-muted/30"
              )}
            >
              {columns.map((c, j) => (
                <TableCell
                  key={j}
                  className={cn(
                    "px-6 py-3.5 text-sm font-medium text-foreground",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center"
                  )}
                >
                  {row[c.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </ShadedTable>
    </div>
  );
}
