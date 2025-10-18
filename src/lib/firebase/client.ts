// src/lib/firebase/client.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  type Auth,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

type FirebaseClients = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  analytics: Promise<Analytics | null>;
};

let cachedApp: FirebaseApp | undefined;
let analyticsPromise: Promise<Analytics | null> | undefined;
let emulatorsConnected = false;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const getFirebase = (): FirebaseClients => {
  if (!cachedApp) {
    cachedApp = getApps()[0] ?? initializeApp(firebaseConfig);
  }

  const auth = getAuth(cachedApp);
  const firestore = getFirestore(cachedApp);

  if (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" &&
    typeof window !== "undefined" &&
    !emulatorsConnected
  ) {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(firestore, "localhost", 8080);
    emulatorsConnected = true;
  }

  if (typeof window !== "undefined" && !analyticsPromise) {
    analyticsPromise = isSupported()
      .then((supported) => (supported ? getAnalytics(cachedApp) : null))
      .catch(() => null);
  }

  if (!analyticsPromise) {
    analyticsPromise = Promise.resolve(null);
  }

  return {
    app: cachedApp,
    auth,
    firestore,
    analytics: analyticsPromise,
  };
};
