"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
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

// Pure auth-STATE provider for `useAuth()` consumers. It deliberately does
// NOT redirect on a null user:
//   - Navigation gating is owned by proxy.ts (the HTTP-only session cookie
//     is the source of truth) and the RSC layouts' getSessionUser() check.
//   - A session that lapses mid-use is caught by the API 401 handler, which
//     ejects via a soft router.replace (see client.ts).
// The old client-side redirect keyed off the Firebase *client* user (restored
// async from IndexedDB), so a transient null — slow restore, cross-tab
// sign-out sync, a refresh-token hiccup — would fire a full-document reload
// and bounce a user whose cookie was still perfectly valid. Removing it kills
// that hazard and the triple-gating it represented.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

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

	const value = useMemo(() => ({ user, loading }), [user, loading]);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	return useContext(AuthContext);
};
