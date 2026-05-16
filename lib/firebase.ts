import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with long polling to ensure compatibility in preview iframes
const dbId = '(default)';
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false
}, dbId);

export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
      console.error(`Config used: Project='${firebaseConfig.projectId}', DB='${dbId}'`);
    } else {
      console.error("FIRESTORE CONNECTION ERROR:", error);
      console.error("Error Code:", code);
    }
    return false;
  }
};
