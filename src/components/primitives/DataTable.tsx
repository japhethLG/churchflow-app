"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
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
	className?: string;
};

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
	className,
}: DataTableProps<Row>) => {
	return (
		<div className={cn("rounded-2xl bg-card p-2 overflow-visible", className)}>
			<Table>
				<TableHeader className="border-none">
					<TableRow className="border-none hover:bg-transparent">
						{columns.map((c) => (
							<TableHead
								key={c.key}
								className={cn(
									"h-10 px-6 text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground",
									c.align === "right" && "text-right",
									c.align === "center" && "text-center",
								)}
								style={{ width: c.width }}
							>
								{c.label}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>

				<TableBody>
					{loading
						? Array.from({ length: loadingRows }).map((_, i) => (
								<TableRow key={i} className="border-none">
									{columns.map((c) => (
										<TableCell key={c.key} className="px-6 py-4">
											<Skeleton className="h-4 w-[70%]" />
										</TableCell>
									))}
								</TableRow>
							))
						: (rows ?? []).length > 0
							? (rows ?? []).map((row) => {
									const key = rowKey(row);
									const clickable = Boolean(onRowClick);
									return (
										<TableRow
											key={key}
											onClick={clickable ? () => onRowClick?.(row) : undefined}
											className={cn(
												"border-none transition-colors",
												clickable
													? "cursor-pointer hover:bg-muted/50"
													: "hover:bg-muted/20",
											)}
										>
											{columns.map((c) => (
												<TableCell
													key={c.key}
													className={cn(
														"px-6 py-4 text-sm font-medium text-foreground",
														c.align === "right" && "text-right",
														c.align === "center" && "text-center",
														c.overflow === "visible"
															? "whitespace-normal"
															: "whitespace-nowrap truncate max-w-[200px]",
													)}
												>
													{c.render(row)}
												</TableCell>
											))}
										</TableRow>
									);
								})
							: null}
				</TableBody>
			</Table>

			{!loading && (rows?.length ?? 0) === 0 && (
				<div className="py-20 px-6 text-center">
					<h3 className="text-base font-semibold text-foreground mb-1">
						{emptyTitle}
					</h3>
					{emptySubtitle && (
						<p className="text-sm text-muted-foreground mb-6">
							{emptySubtitle}
						</p>
					)}
					{emptyAction}
				</div>
			)}

			{pagination && pagination.total > pagination.limit && (
				<Pagination {...pagination} />
			)}
		</div>
	);
};

const Pagination = ({
	total,
	offset,
	limit,
	onChange,
}: DataTablePagination) => {
	const page = Math.floor(offset / limit) + 1;
	const pages = Math.max(1, Math.ceil(total / limit));
	const last = Math.min(total, offset + limit);

	const goto = (p: number) => onChange(Math.max(0, (p - 1) * limit));

	const visible: number[] = [];
	for (let p = 1; p <= pages; p++) {
		if (p === 1 || p === pages || Math.abs(p - page) <= 1) {
			visible.push(p);
		}
	}

	return (
		<div className="flex items-center justify-between px-6 py-4 mt-2 border-t border-border/40">
			<span className="text-[13px] font-medium text-muted-foreground">
				Showing <span className="text-foreground">{offset + 1}</span>–
				<span className="text-foreground">{last}</span> of{" "}
				<span className="text-foreground">{total}</span>
			</span>

			<div className="flex items-center gap-2">
				<Button
					variant="secondary"
					size="sm"
					disabled={page <= 1}
					onClick={() => goto(page - 1)}
					className="h-8 w-8 p-0"
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>

				<div className="flex items-center gap-1.5 mx-1">
					{visible.map((p, i) => {
						const prev = visible[i - 1];
						const gap = prev != null && p - prev > 1;
						return (
							<div key={p} className="flex items-center gap-1.5">
								{gap && (
									<span className="text-muted-foreground px-1 text-xs">
										...
									</span>
								)}
								<Button
									variant={p === page ? "primary" : "secondary"}
									size="sm"
									onClick={() => goto(p)}
									className={cn(
										"h-8 min-w-[32px] px-2 text-xs",
										p !== page && "bg-transparent border-none hover:bg-muted",
									)}
								>
									{p}
								</Button>
							</div>
						);
					})}
				</div>

				<Button
					variant="secondary"
					size="sm"
					disabled={page >= pages}
					onClick={() => goto(page + 1)}
					className="h-8 w-8 p-0"
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
};
