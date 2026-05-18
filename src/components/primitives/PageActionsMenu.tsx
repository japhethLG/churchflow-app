"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import type { RowAction } from "./RowActionsMenu";

// Overflow menu for the action slot of a `PageHeader`. Same shape as
// `RowActionsMenu` (reuses `RowAction`), but the trigger is a normal-sized
// secondary `Button` so it sits next to other page-level buttons cleanly.
//
// Use it to collapse rare or destructive actions (Delete, Cancel, Merge,
// Invite) behind a "More" kebab while keeping one or two primary actions
// visible. Returns null when `actions` is empty.
export const PageActionsMenu = ({
	actions,
	label = "More actions",
}: {
	actions: RowAction[];
	label?: string;
}) => {
	if (actions.length === 0) {
		return null;
	}
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="secondary" icon="moreHorizontal" aria-label={label}>
						More
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="w-[200px] p-1.5">
				{actions.map((a, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: stable order from caller
					<div key={i}>
						{a.separatorBefore && <DropdownMenuSeparator className="my-1" />}
						<DropdownMenuItem
							onClick={a.onClick}
							className={cn(
								"cursor-pointer rounded-lg px-3 py-2 text-sm",
								a.destructive &&
									"text-destructive focus:bg-destructive/10 focus:text-destructive",
							)}
						>
							{a.label}
						</DropdownMenuItem>
					</div>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
