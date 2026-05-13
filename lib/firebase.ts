import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDocFromCache, 
  getDocFromServer 
} from 'firebase/firestore';
// Helper to check if a value is a placeholder or an invalid URL
const isPlaceholder = (val?: string) => {
  if (!val) return true;
  const lowerVal = String(val).trim().toLowerCase();
  const placeholders = [
    'your_firebase_api_key',
    'your_project.firebaseapp.com',
    'your_project_id',
    'your_project.appspot.com',
    'your_sender_id',
    'your_app_id',
    '(default)',
    'database_id',
    'your_project_id',
    'your_firebase_config',
    'placeholder'
  ];
  
  if (placeholders.includes(lowerVal)) return true;
  // Catch console URLs being used as IDs (common user mistake)
  if (lowerVal.includes('console.firebase.google.com')) return true; 
  if (lowerVal.includes('console.firebase.corp.google.com')) return true;
  if (lowerVal.includes('your_project_id')) return true;
  if (lowerVal.includes('database_id')) return true;
  if (/^https?:\/\//.test(lowerVal)) return true; // Any URL is almost certainly a mistake for a config value
  
  return false;
};

const getEnv = (key: string, fallback: string) => {
  const val = import.meta.env[key];
  // If it exists but it's a placeholder, return fallback
  if (val && !isPlaceholder(String(val))) {
    return String(val);
  }
  return fallback;
};

// Configuration object using environment variables with project-specific fallbacks.
// IMPORTANT: These fallbacks are based on the initially provisioned project.
// If you remix this app, you should update these to your own project IDs or set them in Secrets.
const config = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', 'AIzaSyCT1UPa4ZiQivML5vbGrQRzL1jFswl6Pp4'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'gen-lang-client-0279308694.firebaseapp.com'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', 'gen-lang-client-0279308694'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'gen-lang-client-0279308694.firebasestorage.app'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '978301294165'),
  appId: getEnv('VITE_FIREBASE_APP_ID', '1:978301294165:web:5333682ca746f3d9e226dc'),
  firestoreDatabaseId: getEnv('VITE_FIRESTORE_DATABASE_ID', 'ai-studio-79c7ec6f-dca0-4319-8f2a-c01b36c8f322')
};

// Use the database ID from config, fallback to (default) only if truly empty
const dbId = (config.firestoreDatabaseId && !isPlaceholder(config.firestoreDatabaseId)) 
  ? config.firestoreDatabaseId 
  : '(default)';

const app = initializeApp(config);
export const auth = getAuth(app);

// Use initializeFirestore with long polling to ensure compatibility in preview iframes
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  experimentalForceLongPolling: true, // Forced long polling fixes many connectivity issues in sandboxed environments
  experimentalAutoDetectLongPolling: false // We force it, so don't auto-detect
}, dbId);

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
      console.error(`FIRESTORE ERROR: Database '${dbId}' not found. Please ensure the database ID matches your Firestore console.`);
    } else if (msg.includes('offline')) {
      console.error(`FIRESTORE ERROR: Client is offline. This is common in preview environments.`);
      console.error(`Config used: Project='${config.projectId}', DB='${dbId}'`);
      if (isPlaceholder(dbId) || dbId.includes('YOUR_PROJECT_ID') || dbId.includes('DATABASE_ID')) {
        console.error("CRITICAL: It looks like you're using placeholder IDs. Please run the Firebase Setup tool again.");
        return false;
      }
      console.error("Full error details:", error);
    } else {
      console.error("FIRESTORE CONNECTION ERROR:", error);
      console.error("Error Code:", code);
    }
    return false;
  }
};
