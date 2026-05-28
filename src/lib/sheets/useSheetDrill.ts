"use client";

import { useEffect, useRef, useState } from "react";

// Matches BaseSheet's close animation duration. Reset after the sheet has
// settled so the drilled-in content doesn't swap back to "main" mid-exit
// (which is what causes the flash).
const RESET_DELAY_MS = 320;

export type SheetDrill<V extends string> = {
	view: V;
	drillTo: (next: V) => void;
	drillBack: (to?: V) => void;
	/** True when the current view differs from the initial. */
	isDrilled: boolean;
	/** Apply to a wrapper that re-mounts (via `key={view}`) when the view changes. */
	transitionClass: string;
};

/**
 * In-sheet drill-down state with directional slide animation.
 *
 * Watches `open`: when the sheet finishes closing, resets to the initial
 * view after the exit animation settles. Sheet authors don't need to wire
 * `onOpenChangeComplete` for this — pass `open` and the hook handles the
 * rest.
 */
export const useSheetDrill = <V extends string>(
	initial: V,
	open: boolean,
): SheetDrill<V> => {
	const [view, setView] = useState<V>(initial);
	const [dir, setDir] = useState<"forward" | "back" | null>(null);
	const wasOpenRef = useRef(open);

	useEffect(() => {
		if (!open && wasOpenRef.current) {
			const t = setTimeout(() => {
				setView(initial);
				setDir(null);
			}, RESET_DELAY_MS);
			wasOpenRef.current = open;
			return () => clearTimeout(t);
		}
		wasOpenRef.current = open;
	}, [open, initial]);

	const drillTo = (next: V) => {
		setDir("forward");
		setView(next);
	};

	const drillBack = (to?: V) => {
		setDir("back");
		setView(to ?? initial);
	};

	const transitionClass =
		dir === "forward"
			? "animate-in fade-in-0 slide-in-from-right-8 duration-300 ease-out"
			: dir === "back"
				? "animate-in fade-in-0 slide-in-from-left-8 duration-300 ease-out"
				: "";

	return {
		view,
		drillTo,
		drillBack,
		isDrilled: view !== initial,
		transitionClass,
	};
};
