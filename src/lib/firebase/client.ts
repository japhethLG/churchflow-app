import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function firebaseApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps()[0] ?? null;
  if (_app) return _app;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!config.apiKey) {
    throw new Error(
      "Firebase client config missing. Set NEXT_PUBLIC_FIREBASE_* env vars (or run with `npm run dev:test` / `npm run build:test`)."
    );
  }

  _app = initializeApp(config);
  return _app;
}

export function getClientAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(firebaseApp());
  return _auth;
}

export function getClientDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(firebaseApp());
  return _db;
}

export function getGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}
