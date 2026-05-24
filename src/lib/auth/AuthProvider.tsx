"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { usePathname } from "next/navigation";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { getClientAuth } from "@/lib/firebase/client";

type AuthContextValue = {
	user: User | null;
	loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
	user: null,
	loading: true,
});

const PUBLIC_PATHS = ["/login", "/invite", "/logout", "/privacy", "/terms"];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const pathname = usePathname();

	useEffect(() => {
		let unsub: (() => void) | undefined;
		try {
			unsub = onAuthStateChanged(getClientAuth(), (u) => {
				setUser(u);
				setLoading(false);
			});
		} catch (err) {
			console.error("Auth provider init failed", err);
			setLoading(false);
		}
		return () => unsub?.();
	}, []);

	// Proactively redirect to login when signed out on a protected route
	useEffect(() => {
		if (loading) {
			return;
		}

		const isPublic =
			pathname === "/" || PUBLIC_PATHS.some((p) => pathname.startsWith(p));

		if (!user && !isPublic) {
			const next = encodeURIComponent(pathname + window.location.search);
			window.location.href = `/login?next=${next}`;
		}
	}, [user, loading, pathname]);

	const value = useMemo(() => ({ user, loading }), [user, loading]);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	return useContext(AuthContext);
};
