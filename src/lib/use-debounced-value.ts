"use client";

import { useEffect, useState } from "react";

// Returns `value` after it has been stable for `delayMs`. Used by the
// search input inside `DataTableShell` so list pages can call their data
// hook with the debounced string without each page wiring its own timer.
export const useDebouncedValue = <T>(value: T, delayMs = 250): T => {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), delayMs);
		return () => clearTimeout(id);
	}, [value, delayMs]);

	return debounced;
};
