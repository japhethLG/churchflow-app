import { Icon } from "@/components/primitives/Icon";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import type { Perspective } from "../types";

export const PlatformMenuItem = ({
	perspective,
	onSelect,
}: {
	perspective: Perspective;
	onSelect: () => void;
}) => (
	<DropdownMenuItem
		className={cn(
			"cursor-pointer gap-2.5 rounded-lg px-2.5 py-[9px] text-sm",
			perspective === "super" && "bg-accent font-semibold",
		)}
		style={{ color: "var(--tertiary)" }}
		onClick={onSelect}
	>
		<Icon
			name="chart"
			size={16}
			className="shrink-0"
			style={{ color: "var(--tertiary)" }}
		/>
		<span className="flex-1">Platform</span>
		{perspective === "super" && (
			<Icon name="check" size={16} style={{ color: "var(--tertiary)" }} />
		)}
	</DropdownMenuItem>
);
