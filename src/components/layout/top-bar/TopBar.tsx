import { Icon } from "@/components/primitives/Icon";
import { cn } from "@/lib/utils";

import { DynamicBreadcrumbs } from "./DynamicBreadcrumbs";

export const TopBar = () => {
	return (
		<div className="flex h-[72px] items-center gap-4 bg-transparent px-8">
			<div className="flex items-center">
				<DynamicBreadcrumbs />
			</div>
			<div className="flex-1" />
			<div
				className={cn(
					"flex w-[280px] items-center gap-2.5 rounded-full bg-muted py-2 px-4",
					"border border-border/60",
				)}
			>
				<Icon name="search" size={15} className="text-muted-foreground" />
				<span className="text-sm text-muted-foreground">
					Search members, events…
				</span>
				<span className="ml-auto rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
					⌘K
				</span>
			</div>
			<div className="relative grid size-10 shrink-0 place-items-center rounded-full bg-card">
				<Icon name="bell" size={18} className="text-secondary-foreground" />
				<span className="absolute right-2 top-2 size-2 rounded-full border-2 border-card bg-tertiary" />
			</div>
		</div>
	);
};
