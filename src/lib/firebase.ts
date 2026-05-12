import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { Firestore, getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ── App ─────────────────────────────────────────────────────────────────────
let app: FirebaseApp | null = null;
const hasConfig = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

if (hasConfig) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  } catch (error) {
    console.warn("[Firebase] App initialization failed:", error);
    app = null;
  }
} else {
  console.warn("[Firebase] Missing environment variables. Auth will be unavailable.");
}

// ── Auth ─────────────────────────────────────────────────────────────────────
let authInstance: Auth | null = null;
if (app) {
  try {
    authInstance = getAuth(app);
  } catch (error) {
    console.warn("[Firebase] Auth initialization failed:", error);
  }
}
export const auth = authInstance as Auth;

// ── Firestore ─────────────────────────────────────────────────────────────────
let firestoreInstance: Firestore | null = null;
if (app) {
  try {
    firestoreInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch {
    try {
      firestoreInstance = getFirestore(app);
    } catch (e) {
      console.warn("[Firebase] Firestore initialization failed:", e);
    }
  }
}
export const db = firestoreInstance as Firestore;

export const isFirebaseAvailable = !!app && !!authInstance;
export default app;
