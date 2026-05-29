"use client";

import { useEffect, useRef } from "react";
import { create } from "zustand";
import type { IconName } from "@/components/primitives/Icon";

// A page's primary action, surfaced on mobile as a floating action button.
export type MobileAction = {
	/** Short verb label, e.g. "Add member". Shown in the speed-dial fan-out. */
	label: string;
	icon: IconName;
	onClick: () => void;
};

type MobileActionsStore = {
	actions: MobileAction[];
	set: (actions: MobileAction[]) => void;
	clear: () => void;
};

// Bridges page composites (deep in the tree) to the mobile chrome's FAB. The
// chrome subscribes; pages publish via `useMobileActions`. Desktop ignores it.
export const useMobileActionsStore = create<MobileActionsStore>((set) => ({
	actions: [],
	set: (actions) => set({ actions }),
	clear: () => set({ actions: [] }),
}));

/**
 * Register a page's primary actions with the mobile chrome. The bottom-right
 * FAB renders them — a single action becomes a one-tap button, multiple
 * actions fan out as a speed dial. Pages keep their `PageHeader` buttons for
 * `md` and up; this is purely the sub-`md` affordance.
 *
 * Re-registers whenever the visible set (icons + labels) changes; `onClick`
 * handlers are snapshotted at that point, so keep them capturing stable values
 * (tenantSlug, router) — which page handlers already do. Cleared on unmount,
 * so navigating to a page that registers nothing clears the FAB.
 */
export function useMobileActions(actions: MobileAction[]): void {
	const set = useMobileActionsStore((s) => s.set);
	const clear = useMobileActionsStore((s) => s.clear);
	const latest = useRef(actions);
	latest.current = actions;
	const sig = actions.map((a) => `${a.icon}:${a.label}`).join("|");
	// biome-ignore lint/correctness/useExhaustiveDependencies: re-register on the visible set only; onClick read fresh from ref
	useEffect(() => {
		set(latest.current);
		return () => clear();
	}, [sig, set, clear]);
}
