import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "12345",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:12345:web:dummy",
};

// Initialize Firebase with safety
let app;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
  console.warn("Firebase initialization failed. Using placeholder app.", error);
  app = { name: '[DEFAULT]', options: firebaseConfig } as any;
}

// Initialize Services safely
export const auth = getAuth(app);

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch (error) {
  try {
    firestoreInstance = getFirestore(app);
  } catch (e) {
    console.warn("Firestore initialization failed.");
    firestoreInstance = {} as any;
  }
}
export const db = firestoreInstance;

export default app;
