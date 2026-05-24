"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
	theme: "system",
	setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "theme",
	...props
}: {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
}) {
	const [theme, setThemeState] = useState<Theme>(defaultTheme);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const storedTheme = localStorage.getItem(storageKey) as Theme;
		if (storedTheme) {
			setThemeState(storedTheme);
		}
		setMounted(true);
	}, [storageKey]);

	useEffect(() => {
		if (!mounted) {
			return;
		}

		const root = window.document.documentElement;

		const applyTheme = (t: Theme) => {
			root.classList.remove("light", "dark");
			root.removeAttribute("data-theme");

			if (t === "system") {
				const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
					.matches
					? "dark"
					: "light";

				root.classList.add(systemTheme);
				root.setAttribute("data-theme", systemTheme);
				return;
			}

			root.classList.add(t);
			root.setAttribute("data-theme", t);
		};

		applyTheme(theme);

		if (theme === "system") {
			const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
			const handleChange = () => {
				applyTheme("system");
			};
			mediaQuery.addEventListener("change", handleChange);
			return () => mediaQuery.removeEventListener("change", handleChange);
		}
	}, [theme, mounted]);

	const setTheme = (t: Theme) => {
		localStorage.setItem(storageKey, t);
		try {
			// biome-ignore lint: document.cookie is used for maximum browser compatibility
			document.cookie = `${storageKey}=${t}; path=/; max-age=31536000; SameSite=Lax`;
		} catch {}
		setThemeState(t);
	};

	return (
		<ThemeProviderContext.Provider value={{ theme, setTheme }} {...props}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}

	return context;
};
