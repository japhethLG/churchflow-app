import "server-only";
import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { type Auth, getAuth } from "firebase-admin/auth";
import { type Firestore, getFirestore } from "firebase-admin/firestore";

let _app: App | null = null;

const getApp = (): App => {
	if (_app) {
		return _app;
	}
	_app = getApps()[0] ?? null;
	if (_app) {
		return _app;
	}

	const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
	const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
	const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
		// strip a trailing comma that slipped past the env parser
		?.replace(/,\s*$/, "")
		// strip wrapping double or single quotes if the parser kept them
		.replace(/^["']|["']$/g, "")
		// turn literal \n into real newlines (for loaders that don't expand them)
		.replace(/\\n/g, "\n");

	if (!projectId || !clientEmail || !privateKey) {
		throw new Error(
			"Firebase Admin env vars missing (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY)",
		);
	}

	_app = initializeApp({
		credential: cert({ projectId, clientEmail, privateKey }),
	});
	return _app;
};

export const adminAuth: Auth = new Proxy({} as Auth, {
	get: (_, prop) => Reflect.get(getAuth(getApp()), prop),
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
	get: (_, prop) => Reflect.get(getFirestore(getApp()), prop),
});
