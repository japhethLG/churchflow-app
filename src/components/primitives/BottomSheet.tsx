"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

export type BottomSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: ReactNode;
	description?: ReactNode;
	/** When set, a back chevron renders left of the title (in-sheet drill-down). */
	onBack?: () => void;
	/** Optional element rendered in the header, left of the close button. */
	headerAction?: ReactNode;
	children: ReactNode;
	/** Extra classes for the scrollable body. */
	contentClassName?: string;
	className?: string;
};

/**
 * Mobile bottom sheet — slides up from the bottom edge, with a drag handle,
 * scrim, and safe-area-aware padding. Built on the same `@base-ui/react`
 * Dialog the rest of the app uses, so focus-trapping, ESC and scrim dismiss
 * come for free. Use for mobile nav overflow, account, and action surfaces.
 */
export const BottomSheet = ({
	open,
	onOpenChange,
	title,
	description,
	onBack,
	headerAction,
	children,
	contentClassName,
	className,
}: BottomSheetProps) => {
	return (
		<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Backdrop
					className={cn(
						"fixed inset-0 z-50 bg-black/50 duration-200 supports-backdrop-filter:backdrop-blur-xs",
						"data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
					)}
				/>
				<DialogPrimitive.Popup
					className={cn(
						"fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[60vh] w-full max-w-[480px] flex-col",
						"rounded-t-3xl bg-card text-foreground shadow-2xl outline-none",
						"duration-300 data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom",
						className,
					)}
				>
					<div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-foreground/15" />

					{(title || headerAction) && (
						<header className="flex items-start justify-between gap-3 px-4 pb-2 pt-2.5">
							{onBack && (
								<button
									type="button"
									onClick={onBack}
									aria-label="Back"
									className="-ml-1 grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<Icon name="chevronLeft" size={20} />
								</button>
							)}
							<div className="min-w-0 flex-1">
								{title && (
									<DialogPrimitive.Title className="truncate text-xl font-bold tracking-tight">
										{title}
									</DialogPrimitive.Title>
								)}
								{description && (
									<DialogPrimitive.Description className="mt-0.5 text-xs text-muted-foreground">
										{description}
									</DialogPrimitive.Description>
								)}
							</div>
							<div className="flex shrink-0 items-center gap-2">
								{headerAction}
								<DialogPrimitive.Close className="grid size-8 cursor-pointer place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground">
									<Icon name="x" size={16} />
								</DialogPrimitive.Close>
							</div>
						</header>
					)}

					<div
						className={cn(
							"min-h-0 flex-1 overflow-auto px-4 pt-1 pb-[max(1rem,env(safe-area-inset-bottom))]",
							contentClassName,
						)}
					>
						{children}
					</div>
				</DialogPrimitive.Popup>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
};
