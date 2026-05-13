import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
// Configuration object using environment variables with local config fallback
const getFirebaseConfig = async () => {
  let localConfig: any = {};
  
  // Only try to load the local config file in development or if env vars are missing
  if (import.meta.env.DEV || !import.meta.env.VITE_FIREBASE_API_KEY) {
    try {
      const module = await import('../firebase-applet-config.json');
      localConfig = module.default || module;
    } catch (e) {
      // Ignore error if file is missing in production
    }
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId,
    firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID || localConfig.firestoreDatabaseId || '(default)'
  };
};

const config = await getFirebaseConfig();

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
