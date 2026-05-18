import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PageHeaderBack = {
	href: string;
	label: string;
};

export const PageHeader = ({
	back,
	overline: _overline,
	title,
	subtitle,
	action,
	className,
}: {
	/** Back-to-parent link, rendered above the title in breadcrumb style. */
	back?: PageHeaderBack;
	/** Deprecated. Kept for backward compat with list / dashboard pages — not rendered. Detail pages should use `back`. */
	overline?: string;
	title: ReactNode;
	subtitle?: ReactNode;
	action?: ReactNode;
	className?: string;
}) => {
	return (
		<div className={cn("flex items-end justify-between mb-8 gap-6", className)}>
			<div className="flex-1 min-w-0">
				{back && (
					<Link
						href={back.href}
						className="mb-2.5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
					>
						<span aria-hidden>←</span>
						{back.label}
					</Link>
				)}
				<h1 className="text-4xl font-bold tracking-tight text-foreground leading-[1.1] m-0">
					{title}
				</h1>
				{subtitle && (
					<div className="text-sm font-medium text-muted-foreground mt-2.5 max-w-[640px] leading-relaxed">
						{subtitle}
					</div>
				)}
			</div>
			{action && (
				<div className="flex items-center gap-2.5 shrink-0">{action}</div>
			)}
		</div>
	);
};

export const SectionTitle = ({
	title,
	action,
	className,
}: {
	title: ReactNode;
	action?: ReactNode;
	className?: string;
}) => {
	return (
		<div className={cn("flex items-center justify-between mb-4", className)}>
			<h3 className="text-lg font-bold tracking-tight text-foreground m-0">
				{title}
			</h3>
			{action}
		</div>
	);
};
