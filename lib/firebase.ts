import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import firebaseConfigLocal from '../firebase-applet-config.json';

// Configuration object with environment variables as primary and local config as fallback
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigLocal.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigLocal.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigLocal.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigLocal.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigLocal.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigLocal.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID || firebaseConfigLocal.firestoreDatabaseId || '(default)'
};

const app = initializeApp(config);
export const auth = getAuth(app);

// Use the database ID from config
const dbId = config.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, dbId);

export const isFirebaseConfigured = !!(config.apiKey && config.projectId);

// Test function to verify database connection
export const testFirestoreConnection = async () => {
  if (!isFirebaseConfigured) return false;
  try {
    // Try to get a dummy doc to verify the database existence
    // Using getDocFromServer forces a network request to check if the DB actually exists
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    return true;
  } catch (error: any) {
    const msg = error.message.toLowerCase();
    const code = error.code || "";
    
    if (code === 'permission-denied' || msg.includes('permission')) {
      // Permission denied is actually a good sign - it means the database exists and we reached it!
      console.log("FIRESTORE: Connection verified (received expected permission-denied).");
      return true;
    }
    
    if (msg.includes('not found') || msg.includes('not-found')) {
      console.error(`FIRESTORE ERROR: Database '${dbId}' not found. Please ensure the database ID in firebase-applet-config.json matches your Firestore console.`);
    } else if (msg.includes('offline')) {
      console.error("FIRESTORE ERROR: Client is offline. This can also happen if the database ID or Project ID is incorrect.");
    } else {
      console.error("FIRESTORE CONNECTION ERROR:", error);
      console.error("Error Code:", code);
      console.error("Error Details:", error.customData || "None");
    }
    return false;
  }
};
