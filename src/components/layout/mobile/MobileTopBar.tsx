"use client";

import { Avatar } from "@/components/primitives/Avatar";
import { Icon } from "@/components/primitives/Icon";
import { Pressable } from "@/components/primitives/Pressable";
import { cn } from "@/lib/utils";
import type { Perspective } from "../sidebar/types";

const PERSPECTIVE_LABEL: Record<Perspective, string> = {
	admin: "Admin",
	member: "Member",
	super: "Platform",
};

/**
 * Mobile-only top app bar. Mirrors the desktop sidebar identity + top-bar
 * search/notifications, collapsed into a single row. Tapping the church
 * identity opens the account sheet (the mobile analogue of `AccountMenu`).
 */
export const MobileTopBar = ({
	churchName,
	perspective,
	onAccount,
	onSearch,
	onNotify,
	hasUnread = true,
	className,
}: {
	churchName: string;
	perspective: Perspective;
	onAccount: () => void;
	onSearch?: () => void;
	onNotify?: () => void;
	hasUnread?: boolean;
	className?: string;
}) => {
	return (
		<header
			className={cn(
				"flex items-center gap-2 border-b border-border/60 bg-card/85 px-4 pb-2.5 backdrop-blur-md",
				// Clear the status bar / notch in standalone PWA; comfortable top
				// spacing in the browser where the inset is 0.
				"pt-[max(0.875rem,env(safe-area-inset-top))]",
				className,
			)}
		>
			<Pressable
				onClick={onAccount}
				className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl py-1 pr-2"
			>
				<Avatar name={churchName} size={36} />
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-1">
						<span className="truncate text-sm font-bold tracking-tight">
							{churchName}
						</span>
						<Icon
							name="chevronDown"
							size={14}
							className="shrink-0 text-muted-foreground"
						/>
					</div>
					<div className="text-[11px] font-medium text-muted-foreground">
						{PERSPECTIVE_LABEL[perspective]}
					</div>
				</div>
			</Pressable>

			<Pressable
				onClick={onSearch}
				className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-foreground"
			>
				<Icon name="search" size={17} />
			</Pressable>

			<Pressable
				onClick={onNotify}
				className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-foreground"
			>
				<Icon name="bell" size={17} />
				{hasUnread && (
					<span className="absolute right-2 top-2 size-2 rounded-full border-2 border-card bg-tertiary" />
				)}
			</Pressable>
		</header>
	);
};
