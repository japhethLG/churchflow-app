"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type RowAction = {
	label: string;
	onClick: () => void;
	destructive?: boolean;
	separatorBefore?: boolean;
};

export const RowActionsMenu = ({
	actions,
	label = "Row actions",
}: {
	actions: RowAction[];
	label?: string;
}) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
						onClick={(e) => e.stopPropagation()}
					>
						<span className="sr-only">{label}</span>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				}
			/>
			<DropdownMenuContent
				align="end"
				className="w-[180px] p-1.5"
				onClick={(e) => e.stopPropagation()}
			>
				{actions.map((a, i) => (
					<div key={i}>
						{a.separatorBefore && <DropdownMenuSeparator className="my-1" />}
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								a.onClick();
							}}
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
