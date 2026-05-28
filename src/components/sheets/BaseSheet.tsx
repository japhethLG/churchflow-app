"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
	type CSSProperties,
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { Icon } from "@/components/primitives/Icon";
import { Pressable } from "@/components/primitives/Pressable";
import { cn } from "@/lib/utils";

export type BaseSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Fired after the open/close animation settles — safe place to reset state. */
	onOpenChangeComplete?: (open: boolean) => void;
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
	/**
	 * Snap heights as viewport fractions, ordered smallest → largest. The
	 * drag handle resizes between them. Default `[0.5, 0.78, 0.94]`.
	 */
	snapPoints?: number[];
	/** Index into snapPoints to open at. Defaults to `0` (smallest). */
	initialSnap?: number;
	/**
	 * Sticky footer rendered below the scrollable body, with safe-area
	 * inset padding. When provided, the body's own bottom inset is dropped
	 * so the footer owns it.
	 */
	footer?: ReactNode;
	/** Extra classes for the footer wrapper. */
	footerClassName?: string;
};

const DEFAULT_SNAPS = [0.5, 0.78, 0.94];
// iOS-style ease-out — very close to UIKit's default spring on settle.
const SNAP_TRANSITION = "height 380ms cubic-bezier(0.22, 1, 0.36, 1)";
// px/ms. Above this, a flick wins over position.
const FLICK_VELOCITY = 0.55;
// How many recent samples to average for velocity. More samples = smoother
// but laggier signal; fewer = jumpier but more responsive.
const VELOCITY_SAMPLE_COUNT = 5;

type DragState = {
	pointerId: number;
	startY: number;
	startSnap: number;
	startVh: number;
	samples: Array<{ y: number; t: number }>;
};

/**
 * Mobile bottom sheet — the sheet-system analogue of `BaseModal`. Slides up
 * from the bottom with a drag handle (resize via vertical drag) and a
 * scrim, on top of `@base-ui/react`'s Dialog so focus-trapping, ESC and
 * scrim dismiss come for free.
 *
 * Drag physics:
 * - Pointer moves write the height directly to the DOM (no React re-render
 *   per frame) so the sheet tracks the finger at 60fps.
 * - Beyond the max snap, the height is dampened with a 0.25× factor —
 *   you can pull past it but it resists, like iOS.
 * - On release, snap target is chosen by velocity first (a flick goes one
 *   step in that direction; a hard downward flick from the smallest snap
 *   dismisses) and falls back to nearest-position otherwise.
 */
export const BaseSheet = ({
	open,
	onOpenChange,
	onOpenChangeComplete,
	title,
	description,
	onBack,
	headerAction,
	children,
	contentClassName,
	className,
	snapPoints = DEFAULT_SNAPS,
	initialSnap = 0,
	footer,
	footerClassName,
}: BaseSheetProps) => {
	const popupRef = useRef<HTMLDivElement | null>(null);
	const clampedInitial = Math.min(
		Math.max(0, initialSnap),
		snapPoints.length - 1,
	);
	const [snap, setSnap] = useState(clampedInitial);
	const dragRef = useRef<DragState | null>(null);

	useEffect(() => {
		if (open) {
			setSnap(clampedInitial);
		}
	}, [open, clampedInitial]);

	const heightForSnap = useCallback(
		(s: number): string => `${snapPoints[s] * 100}vh`,
		[snapPoints],
	);

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.pointerType === "mouse" && e.button !== 0) {
			return;
		}
		const popup = popupRef.current;
		if (!popup) {
			return;
		}
		e.currentTarget.setPointerCapture(e.pointerId);
		const vh = window.innerHeight;
		dragRef.current = {
			pointerId: e.pointerId,
			startY: e.clientY,
			startSnap: snap,
			startVh: vh,
			samples: [{ y: e.clientY, t: performance.now() }],
		};
		// 1:1 finger tracking — disable the snap transition during drag.
		popup.style.transition = "none";
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		const popup = popupRef.current;
		if (!drag || !popup) {
			return;
		}

		const dy = e.clientY - drag.startY;
		const vh = drag.startVh;
		const baseHeight = snapPoints[drag.startSnap] * vh;
		const maxHeight = snapPoints[snapPoints.length - 1] * vh;

		let next = baseHeight - dy;
		// Log-style dampening past the top snap so the user feels a wall.
		if (next > maxHeight) {
			next = maxHeight + (next - maxHeight) * 0.25;
		}
		// Track the finger all the way down — let dismiss math at release
		// decide what to do.
		next = Math.max(0, next);

		popup.style.height = `${next}px`;

		drag.samples.push({ y: e.clientY, t: performance.now() });
		if (drag.samples.length > VELOCITY_SAMPLE_COUNT) {
			drag.samples.shift();
		}
	};

	const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		if (!drag) {
			return;
		}
		try {
			e.currentTarget.releasePointerCapture(drag.pointerId);
		} catch {
			// pointer was already released
		}
		const popup = popupRef.current;
		if (!popup) {
			dragRef.current = null;
			return;
		}

		const vh = drag.startVh;
		const baseHeight = snapPoints[drag.startSnap] * vh;
		const dy = e.clientY - drag.startY;
		const finalHeight = Math.max(0, baseHeight - dy);

		// Velocity from the last two samples (px/ms, +ve = moving down).
		let velocity = 0;
		const samples = drag.samples;
		if (samples.length >= 2) {
			const last = samples[samples.length - 1];
			const prev = samples[samples.length - 2];
			const dt = last.t - prev.t;
			if (dt > 0) {
				velocity = (last.y - prev.y) / dt;
			}
		}

		let target: number | "close";
		const minPx = snapPoints[0] * vh;
		const dismissAt = minPx * 0.55;

		if (velocity > FLICK_VELOCITY && drag.startSnap === 0 && dy > 16) {
			// Fast flick down from smallest snap → dismiss.
			target = "close";
		} else if (finalHeight < dismissAt) {
			// Dragged down past the dismiss threshold.
			target = "close";
		} else if (velocity > FLICK_VELOCITY) {
			// Fast down → one snap smaller.
			target = Math.max(0, drag.startSnap - 1);
		} else if (velocity < -FLICK_VELOCITY) {
			// Fast up → one snap larger.
			target = Math.min(snapPoints.length - 1, drag.startSnap + 1);
		} else {
			// Slow release — snap to nearest by current position.
			let nearest = 0;
			let bestDist = Infinity;
			for (let i = 0; i < snapPoints.length; i++) {
				const d = Math.abs(snapPoints[i] * vh - finalHeight);
				if (d < bestDist) {
					bestDist = d;
					nearest = i;
				}
			}
			target = nearest;
		}

		if (target === "close") {
			// Let base-ui's slide-out + scrim fade handle the exit; don't fight
			// it with a height transition.
			onOpenChange(false);
		} else {
			popup.style.transition = SNAP_TRANSITION;
			popup.style.height = heightForSnap(target);
			setSnap(target);
		}

		dragRef.current = null;
	};

	const popupStyle: CSSProperties = {
		height: heightForSnap(snap),
	};

	return (
		<DialogPrimitive.Root
			open={open}
			onOpenChange={onOpenChange}
			onOpenChangeComplete={onOpenChangeComplete}
		>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Backdrop
					className={cn(
						// No backdrop-filter blur: toggling a viewport-wide filter off
						// forces a full-screen repaint that flickers on close. Match the
						// popup's duration so the dim and the sheet leave together.
						"fixed inset-0 z-50 bg-black/50 duration-300",
						"data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
					)}
				/>
				<DialogPrimitive.Popup
					ref={popupRef}
					style={popupStyle}
					className={cn(
						"fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[480px] flex-col",
						"rounded-t-3xl bg-card text-foreground shadow-2xl outline-none",
						// transform-gpu + iOS-style decelerating curve for the open/close
						// slide. The default `ease` feels rough here.
						"transform-gpu duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
						"data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom",
						className,
					)}
				>
					{/* Drag handle — pointer-only resize control. The sheet stays
					    keyboard/screen-reader operable via ESC and the close button. */}
					<div
						onPointerDown={handlePointerDown}
						onPointerMove={handlePointerMove}
						onPointerUp={finishDrag}
						onPointerCancel={finishDrag}
						className="grid shrink-0 cursor-grab touch-none place-items-center pt-2 pb-1 active:cursor-grabbing"
					>
						<span className="h-1 w-9 rounded-full bg-foreground/20" />
					</div>

					{(title || headerAction) && (
						<header className="flex items-start justify-between gap-3 px-4 pb-2 pt-1">
							{onBack && (
								<Pressable
									onClick={onBack}
									className="-ml-1 grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<Icon name="chevronLeft" size={20} />
									<span className="sr-only">Back</span>
								</Pressable>
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
							"min-h-0 flex-1 overflow-auto px-4 pt-1",
							// Footer owns the safe-area inset when present.
							footer ? "pb-3" : "pb-[max(1rem,env(safe-area-inset-bottom))]",
							contentClassName,
						)}
					>
						{children}
					</div>

					{footer && (
						<div
							className={cn(
								"shrink-0 border-t border-border bg-card px-4 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))]",
								footerClassName,
							)}
						>
							{footer}
						</div>
					)}
				</DialogPrimitive.Popup>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
};
