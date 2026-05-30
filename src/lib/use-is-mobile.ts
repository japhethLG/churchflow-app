"use client";

import { useEffect, useState } from "react";

// Mirrors Tailwind's `md` breakpoint (48rem / 768px): "mobile" is anything
// narrower than `md`, matching where our responsive page recipes switch to the
// mobile card / bottom-nav chrome.
const MOBILE_QUERY = "(max-width: 767px)";

/**
 * Reactive viewport check for the sub-`md` (mobile) range. SSR-safe: starts
 * `false` on the server and during hydration, then resolves to the real value
 * on mount and tracks subsequent resizes. Prefer CSS (`md:` variants) for pure
 * styling — reach for this only when behaviour, not just layout, must differ.
 */
export const useIsMobile = (): boolean => {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}
		const mq = window.matchMedia(MOBILE_QUERY);
		const update = () => setIsMobile(mq.matches);
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);

	return isMobile;
};
