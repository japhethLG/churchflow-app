import type { ReactNode } from "react";
import { PageHeader } from "@/components/primitives";

// Placeholder "this page isn't implemented yet" shell. Kept around so
// route scaffolding is visible in the app without pretending the
// features are finished. Each page gets a real implementation later.
export const ScaffoldPage = ({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle?: string;
	children?: ReactNode;
}) => {
	return (
		<div className="max-w-[1100px] py-6">
			<PageHeader title={title} subtitle={subtitle} />
			<div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-[13px] leading-relaxed text-muted-foreground">
				{children ?? (
					<>
						Not built yet — this page is scaffolded so the route and role gating
						are real, but the UI will land later.
					</>
				)}
			</div>
		</div>
	);
};
