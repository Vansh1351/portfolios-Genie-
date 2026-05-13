
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  Send, 
  Paperclip, 
  RefreshCw, 
  ArrowRight, 
  ChevronLeft, 
  Download, 
  Share2, 
  Image as ImageIcon, 
  FileText, 
  Code, 
  Layout, 
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  Trash2,
  Cloud,
  HardDrive,
  Palette,
  Plus,
  Zap,
  History,
  Menu,
  X,
  Clock,
  Eye,
  FileDown,
  Type,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  CloudOff,
  Lock,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { AppState, Message, UserProfile, Attachment, ChatSession } from './types';
import { INITIAL_PROFILE, THEME_COLORS } from './constants';
import { chatWithGenie, extractProfileData } from './services/geminiService';
import ResumePreview from './components/ResumePreview';
import WebsitePreview from './components/WebsitePreview';
import ManualEdit from './components/ManualEdit';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';
import ExportPreviewModal from './components/ExportPreviewModal';
import { auth, db, isFirebaseConfigured, testFirestoreConnection } from './lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Declare cloud and export SDKs for TypeScript
declare var gapi: any;
declare var google: any;
declare var OneDrive: any;
declare var html2pdf: any;
declare var html2canvas: any;

interface PDFSettings {
  format: 'letter' | 'a4' | 'fit';
  orientation: 'portrait' | 'landscape';
  source: 'resume' | 'website';
  includeSummary: boolean;
  includeExperience: boolean;
  includeEducation: boolean;
  includeProjects: boolean;
  includeSkills: boolean;
  fontSize: 'small' | 'medium' | 'large';
  margin: 'none' | 'small' | 'normal' | 'large';
}

// Helper functions for compression and URL-safe Base64
const KEY_MAP: Record<string, string> = {
  name: 'n',
  title: 't',
  email: 'e',
  phone: 'p',
  location: 'l',
  summary: 's',
  skills: 'sk',
  experience: 'ex',
  education: 'ed',
  projects: 'pr',
  socialLinks: 'sl',
  themeColor: 'tc',
  fontFamily: 'ff',
  resumeTemplate: 'rt',
  websiteTemplate: 'wt',
  company: 'c',
  role: 'r',
  duration: 'd',
  description: 'ds',
  institution: 'i',
  degree: 'dg',
  year: 'y',
  techStack: 'ts',
  link: 'lk',
  linkedin: 'li',
  github: 'gh',
  portfolio: 'pf'
};

const REVERSE_KEY_MAP = Object.fromEntries(Object.entries(KEY_MAP).map(([k, v]) => [v, k]));

const mapKeys = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(mapKeys);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [KEY_MAP[k] || k, mapKeys(v)])
    );
  }
  return obj;
};

const unmapKeys = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(unmapKeys);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [REVERSE_KEY_MAP[k] || k, unmapKeys(v)])
    );
  }
  return obj;
};

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64ToBuffer = (base64: string): ArrayBuffer => {
  const bin = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes.buffer;
};

const compressData = async (str: string): Promise<string> => {
  const stream = new Blob([str]).stream().pipeThrough(new CompressionStream('deflate'));
  const buffer = await new Response(stream).arrayBuffer();
  return bufferToBase64(buffer);
};

const decompressData = async (base64: string): Promise<string> => {
  const buffer = base64ToBuffer(base64);
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('deflate'));
  return await new Response(stream).text();
};

// Utility for cleaning filenames to be storage-safe
const sanitizeFilename = (name: string) => {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_');
};

const WELCOME_MESSAGE = "Hello! I'm PortfolioGenie. I'm here to help you build a stunning resume and a personal website. Let's start with the basics-what is your full name and what role are you targeting? You can also upload your current resume for me to analyze!";

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('landing');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [isTyping, setIsTyping] = useState(false);
  const [previewTab, setPreviewTab] = useState<'resume' | 'website' | 'code' | 'export' | 'design' | 'edit'>('resume');
  const [codeSource, setCodeSource] = useState<'resume' | 'website'>('resume');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isCapturingImage, setIsCapturingImage] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // PDF Settings
  const [pdfSettings, setPdfSettings] = useState<PDFSettings>({ 
    format: 'letter', 
    orientation: 'portrait',
    source: 'resume',
    includeSummary: true,
    includeExperience: true,
    includeEducation: true,
    includeProjects: true,
    includeSkills: true,
    fontSize: 'medium',
    margin: 'none'
  });
  const [websiteDarkMode, setWebsiteDarkMode] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'txt' | 'html' | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  
  // History & Session Management
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [exports, setExports] = useState<{name: string, url: string, type: string, createdAt: string}[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('offline');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileUploadRef = useRef<any>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  }, []);

  const handleSendMessage = useCallback(async (e: React.FormEvent | null, overrideMessages?: Message[]) => {
    if (e) e.preventDefault();
    if (((!inputText.trim() && pendingAttachments.length === 0) || isTyping) && !overrideMessages) return;

    const userMsg: Message = overrideMessages ? overrideMessages[overrideMessages.length - 1] : { 
      role: 'user', 
      content: inputText || (pendingAttachments.length > 0 ? "Analyze this file." : ""),
      attachments: pendingAttachments 
    };
    
    if (!overrideMessages) {
      setMessages(prev => [...prev, userMsg]);
      setInputText('');
      setPendingAttachments([]);
    }
    
    setIsTyping(true);

    try {
      const history = overrideMessages || [...messages, userMsg];
      const result = await chatWithGenie(history, { 
        thinkingMode, 
        attachments: userMsg.attachments 
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.text,
        sources: result.sources
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, pendingAttachments, isTyping, messages, thinkingMode]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList } }) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    showNotification(`Processing ${fileArray.length} file(s)...`, "info");

    const getMimeType = (file: File) => {
      if (file.type && file.type !== 'application/octet-stream') return file.type;
      const ext = file.name.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'pdf': return 'application/pdf';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'doc': return 'application/msword';
        case 'txt': return 'text/plain';
        case 'rtf': return 'application/rtf';
        case 'odt': return 'application/vnd.oasis.opendocument.text';
        case 'png': return 'image/png';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'gif': return 'image/gif';
        case 'webp': return 'image/webp';
        case 'mp4': return 'video/mp4';
        case 'mov': return 'video/quicktime';
        default: return file.type || 'application/octet-stream';
      }
    };

    const readAndUpload = async (file: File): Promise<Attachment | null> => {
      try {
        console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);
        
        let cloudUrl = undefined;
        if (user) {
          try {
            cloudUrl = await uploadFileToFirebase(file);
          } catch (uploadErr) {
            console.warn("Cloud upload failed, but continuing with local data:", uploadErr);
          }
        }

        const mimeType = getMimeType(file);

        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result !== 'string') {
              console.error("FileReader result is not a string");
              resolve(null);
              return;
            }
            const parts = result.split(',');
            if (parts.length < 2) {
              console.error("FileReader result split failed");
              resolve(null);
              return;
            }
            const base64 = parts[1];
            resolve({
              mimeType,
              data: base64,
              name: file.name,
              url: cloudUrl || undefined
            });
          };
          reader.onerror = (err) => {
            console.error("FileReader error:", err);
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      } catch (err) {
        console.error("File processing failed:", err);
        return null;
      }
    };

    Promise.all(fileArray.map(readAndUpload)).then(newAttachments => {
      const validAttachments = newAttachments.filter((a): a is Attachment => a !== null);
      if (validAttachments.length > 0) {
        setPendingAttachments(prev => [...prev, ...validAttachments]);
        
        if (appState === 'landing') {
          setAppState('chatting');
          const initialMsg: Message = { 
            role: 'assistant', 
            content: "I've received your documents! I'm analyzing them deeply right now to build your profile. Please wait a moment..." 
          };
          const userMsg: Message = {
            role: 'user',
            content: "Please analyze these documents and build my profile.",
            attachments: validAttachments
          };
          setMessages([initialMsg, userMsg]);
          
          setTimeout(() => {
            handleSendMessage(null, [initialMsg, userMsg]);
          }, 500);
        } else {
          showNotification(`${validAttachments.length} file(s) ready! Click send to analyze.`, "success");
        }
      } else {
        showNotification("Failed to process selected file(s).", "error");
      }
    });

    setShowAttachMenu(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [user, appState, showNotification, handleSendMessage]);

  useEffect(() => {
    handleFileUploadRef.current = handleFileUpload;
  }, [handleFileUpload]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  useEffect(() => {
    // Listen for auth changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setShowAuthModal(false);
      }
    });

    // Verify Firestore database connection
    const checkConnection = async () => {
      if (isFirebaseConfigured) {
        const isConnected = await testFirestoreConnection();
        if (!isConnected) {
          console.warn("Firestore database connection could not be verified. This might be due to a missing database or strict rules.");
        }
      }
    };
    checkConnection();
    
    // Add paste listener for documents/images
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        // Trigger file upload logic
        const target = { files: files as unknown as FileList } as unknown as HTMLInputElement;
        const dummyEvent = {
          target,
          currentTarget: target,
          bubbles: true,
          cancelable: true,
          defaultPrevented: false,
          eventPhase: 3,
          isTrusted: true,
          nativeEvent: new Event('change'),
          persist: () => {},
          isDefaultPrevented: () => false,
          isPropagationStopped: () => false,
          stopPropagation: () => {},
          preventDefault: () => {},
          timeStamp: Date.now(),
          type: 'change'
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileUploadRef.current(dummyEvent);
      }
    };

    window.addEventListener('paste', handlePaste);

    return () => {
      unsubscribe();
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  useEffect(() => {
    // Handle transitions when user becomes available
    if (user && appState === 'landing') {
      setAppState('chatting');
      showNotification("Welcome back! Loading your profile...", "success");
    }
  }, [user]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.profile_data) setProfile(data.profile_data);
          if (data.exports_data) setExports(data.exports_data);
          if (data.settings) {
            if (data.settings.websiteDarkMode !== undefined) setWebsiteDarkMode(data.settings.websiteDarkMode);
            if (data.settings.pdfSettings) setPdfSettings(prev => ({ ...prev, ...data.settings.pdfSettings }));
          }
          if (data.sessions_data && data.sessions_data.length > 0) {
            setSessions(data.sessions_data);
            const mostRecent = data.sessions_data[0];
            setCurrentSessionId(mostRecent.id);
            setMessages(mostRecent.messages);
            if (appState !== 'landing') {
              setAppState(mostRecent.appState || 'chatting');
            }
          }
          showNotification("Cloud data synced", "success");
        }
      } catch (error) {
        console.warn("Firebase fetch error:", error);
      }
    };
    fetchUserData();
  }, [user?.uid]);

  // Removed auto-redirection to chatting state to allow users to see the "starting dashboard"
  // as per user request.

  const saveToFirebase = async (newProfile: UserProfile, newSessions: ChatSession[], newExports?: any[]) => {
    if (!user) {
      setCloudStatus('offline');
      return;
    }
    
    setCloudStatus('syncing');
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { 
        profile_data: newProfile,
        sessions_data: newSessions,
        exports_data: newExports || exports,
        settings: {
          websiteDarkMode,
          pdfSettings
        },
        updated_at: serverTimestamp()
      }, { merge: true });
      setCloudStatus('synced');
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      setCloudStatus('error');
    }
  };

  const handleManualCloudSave = async () => {
    if (!user) {
      setShowAuthModal(true);
      showNotification("Please sign in or create an account to save your progress to the cloud.", "info");
      return;
    }
    
    setIsGeneratingPDF(true);
    showNotification("Creating comprehensive cloud backup...", "info");
    
    try {
      // 1. Save JSON State (Profile & Sessions)
      await saveToFirebase(profile, sessions);
      
      // 2. Capture PDF (Silent)
      const targetId = '#resume-capture-target';
      const element = document.querySelector(targetId) as HTMLElement;
      if (element) {
        // Setup capture
        const originalStyle = element.getAttribute('style') || '';
        element.classList.add('pdf-export-mode');
        
        const opt = {
          margin: 0,
          filename: sanitizeFilename(`Cloud_Backup_${profile.name || 'Portfolio'}.pdf`),
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        const captureContainer = element.parentElement;
        if (captureContainer) {
          captureContainer.style.opacity = '1';
          captureContainer.style.height = 'auto';
          captureContainer.style.position = 'fixed';
          captureContainer.style.top = '-10000px';
          captureContainer.style.left = '-10000px';
          captureContainer.style.width = `800px`;
        }
        element.style.width = `800px`;

        await new Promise(r => setTimeout(r, 1000));
        const blob = await html2pdf().set(opt).from(element).toPdf().output('blob');
        
        // 3. Upload to exports
        await uploadExportToFirebase(blob, opt.filename);
        
        // cleanup
        element.classList.remove('pdf-export-mode');
        element.setAttribute('style', originalStyle);
        if (captureContainer) {
          captureContainer.style.opacity = '0';
          captureContainer.style.height = '0';
          captureContainer.style.position = 'absolute';
        }
      }
      
      showNotification("Full portfolio state & PDF stored in Cloud!", "success");
    } catch (err) {
      console.error("Cloud backup failed:", err);
      showNotification("Backup partially failed. Check Storage tab.", "error");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSavePreviewToCloud = async () => {
    if (!user) {
      setShowAuthModal(true);
      showNotification("Please sign in or create an account to save to the cloud.", "info");
      return;
    }

    if (!exportFormat) return;

    // These functions already perform uploadExportToFirebase internally
    if (exportFormat === 'pdf') {
      await exportAsPDF(false);
    } else if (exportFormat === 'docx') {
      await exportAsDocx();
    } else if (exportFormat === 'txt') {
      exportAsTxt();
    } else if (exportFormat === 'html') {
      exportAsHTML(pdfSettings.source);
    }
  };

  const uploadFileToFirebase = async (file: File) => {
    if (!user) return null;
    
    try {
      const storage = getStorage();
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const storageRef = ref(storage, `users/${user.uid}/files/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (err) {
      console.error('Upload to Firebase Storage failed:', err);
      return null;
    }
  };

  const uploadExportToFirebase = async (blob: Blob, filename: string) => {
    if (!user) return;
    try {
      const storage = getStorage();
      const safeFilename = sanitizeFilename(filename);
      const storageRef = ref(storage, `users/${user.uid}/exports/${Date.now()}_${safeFilename}`);
      
      await uploadBytes(storageRef, blob, { contentType: blob.type });
      const downloadURL = await getDownloadURL(storageRef);

      const newExport = {
        name: filename,
        url: downloadURL,
        type: filename.split('.').pop() || 'file',
        createdAt: new Date().toISOString()
      };

      setExports(prev => {
        const updated = [newExport, ...prev];
        saveToFirebase(profile, sessions, updated);
        return updated;
      });
      
    } catch (err: any) {
      console.error('Cloud export backup failed:', err);
      showNotification("Archived to local history. Cloud Storage pending.", "info");
    }
  };

  useEffect(() => {
    // Auto-save to Firebase when profile, sessions, exports or settings change
    if (user && appState !== 'landing') {
      const timer = setTimeout(() => {
        saveToFirebase(profile, sessions, exports);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [profile, sessions, exports, user, appState, websiteDarkMode, pdfSettings]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    
    setAuthLoading(true);
    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        if (userCredential.user) {
          showNotification("Account created successfully. Welcome!", "success");
          setShowAuthModal(false);
          setAuthEmail('');
          setAuthPassword('');
        }
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        showNotification("Welcome back!", "success");
        setShowAuthModal(false);
        setAuthEmail('');
        setAuthPassword('');
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let message = error.message;

      // User-friendly error mapping with better detection
      const code = error.code || "";
      if (code === 'auth/operation-not-allowed' || message.includes('operation-not-allowed')) {
        message = "SIGN-IN NOT ENABLED: Please go to your Firebase Console > Authentication > Sign-in method and enable 'Email/Password' and 'Google'.";
      } else if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
        message = "DOMAIN NOT AUTHORIZED: Please add this URL to 'Authorized domains' in your Firebase Console (Authentication > Settings).";
      } else if (code === 'auth/email-already-in-use' || message.includes('email-already-in-use')) {
        message = "This email is already registered. Switching to Sign In...";
        setAuthMode('login');
      } else if (code === 'auth/weak-password') {
        message = "Password is too weak. Please use at least 6 characters.";
      } else if (code === 'auth/invalid-email') {
        message = "Please enter a valid email address.";
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        message = "Incorrect email or password. If you are sure your credentials are correct, please check that your API Key in the Firebase Console matches the one in your app settings.";
      } else if (code === 'auth/popup-closed-by-user') {
        message = "Sign-in popup closed.";
      } else if (message.includes('Firebase:')) {
        message = message.replace('Firebase:', '').trim();
      }
      
      showNotification(message, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setSessions([]);
      setExports([]);
      setProfile(INITIAL_PROFILE);
      setMessages([]);
      setAppState('landing');
      showNotification("Signed out successfully", "info");
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        showNotification("Signed in successfully!", "success");
        setShowAuthModal(false);
        if (appState === 'landing') setAppState('chatting');
      }
    } catch (error: any) {
      console.error("Google Auth error:", error);
      let message = error.message;
      
      const code = error.code || "";
      if (code === 'auth/operation-not-allowed' || message.includes('operation-not-allowed')) {
        message = "GOOGLE SIGN-IN NOT ENABLED: Please enable it in the Firebase Console (Authentication > Sign-in method).";
      } else if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
        message = "DOMAIN NOT AUTHORIZED: Please add this URL to 'Authorized domains' in your Firebase Console (Authentication > Settings).";
      } else if (code === 'auth/popup-closed-by-user') {
        message = "The sign-in popup was closed.";
      }
      
      showNotification(message, "error");
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/status');
        const data = await res.json();
        setIsGoogleConnected(data.isAuthenticated);
      } catch (e) {
        console.error('Auth check failed', e);
      }
    };
    checkAuth();
  }, []);

  const handleGoogleConnect = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const { url } = await res.json();
      const popup = window.open(url, 'google_auth', 'width=600,height=700');
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          setIsGoogleConnected(true);
          showNotification("Connected to Google Drive!", "success");
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (e) {
      showNotification("Failed to connect to Google Drive", "error");
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsGoogleConnected(false);
      showNotification("Disconnected from Google Drive", "info");
    } catch (e) {
      showNotification("Logout failed", "error");
    }
  };

  const uploadToDrive = async (blob: Blob, fileName: string, mimeType?: string) => {
    setIsUploadingToDrive(true);
    try {
      const res = await fetch(`/api/drive/upload?name=${encodeURIComponent(fileName)}`, {
        method: 'POST',
        headers: { 'Content-Type': mimeType || blob.type || 'application/octet-stream' },
        body: blob
      });
      if (res.ok) {
        const data = await res.json();
        showNotification("File exported and uploaded to Google Drive!", "success");
        return data;
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (e: any) {
      console.error('Google Drive Upload Error:', e);
      showNotification(`Failed to upload to Google Drive: ${e.message}`, "error");
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  useEffect(() => {
    const handleInitialHash = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#share=')) {
        const encodedData = hash.replace('#share=', '');
        try {
          let jsonStr: string;
          try {
            jsonStr = await decompressData(encodedData);
          } catch (deflateErr) {
            // Fallback to gzip if deflate fails (for backward compatibility with old links)
            const buffer = base64ToBuffer(encodedData);
            const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
            jsonStr = await new Response(stream).text();
          }
          
          const rawData = JSON.parse(jsonStr);
          // Check if data is mapped or raw
          const profileData = rawData.n ? unmapKeys(rawData) : rawData;
          
          setProfile({ ...INITIAL_PROFILE, ...profileData });
          setAppState('preview');
          showNotification("Shared profile loaded successfully!", "success");
        } catch (e) {
          console.warn("Decompression failed, attempting legacy decode...");
          try {
            const decodedData = JSON.parse(decodeURIComponent(escape(atob(encodedData.replace(/-/g, '+').replace(/_/g, '/')))));
            setProfile({ ...INITIAL_PROFILE, ...decodedData });
            setAppState('preview');
          } catch (legacyErr) {
            console.error("Failed to parse shared profile", legacyErr);
            showNotification("The share link is invalid or corrupted.", "error");
          }
        }
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    handleInitialHash();

    const savedMessages = localStorage.getItem('pg_messages');
    const savedProfile = localStorage.getItem('pg_profile');
    const savedAppState = localStorage.getItem('pg_appstate');
    const savedSessions = localStorage.getItem('pg_sessions');
    const savedCurrentSessionId = localStorage.getItem('pg_current_session_id');

    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions);
      setSessions(parsedSessions);
      if (savedCurrentSessionId) {
        setCurrentSessionId(savedCurrentSessionId);
        const current = parsedSessions.find((s: ChatSession) => s.id === savedCurrentSessionId);
        if (current) {
          setMessages(current.messages);
          setProfile({ ...INITIAL_PROFILE, ...current.profile });
          setAppState(current.appState);
        }
      }
    } else if (savedMessages && savedProfile && savedAppState) {
      // Migrate legacy data to a session
      const legacySession: ChatSession = {
        id: crypto.randomUUID(),
        title: 'Previous Chat',
        messages: JSON.parse(savedMessages),
        profile: { ...INITIAL_PROFILE, ...JSON.parse(savedProfile) },
        appState: JSON.parse(savedAppState),
        createdAt: Date.now()
      };
      setSessions([legacySession]);
      setCurrentSessionId(legacySession.id);
      setMessages(legacySession.messages);
      setProfile(legacySession.profile);
      setAppState(legacySession.appState);
    }
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages, profile, appState, title: messages[1]?.content.slice(0, 30) || s.title } 
          : s
      ));
      localStorage.setItem('pg_current_session_id', currentSessionId);
    }
  }, [messages, profile, appState, currentSessionId]);

  // Sync sessions to localStorage separately to avoid circular updates if sessions was in dependencies
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('pg_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewChat = () => {
    const welcomeMsg: Message = {
      role: 'assistant',
      content: WELCOME_MESSAGE
    };
    
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [welcomeMsg],
      profile: INITIAL_PROFILE,
      appState: 'landing',
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([welcomeMsg]);
    setProfile(INITIAL_PROFILE);
    setAppState('landing');
    setIsSidebarOpen(false);
  };

  const renameSession = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, title: newTitle } : s
    ));
    showNotification("Session renamed", "success");
  };

  const switchSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
      setProfile({ ...INITIAL_PROFILE, ...session.profile });
      setAppState(session.appState);
      setIsSidebarOpen(false);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);
    if (currentSessionId === id) {
      if (updatedSessions.length > 0) {
        switchSession(updatedSessions[0].id);
      } else {
        createNewChat();
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const startInterview = async () => {
    const initialGreeting: Message = { 
      role: 'assistant', 
      content: WELCOME_MESSAGE 
    };

    if (messages.length === 1 && messages[0].content === WELCOME_MESSAGE && appState === 'landing') {
      setAppState('chatting');
      return;
    }

    const newId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      messages: [initialGreeting],
      profile: INITIAL_PROFILE,
      appState: 'chatting',
      createdAt: Date.now()
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setMessages([initialGreeting]);
    setProfile(INITIAL_PROFILE);
    setAppState('chatting');
    setIsTyping(false);
  };

  const handleQuickScan = () => {
    fileInputRef.current?.click();
  };

  const saveCurrentChatToCloud = () => {
    if (messages.length === 0) {
      showNotification("Nothing to save yet!", "info");
      return;
    }

    const currentTitle = sessions.find(s => s.id === currentSessionId)?.title || "Untitled Session";
    const historyText = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const blob = new Blob([historyText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // In a real cloud scenario, we would upload this to Firebase Storage.
    // For now, we'll add it to the exports list to track it.
    const newExport = {
      name: `${currentTitle} - Chat Log`,
      url: url,
      type: 'txt',
      createdAt: new Date().toISOString()
    };
    
    setExports(prev => [...prev, newExport]);
    showNotification("History saved and synced to cloud!", "success");
    
    // Auto sync to firebase
    if (user) {
      saveToFirebase(profile, sessions, [...exports, newExport]);
    }
  };

  const handleExportClick = (format: 'pdf' | 'docx' | 'txt' | 'html') => {
    setExportFormat(format);
    setShowExportPreview(true);
  };

  const openGooglePicker = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

    if (!clientId || !apiKey) {
      showNotification("Google Drive integration requires configuration. Please contact the administrator.", "error");
      return;
    }

    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: async (response: any) => {
          if (response.error !== undefined) throw response;
          
          const picker = new google.picker.PickerBuilder()
            .addView(google.picker.ViewId.DOCS)
            .setOAuthToken(response.access_token)
            .setDeveloperKey(apiKey)
            .setCallback(async (data: any) => {
              if (data.action === google.picker.Action.PICKED) {
                const doc = data.docs[0];
                const fileId = doc.id;
                const fileName = doc.name;
                const mimeType = doc.mimeType;

                // Fetch file content
                const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                  headers: { Authorization: `Bearer ${response.access_token}` }
                });
                const blob = await fileResponse.blob();
                const reader = new FileReader();
                reader.onload = () => {
                  const base64 = (reader.result as string).split(',')[1];
                  setPendingAttachments(prev => [...prev, {
                    mimeType,
                    data: base64,
                    name: fileName
                  }]);
                };
                reader.readAsDataURL(blob);
              }
            })
            .build();
          picker.setVisible(true);
        },
      });
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      console.error("Google Picker Error:", err);
      showNotification("Failed to open Google Picker", "error");
    }
    setShowAttachMenu(false);
  };

  const openOneDrivePicker = () => {
    const clientId = import.meta.env.VITE_ONEDRIVE_CLIENT_ID;

    if (!clientId) {
      showNotification("OneDrive integration requires configuration. Please contact the administrator.", "error");
      return;
    }

    const odOptions = {
      clientId: clientId,
      action: "download",
      multiSelect: false,
      advanced: {
        redirectUri: window.location.origin + "/index.html"
      },
      success: async (files: any) => {
        const file = files.value[0];
        const downloadUrl = file["@microsoft.graph.downloadUrl"];
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          setPendingAttachments(prev => [...prev, {
            mimeType: file.file.mimeType,
            data: base64,
            name: file.name
          }]);
        };
        reader.readAsDataURL(blob);
      },
      cancel: () => {},
      error: (e: any) => {
        console.error("OneDrive Picker Error:", e);
        showNotification("Failed to open OneDrive Picker", "error");
      }
    };
    OneDrive.open(odOptions);
    setShowAttachMenu(false);
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const generatePreview = async () => {
    setIsTyping(true);
    showNotification("Synthesizing your professional identity...", "info");
    try {
      const data = await extractProfileData(messages);
      if (data) {
        setProfile(prev => ({ ...prev, ...data }));
        setAppState('preview');
        setPreviewTab('resume');
        showNotification("Profile generated successfully!", "success");
      } else {
        showNotification("Could not extract enough data. Try chatting a bit more!", "error");
      }
    } catch (err) {
      console.error("Preview Generation Error:", err);
      showNotification("Magic failed. Please try again.", "error");
    } finally {
      setIsTyping(false);
    }
  };

  const clearMemory = () => {
    localStorage.removeItem('pg_sessions');
    localStorage.removeItem('pg_current_session_id');
    localStorage.removeItem('pg_messages');
    localStorage.removeItem('pg_profile');
    localStorage.removeItem('pg_appstate');
    setSessions([]);
    setCurrentSessionId(null);
    setMessages([]);
    setProfile(INITIAL_PROFILE);
    setAppState('landing');
    window.location.hash = '';
    setShowResetConfirm(false);
    showNotification("Progress reset successfully", "info");
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    
    try {
      // Check for CompressionStream support
      if (typeof CompressionStream === 'undefined') {
        throw new Error('Compression not supported in this browser');
      }

      // Prune profile to make share link shorter
      const prunedProfile = { ...profile };
      // Remove empty arrays/objects to save space
      if (prunedProfile.experience?.length === 0) delete (prunedProfile as any).experience;
      if (prunedProfile.education?.length === 0) delete (prunedProfile as any).education;
      if (prunedProfile.projects?.length === 0) delete (prunedProfile as any).projects;
      if (prunedProfile.skills?.length === 0) delete (prunedProfile as any).skills;
      if (Object.keys(prunedProfile.socialLinks || {}).length === 0) delete (prunedProfile as any).socialLinks;

      const mappedData = mapKeys(prunedProfile);
      const jsonStr = JSON.stringify(mappedData);
      const compressedB64 = await compressData(jsonStr);
      const shareUrl = `${window.location.origin}${window.location.pathname}#share=${compressedB64}`;

      const shareData = {
        title: `Professional Profile - ${profile.name}`,
        text: `Check out my AI-generated profile created with PortfolioGenie!`,
        url: shareUrl,
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          showNotification("Shared successfully!", "success");
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            // User cancelled
          } else {
            console.warn("Native share failed, falling back to clipboard:", shareErr);
            await navigator.clipboard.writeText(shareUrl);
            showNotification("Compact link copied to clipboard! 🚀", "success");
          }
        }
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showNotification("Compact link copied to clipboard! 🚀", "success");
      }
    } catch (err) {
      console.error("Error sharing profile:", err);
      // Fallback to legacy if compression fails or is not supported
      try {
        const jsonStr = JSON.stringify(profile);
        const legacyB64 = btoa(unescape(encodeURIComponent(jsonStr))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const shareUrl = `${window.location.origin}${window.location.pathname}#share=${legacyB64}`;
        await navigator.clipboard.writeText(shareUrl);
        showNotification("Link copied to clipboard (Legacy Mode) 🚀", "info");
      } catch (legacyErr) {
        showNotification("Could not share. Please try again.", "error");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleAddSkill = (newSkill: string) => {
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill]
    }));
    showNotification(`Skill "${newSkill}" added!`);
  };

  const exportAsPDF = async (toDrive: boolean = false) => {
    if (!user) {
      setShowAuthModal(true);
      showNotification("Please sign in or create an account to download your resume.", "info");
      return;
    }
    const targetId = pdfSettings.source === 'resume' ? '#resume-capture-target' : '#website-capture-target';
    const element = document.querySelector(targetId) as HTMLElement;
    if (!element) return;

    setIsGeneratingPDF(true);
    showNotification(`Generating high-fidelity ${pdfSettings.source} PDF...`, "info");
    
    // Preparation
    const originalStyle = element.getAttribute('style') || '';
    element.classList.add('pdf-export-mode');

    // Wait for all images to load and ensure CORS
    const images = element.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.src && !img.src.startsWith('data:') && !img.crossOrigin) {
        img.crossOrigin = "anonymous";
      }
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    await Promise.all(imagePromises);

    const isLandscape = pdfSettings.orientation === 'landscape';
    // Use standard widths for high-fidelity capture (96 DPI)
    // Letter: 8.5in = 816px, A4: 210mm = 794px
    const formatWidths: Record<string, number> = {
      letter: 816,
      a4: 794,
      fit: 850
    };
    
    const baseWidth = pdfSettings.source === 'resume' 
      ? (formatWidths[pdfSettings.format] || 816) 
      : 1280;
    
    const aspectRatio = pdfSettings.format === 'a4' ? 1.414 : 1.294;
    const baseHeight = Math.round(baseWidth * aspectRatio);
    
    let targetWidth = isLandscape ? baseHeight : baseWidth;
    let targetHeight = isLandscape ? baseWidth : baseHeight;

    // Temporarily apply export styles to measure accurately
    element.style.width = `${targetWidth}px`;
    element.style.display = 'block';
    element.style.visibility = 'hidden';
    element.style.position = 'absolute';
    
    const contentWidth = element.scrollWidth;
    const contentHeight = element.scrollHeight;

    if (pdfSettings.format === 'fit') {
      // In fit mode, we want one single page that fits all content
      targetWidth = Math.max(contentWidth, targetWidth);
      targetHeight = contentHeight + 40; // Buffer
    } else {
      // For standard formats, we ensure we don't clip horizontally
      targetWidth = Math.max(contentWidth, targetWidth);
    }

    // Reset temporary styles
    element.style.width = '';
    element.style.display = '';
    element.style.visibility = '';
    element.style.position = '';

    const marginMap = { none: 0, small: 10, normal: 20, large: 40 };
    const marginValueInches = marginMap[pdfSettings.margin] / 96;
    const sanitizedName = (profile.name || 'portfolio').replace(/[^a-zA-Z0-9]/g, '_');

    const filename = sanitizeFilename(`${profile.name || 'portfolio'}-${pdfSettings.source}.pdf`);
    const opt = {
      margin: marginValueInches > 0 ? [marginValueInches, marginValueInches] : 0,
      filename: filename,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        allowTaint: false,
        letterRendering: true,
        logging: false,
        width: targetWidth,
        windowWidth: targetWidth,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: '#ffffff',
      },
      jsPDF: { 
        unit: 'in', 
        format: pdfSettings.format === 'fit' ? [targetWidth / 96, targetHeight / 96] : pdfSettings.format, 
        orientation: pdfSettings.orientation,
        compress: true,
        precision: 16
      },
      pagebreak: { 
        mode: pdfSettings.format === 'fit' ? 'avoid-all' : ['avoid-all', 'css', 'legacy'] 
      }
    };

    try {
      const captureContainer = element.parentElement;
      if (captureContainer) {
        captureContainer.style.opacity = '1';
        captureContainer.style.height = 'auto';
        captureContainer.style.position = 'fixed';
        captureContainer.style.top = '-10000px';
        captureContainer.style.left = '-10000px';
        captureContainer.style.width = `${targetWidth}px`;
        captureContainer.style.zIndex = '9999';
        captureContainer.style.overflow = 'visible';
        captureContainer.style.padding = '0';
        captureContainer.style.margin = '0';
      }

      // Ensure the element itself fills the target width and is reset
      element.style.width = `${targetWidth}px`;
      element.style.minHeight = `${targetHeight}px`;
      element.style.position = 'relative';
      element.style.left = '0';
      element.style.top = '0';
      element.style.margin = '0';

      // Small delay to ensure styles and layouts are stable
      await new Promise(r => setTimeout(r, 1000));
      
      if (toDrive) {
        const blob = await html2pdf().set(opt).from(element).toPdf().output('blob');
        await uploadToDrive(blob, opt.filename);
        await uploadExportToFirebase(blob, opt.filename);
      } else {
        const blob = await html2pdf().set(opt).from(element).toPdf().output('blob');
        await html2pdf().set(opt).from(element).save();
        await uploadExportToFirebase(blob, opt.filename);
        showNotification("PDF generated and saved to Cloud Storage!", "success");
      }
    } catch (e) {
      console.error("PDF Export Error:", e);
      showNotification("PDF Export failed. Please try again or use Print.", "error");
    } finally {
      element.classList.remove('pdf-export-mode');
      element.setAttribute('style', originalStyle);
      
      const captureContainer = element.parentElement;
      if (captureContainer) {
        captureContainer.style.opacity = '0';
        captureContainer.style.height = '0';
        captureContainer.style.position = 'absolute';
        captureContainer.style.zIndex = '-50';
        captureContainer.style.overflow = 'hidden';
      }
      setIsGeneratingPDF(false);
      setShowExportPreview(false);
    }
  };

  const exportAsImage = async () => {
    const element = document.querySelector('#resume-capture-target');
    if (!element) return;

    setIsCapturingImage(true);
    showNotification("Generating professional snapshot...", "info");
    element.classList.add('pdf-export-mode');

    try {
      const fileName = sanitizeFilename(`${profile.name || 'portfolio'}-profile.png`);
      
      const images = element.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.src && !img.src.startsWith('data:') && !img.crossOrigin) {
          img.crossOrigin = "anonymous";
        }
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      const canvas = await (window as any).html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false
      });

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
      if (!blob) throw new Error("Canvas to Blob failed");

      // Automatic cloud backup
      await uploadExportToFirebase(blob, fileName);

      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `PortfolioGenie Profile: ${profile.name}`,
          text: `Check out my professional profile generated by PortfolioGenie AI!`
        });
        showNotification("Image shared and saved to Cloud!");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        showNotification("Snapshot downloaded and saved to Cloud!");
      }
    } catch (err) {
      console.error("Image export error:", err);
      showNotification("Snapshot generation failed.", "error");
    } finally {
      element.classList.remove('pdf-export-mode');
      setIsCapturingImage(false);
    }
  };

  const exportAsTxt = (toDrive = false) => {
    if (!user) {
      setShowAuthModal(true);
      showNotification("Please sign in or create an account to download your resume.", "info");
      return;
    }
    let content = `${profile.name.toUpperCase()}\n`;
    content += `${profile.title}\n`;
    content += `${profile.email} | ${profile.phone} | ${profile.location}\n`;
    if (profile.socialLinks?.linkedin) content += `LinkedIn: ${profile.socialLinks.linkedin}\n`;
    if (profile.socialLinks?.github) content += `GitHub: ${profile.socialLinks.github}\n`;
    if (profile.socialLinks?.portfolio) content += `Portfolio: ${profile.socialLinks.portfolio}\n`;
    content += `\n${'='.repeat(20)}\n\n`;

    if (profile.summary) {
      content += `SUMMARY\n${'-'.repeat(7)}\n${profile.summary}\n\n`;
    }

    if (profile.experience?.length > 0) {
      content += `EXPERIENCE\n${'-'.repeat(10)}\n`;
      profile.experience.forEach(exp => {
        content += `${exp.role} | ${exp.company}\n`;
        content += `${exp.duration}\n`;
        if (Array.isArray(exp.description)) {
          exp.description.forEach(bullet => {
            content += `• ${bullet}\n`;
          });
        } else {
          content += `${exp.description}\n`;
        }
        content += `\n`;
      });
    }

    if (profile.education?.length > 0) {
      content += `EDUCATION\n${'-'.repeat(9)}\n`;
      profile.education.forEach(edu => {
        content += `${edu.degree} | ${edu.institution}\n`;
        content += `${edu.year}\n\n`;
      });
    }

    if (profile.skills?.length > 0) {
      content += `SKILLS\n${'-'.repeat(6)}\n${profile.skills.join(', ')}\n\n`;
    }

    if (profile.projects?.length > 0) {
      content += `PROJECTS\n${'-'.repeat(8)}\n`;
      profile.projects.forEach(proj => {
        content += `${proj.title}\n`;
        content += `${proj.description}\n`;
        if (proj.techStack?.length > 0) content += `Tech: ${proj.techStack.join(', ')}\n`;
        if (proj.link) content += `Link: ${proj.link}\n`;
        content += `\n`;
      });
    }

    if (profile.awards?.length > 0) {
      content += `AWARDS\n${'-'.repeat(6)}\n`;
      profile.awards.forEach(award => {
        content += `${award.title} | ${award.issuer} (${award.year})\n`;
      });
      content += `\n`;
    }

    if (profile.certifications?.length > 0) {
      content += `CERTIFICATIONS\n${'-'.repeat(14)}\n`;
      profile.certifications.forEach(cert => {
        content += `${cert.name} | ${cert.issuer} (${cert.year})\n`;
      });
      content += `\n`;
    }

    if (profile.achievements?.length > 0) {
      content += `ACHIEVEMENTS\n${'-'.repeat(12)}\n`;
      profile.achievements.forEach(ach => {
        content += `• ${ach}\n`;
      });
      content += `\n`;
    }

    if (profile.customSections?.length > 0) {
      profile.customSections.forEach(section => {
        content += `${section.title.toUpperCase()}\n${'-'.repeat(section.title.length)}\n`;
        section.items.forEach(item => {
          content += `• ${item}\n`;
        });
        content += `\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const filename = sanitizeFilename(`${profile.name || 'Portfolio'}_Resume.txt`);
    
    if (toDrive) {
      uploadToDrive(blob, filename, 'text/plain');
    } else {
      saveAs(blob, filename);
      uploadExportToFirebase(blob, filename);
      showNotification("TXT exported and saved to Cloud Storage!", "success");
    }
  };

  const exportAsDocx = async (toDrive = false) => {
    if (!user) {
      setShowAuthModal(true);
      showNotification("Please sign in or create an account to download your resume.", "info");
      return;
    }
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: profile.name, bold: true, size: 32 })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun({ text: profile.title, size: 24 })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun(`${profile.email} | ${profile.phone} | ${profile.location}`),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "", spacing: { before: 200 } }),
          
          ...(profile.summary ? [
            new Paragraph({ children: [new TextRun({ text: "SUMMARY", bold: true, size: 20 })], heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: profile.summary }),
            new Paragraph({ text: "" }),
          ] : []),

          ...(profile.experience?.length > 0 ? [
            new Paragraph({ children: [new TextRun({ text: "EXPERIENCE", bold: true, size: 20 })], heading: HeadingLevel.HEADING_3 }),
            ...profile.experience.flatMap(exp => [
              new Paragraph({
                children: [
                  new TextRun({ text: exp.role, bold: true }),
                  new TextRun({ text: ` | ${exp.company}`, italics: true }),
                ],
              }),
              new Paragraph({ text: exp.duration }),
              ...(Array.isArray(exp.description) 
                ? exp.description.map(bullet => new Paragraph({ 
                    children: [new TextRun({ text: `• ${bullet}` })],
                    indent: { left: 720 } 
                  }))
                : [new Paragraph({ text: exp.description })]
              ),
              new Paragraph({ text: "" }),
            ])
          ] : []),

          ...(profile.education?.length > 0 ? [
            new Paragraph({ children: [new TextRun({ text: "EDUCATION", bold: true, size: 20 })], heading: HeadingLevel.HEADING_3 }),
            ...profile.education.flatMap(edu => [
              new Paragraph({
                children: [
                  new TextRun({ text: edu.degree, bold: true }),
                  new TextRun({ text: ` | ${edu.institution}`, italics: true }),
                ],
              }),
              new Paragraph({ text: edu.year }),
              new Paragraph({ text: "" }),
            ])
          ] : []),

          ...(profile.skills?.length > 0 ? [
            new Paragraph({ children: [new TextRun({ text: "SKILLS", bold: true, size: 20 })], heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: profile.skills.join(', ') }),
            new Paragraph({ text: "" }),
          ] : []),

          ...(profile.projects?.length > 0 ? [
            new Paragraph({ children: [new TextRun({ text: "PROJECTS", bold: true, size: 20 })], heading: HeadingLevel.HEADING_3 }),
            ...profile.projects.flatMap(proj => [
              new Paragraph({ children: [new TextRun({ text: proj.title, bold: true })] }),
              new Paragraph({ text: proj.description }),
              ...(proj.techStack?.length > 0 ? [new Paragraph({ text: `Tech: ${proj.techStack.join(', ')}` })] : []),
              ...(proj.link ? [new Paragraph({ text: `Link: ${proj.link}` })] : []),
              new Paragraph({ text: "" }),
            ])
          ] : []),

          ...(profile.awards?.length > 0 ? [
            new Paragraph({ children: [new TextRun({ text: "AWARDS", bold: true, size: 20 })], heading: HeadingLevel.HEADING_3 }),
            ...profile.awards.map(award => new Paragraph({ text: `${award.title} | ${award.issuer} (${award.year})` })),
            new Paragraph({ text: "" }),
          ] : []),

          ...(profile.certifications?.length > 0 ? [
            new Paragraph({ children: [new TextRun({ text: "CERTIFICATIONS", bold: true, size: 20 })], heading: HeadingLevel.HEADING_3 }),
            ...profile.certifications.map(cert => new Paragraph({ text: `${cert.name} | ${cert.issuer} (${cert.year})` })),
            new Paragraph({ text: "" }),
          ] : []),

          ...(profile.achievements?.length > 0 ? [
            new Paragraph({ children: [new TextRun({ text: "ACHIEVEMENTS", bold: true, size: 20 })], heading: HeadingLevel.HEADING_3 }),
            ...profile.achievements.map(ach => new Paragraph({ children: [new TextRun({ text: `• ${ach}` })], indent: { left: 360 } })),
            new Paragraph({ text: "" }),
          ] : []),

          ...(profile.customSections?.length > 0 ? profile.customSections.flatMap(section => [
            new Paragraph({ children: [new TextRun({ text: section.title.toUpperCase(), bold: true, size: 20 })], heading: HeadingLevel.HEADING_3 }),
            ...section.items.map(item => new Paragraph({ children: [new TextRun({ text: `• ${item}` })], indent: { left: 360 } })),
            new Paragraph({ text: "" }),
          ]) : []),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const filename = sanitizeFilename(`${profile.name || 'Portfolio'}_Resume.docx`);
    
    if (toDrive) {
      await uploadToDrive(blob, filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } else {
      saveAs(blob, filename);
      uploadExportToFirebase(blob, filename);
      showNotification("DOCX exported and saved to Cloud Storage!", "success");
    }
  };

  const getFullHTML = (type: 'resume' | 'website') => {
    const targetId = type === 'resume' ? '#resume-capture-target' : '#website-capture-target';
    const element = document.querySelector(targetId);
    const content = element?.outerHTML || 'Content missing';
    return `
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${profile.name || 'Portfolio'} - ${type.toUpperCase()}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
    <style>
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; background: #f8fafc; display: flex; justify-content: center; padding: 2rem; }
        .font-serif { font-family: 'Playfair Display', serif; }
        #resume-container { width: 100%; max-width: 800px; min-height: 1050px; background: white; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); margin: 0 auto; padding: 3rem; }
        #website-preview-container { width: 100%; max-width: 1200px; background: white; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); border-radius: 1rem; overflow: hidden; margin: 0 auto; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`.trim();
  };

  const exportAsHTML = (type: 'resume' | 'website', toDrive = false) => {
    if (!user) {
      setShowAuthModal(true);
      showNotification("Please sign in or create an account to download your resume.", "info");
      return;
    }
    const htmlContent = getFullHTML(type);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const filename = sanitizeFilename(`${profile.name || 'portfolio'}-${type}.html`);
    
    if (toDrive) {
      uploadToDrive(blob, filename, 'text/html');
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      uploadExportToFirebase(blob, filename);
      showNotification(`${type.toUpperCase()} package ready and saved to Cloud Storage!`);
    }
  };

  const copyCode = () => {
    if (!user) {
      setShowAuthModal(true);
      showNotification("Please sign in or create an account to copy the code.", "info");
      return;
    }
    const code = getFullHTML(codeSource);
    navigator.clipboard.writeText(code);
    showNotification("Code copied to clipboard!");
  };

  if (appState === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 overflow-hidden relative">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          multiple 
          accept=".pdf,.docx,.doc,.txt,.rtf,.odt,.png,.jpg,.jpeg,.gif,.webp,image/*,video/*" 
        />
        <div className="absolute top-6 right-6 z-20">
          {user ? (
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-2 pl-4 rounded-full border border-white/10">
              <span className="text-sm font-bold text-slate-300">{user.email}</span>
              <button 
                onClick={handleSignOut}
                className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 shadow-lg"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                setAuthMode('signin');
                setShowAuthModal(true);
              }}
              className="px-6 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full font-bold hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
        <AuthModal 
          show={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
          setMode={setAuthMode}
          email={authEmail}
          setEmail={setAuthEmail}
          password={authPassword}
          setPassword={setAuthPassword}
          loading={authLoading}
          onSubmit={handleAuth}
          onGoogleSignIn={handleGoogleSignIn}
        />
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={createNewChat}
          onSwitchSession={switchSession}
          onDeleteSession={deleteSession}
          onRenameSession={renameSession}
          cloudStatus={cloudStatus}
          onManualSave={() => saveToFirebase(profile, sessions, exports)}
          exports={exports}
        />
        {showResetConfirm && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Reset Everything?</h3>
              <p className="text-slate-500 mb-8">This will permanently delete your chat history and generated profile. This action cannot be undone.</p>
              <div className="flex flex-col gap-3">
                <button onClick={clearMemory} className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">Yes, Reset Progress</button>
                <button onClick={() => setShowResetConfirm(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
              </div>
            </div>
          </div>
        )}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.15),transparent)] pointer-events-none"></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl text-center z-10"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6 inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-bold tracking-widest uppercase"
          >
            Powered by Gemini 3.1 Pro
          </motion.div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-serif font-bold mb-6 sm:mb-8 leading-tight tracking-tighter">
            {user ? (
              <>Resume your <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-300">extraordinary</span> journey.</>
            ) : (
              <>Elevate your <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-300">professional</span> story.</>
            )}
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
            {user 
              ? "Welcome back to your command center. Continue building your portfolio or start a new high-performance profile from scratch."
              : "PortfolioGenie uses high-end vision and reasoning to craft a high-performance resume and website in minutes."
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {messages.length > 0 ? (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAppState('chatting')}
                className="group w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-indigo-600 text-white text-lg sm:text-xl font-bold rounded-full hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-indigo-500/25"
              >
                Continue Current Chat
                <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startInterview}
                className="group w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white text-slate-900 text-lg sm:text-xl font-bold rounded-full hover:bg-indigo-50 transition-all flex items-center justify-center gap-4 shadow-2xl"
              >
                Start My Journey
                <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            )}

            {messages.length > 0 && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startInterview}
                className="group w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white text-slate-900 border border-slate-200 text-lg sm:text-xl font-bold rounded-full hover:bg-slate-50 transition-all flex items-center justify-center gap-4 shadow-2xl"
              >
                <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                New Journey
              </motion.button>
            )}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleQuickScan}
              className="group w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-indigo-600/20 text-white border border-indigo-500/30 text-lg sm:text-xl font-bold rounded-full hover:bg-indigo-600/30 transition-all flex items-center justify-center gap-4 shadow-2xl backdrop-blur-sm"
            >
              <Paperclip className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="truncate max-w-[200px]">
                {pendingAttachments.length > 0 
                  ? `${pendingAttachments[pendingAttachments.length - 1].name} selected`
                  : 'Quick Scan Resume'}
              </span>
            </motion.button>
            {sessions.length > 0 && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(true)}
                className="group w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-slate-800 text-white border border-slate-700 text-lg sm:text-xl font-bold rounded-full hover:bg-slate-700 transition-all flex items-center justify-center gap-4 shadow-2xl"
              >
                <History className="h-5 w-5 sm:h-6 sm:w-6" />
                View History
              </motion.button>
            )}
          </div>
        </motion.div>
        
        {/* Floating elements for dynamism */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"
              animate={{
                x: [Math.random() * 1000, Math.random() * 1000],
                y: [Math.random() * 1000, Math.random() * 1000],
              }}
              transition={{
                duration: 20 + Math.random() * 20,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (appState === 'chatting') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          multiple 
          accept=".pdf,.docx,.doc,.txt,.rtf,.odt,.png,.jpg,.jpeg,.gif,.webp,image/*,video/*" 
        />
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={createNewChat}
          onSwitchSession={switchSession}
          onDeleteSession={deleteSession}
          onRenameSession={renameSession}
          cloudStatus={cloudStatus}
          onManualSave={() => saveToFirebase(profile, sessions, exports)}
          exports={exports}
        />
        <AuthModal 
          show={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
          setMode={setAuthMode}
          email={authEmail}
          setEmail={setAuthEmail}
          password={authPassword}
          setPassword={setAuthPassword}
          loading={authLoading}
          onSubmit={handleAuth}
          onGoogleSignIn={handleGoogleSignIn}
        />
        {showResetConfirm && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Reset Everything?</h3>
              <p className="text-slate-500 mb-8">This will permanently delete your chat history and generated profile. This action cannot be undone.</p>
              <div className="flex flex-col gap-3">
                <button onClick={clearMemory} className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">Yes, Reset Progress</button>
                <button onClick={() => setShowResetConfirm(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
              </div>
            </div>
          </div>
        )}
        <header className="bg-white border-b px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="History"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
            </button>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg">P</div>
            <div className="hidden xs:block">
              <h2 className="font-bold text-slate-900 leading-none text-sm sm:text-base">PortfolioGenie</h2>
              <span className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-black">AI Career Architect</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={createNewChat}
              className="p-2 sm:px-4 sm:py-2 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-xl transition-all text-sm font-bold flex items-center gap-2 shadow-sm hover:shadow-md hover:shadow-indigo-100 active:scale-95"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <button 
              onClick={saveCurrentChatToCloud}
              className="p-2 sm:px-4 sm:py-2 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-sm font-bold flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95"
              title="Save History"
            >
              <Save className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">Save History</span>
            </button>
            <button 
              onClick={() => setShowResetConfirm(true)} 
              className="p-2 sm:px-4 sm:py-2 text-slate-400 hover:text-rose-500 transition-colors text-sm font-bold flex items-center gap-2"
              title="Reset"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button 
              onClick={generatePreview}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm"
              disabled={messages.length < 2 || isTyping}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden xs:inline">Generate</span>
              <span className="hidden sm:inline">Magic</span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{user.email}</div>
                  <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Cloud Saved</div>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="px-3 sm:px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs sm:text-sm hover:bg-indigo-100 transition-all active:scale-95 flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4" />
                <span className="hidden xs:inline">Sign In</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 overflow-y-auto pt-12 pb-32">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-8`}
              >
                <div className={`max-w-[85%] rounded-3xl p-6 ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-xl' : 'bg-white text-slate-800 rounded-tl-none shadow-sm border border-slate-100'}`}>
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {m.attachments.map((att, idx) => (
                        <div key={idx} className="bg-slate-900/10 p-2 rounded-lg text-xs flex items-center gap-2">
                          {att.mimeType.startsWith('image/') ? (
                            <img src={`data:${att.mimeType};base64,${att.data}`} className="w-12 h-12 object-cover rounded shadow-sm" alt="upload" />
                          ) : att.mimeType === 'application/pdf' ? (
                            <div className="w-12 h-12 bg-red-500 rounded flex items-center justify-center text-white font-black text-xs">PDF</div>
                          ) : att.mimeType.includes('word') ? (
                            <div className="w-12 h-12 bg-blue-500 rounded flex items-center justify-center text-white font-black text-xs">DOC</div>
                          ) : (
                            <div className="w-12 h-12 bg-indigo-500 rounded flex items-center justify-center text-white font-black text-xs">TEXT</div>
                          )}
                          <span className="max-w-[100px] truncate">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">{m.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start mb-8"
            >
              <div className="bg-white p-4 rounded-3xl rounded-tl-none shadow-sm border border-slate-100 flex gap-2 items-center">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
                </div>
                <span className="text-xs font-bold text-slate-400 tracking-widest uppercase ml-2">{thinkingMode ? 'Deep Reasoning...' : 'Processing...'}</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <footer className="bg-white/80 backdrop-blur-md border-t p-4 sm:p-6 sticky bottom-0 z-20">
          {pendingAttachments.length > 0 && (
            <div className="max-w-4xl mx-auto mb-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {pendingAttachments.map((att, idx) => (
                <div key={idx} className="group relative bg-indigo-50 border border-indigo-100 p-2 pl-3 pr-8 rounded-xl flex items-center gap-2 shadow-sm">
                  {att.mimeType.startsWith('image/') ? (
                    <img src={`data:${att.mimeType};base64,${att.data}`} className="w-6 h-6 object-cover rounded shadow-sm" alt="pending" />
                  ) : att.mimeType === 'application/pdf' ? (
                    <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-[8px] text-white font-black italic">PDF</div>
                  ) : att.mimeType.includes('word') ? (
                    <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-[8px] text-white font-black italic">DOC</div>
                  ) : (
                    <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-[8px] text-white font-black italic">TEXT</div>
                  )}
                  <span className="text-xs font-bold text-indigo-700 truncate max-w-[120px]">{att.name}</span>
                  <button 
                    onClick={() => removeAttachment(idx)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="max-w-4xl mx-auto mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative flex items-center w-full sm:w-auto gap-2">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className={`flex items-center gap-2 font-bold text-xs sm:text-sm transition-all px-3 py-1.5 rounded-lg border ${
                  pendingAttachments.length > 0 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                  : 'text-slate-500 hover:text-indigo-600 border-slate-200 hover:border-indigo-200'
                }`}
              >
                <Paperclip className={`w-4 h-4 sm:w-5 sm:h-5 ${pendingAttachments.length > 0 ? 'text-indigo-600' : 'text-indigo-500'}`} />
                <span className="xs:inline truncate max-w-[150px]">
                  {pendingAttachments.length > 0 
                    ? `${pendingAttachments[pendingAttachments.length - 1].name}${pendingAttachments.length > 1 ? ` (+${pendingAttachments.length - 1})` : ''}`
                    : 'Attach Documents'}
                </span>
              </button>
              
              {pendingAttachments.length > 0 && (
                <button 
                  onClick={() => setPendingAttachments([])}
                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                  title="Clear All Attachments"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              
              <button 
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="pl-2 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Cloud Options"
              >
                <Cloud className="w-4 h-4" />
              </button>
              
              {showAttachMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                  <button 
                    onClick={openGooglePicker}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <Cloud className="w-4 h-4 text-blue-500" />
                    Google Drive
                  </button>
                  <button 
                    onClick={openOneDrivePicker}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <Cloud className="w-4 h-4 text-indigo-500" />
                    OneDrive
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <span className={`text-[10px] sm:text-xs font-bold uppercase transition-colors ${thinkingMode ? 'text-indigo-600' : 'text-slate-400'}`}>Deep Reasoning</span>
              <button onClick={() => setThinkingMode(!thinkingMode)} className={`w-8 h-4 sm:w-10 sm:h-5 rounded-full relative transition-colors ${thinkingMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 sm:top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${thinkingMode ? 'left-4 sm:left-6' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-2 sm:gap-4">
            <input 
              type="text" 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              placeholder="Tell me about your journey..." 
              className="flex-1 bg-slate-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 focus:ring-2 focus:ring-indigo-500 outline-none text-base sm:text-lg transition-all"
              disabled={isTyping}
            />
            <button 
              type="submit" 
              className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-indigo-700 shadow-lg active:scale-95 transition-all disabled:opacity-50 shrink-0" 
              disabled={isTyping || (!inputText.trim() && pendingAttachments.length === 0)}
            >
              <Send className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </form>
        </footer>
      </div>
    );
  }

  if (appState === 'preview') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          multiple 
          accept=".pdf,.docx,.doc,.txt,.rtf,.odt,.png,.jpg,.jpeg,.gif,.webp,image/*,video/*" 
        />
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={createNewChat}
          onSwitchSession={switchSession}
          onDeleteSession={deleteSession}
          onRenameSession={renameSession}
          cloudStatus={cloudStatus}
          onManualSave={() => saveToFirebase(profile, sessions, exports)}
          exports={exports}
        />
        <AuthModal 
          show={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
          setMode={setAuthMode}
          email={authEmail}
          setEmail={setAuthEmail}
          password={authPassword}
          setPassword={setAuthPassword}
          loading={authLoading}
          onSubmit={handleAuth}
          onGoogleSignIn={handleGoogleSignIn}
        />
        {showResetConfirm && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Reset Everything?</h3>
              <p className="text-slate-500 mb-8">This will permanently delete your chat history and generated profile. This action cannot be undone.</p>
              <div className="flex flex-col gap-3">
                <button onClick={clearMemory} className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">Yes, Reset Progress</button>
                <button onClick={() => setShowResetConfirm(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
              </div>
            </div>
          </div>
        )}
        {showToast && (
          <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[100] animate-bounce font-bold text-sm ${
            showToast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
          }`}>
            {showToast.message}
          </div>
        )}

        {(isGeneratingPDF || isCapturingImage) && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center">
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {isGeneratingPDF ? 'Architecting PDF' : 'Capturing Social Preview'}
              </h3>
              <p className="text-slate-500">Normalizing layouts and rendering assets.</p>
            </div>
          </div>
        )}

        <header className="bg-white border-b px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-[100] no-print gap-4 shadow-sm">
          <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
               title="History"
             >
               <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
             </button>
             <button onClick={() => setAppState('chatting')} className="text-slate-400 hover:text-slate-900 transition-colors shrink-0" title="Back to Chat">
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
             </button>
             <div className="h-6 w-px bg-slate-200 hidden xs:block shrink-0"></div>
             <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar flex-1 max-w-md sm:max-w-xl lg:max-w-3xl">
             <button onClick={() => setPreviewTab('resume')} className={`px-3 sm:px-6 py-2 rounded-lg text-[10px] sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 shrink-0 ${previewTab === 'resume' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
               <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
               <span className="truncate">Resume</span>
             </button>
             <button onClick={() => setPreviewTab('website')} className={`px-3 sm:px-6 py-2 rounded-lg text-[10px] sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 shrink-0 ${previewTab === 'website' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
               <Layout className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
               <span className="truncate">Website</span>
             </button>
             <button onClick={() => setPreviewTab('design')} className={`px-3 sm:px-6 py-2 rounded-lg text-[10px] sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 shrink-0 ${previewTab === 'design' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
               <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
               <span className="truncate">Design</span>
             </button>
             <button onClick={() => setPreviewTab('edit')} className={`px-3 sm:px-6 py-2 rounded-lg text-[10px] sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 shrink-0 ${previewTab === 'edit' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
               <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
               <span className="truncate">Edit</span>
             </button>
             <button onClick={() => { setPreviewTab('code'); setCodeSource('website'); }} className={`px-3 sm:px-6 py-2 rounded-lg text-[10px] sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 shrink-0 ${previewTab === 'code' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
               <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
               <span className="truncate">Code</span>
             </button>
             <button onClick={() => setPreviewTab('export')} className={`px-3 sm:px-6 py-2 rounded-lg text-[10px] sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 shrink-0 ${previewTab === 'export' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
               <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
               <span className="truncate">Dashboard</span>
             </button>
          </div>
       </div>

       <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="p-2 sm:px-4 sm:py-2 text-slate-400 hover:text-rose-500 transition-colors text-sm font-bold flex items-center gap-2"
            title="Reset"
          >
             <Trash2 className="w-4 h-4" />
             <span className="hidden sm:inline">Reset</span>
          </button>

          <button 
            onClick={handleShare} 
            disabled={isSharing}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold transition-all text-xs sm:text-sm ${isSharing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200'}`}
          >
                <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSharing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isSharing ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  )}
                </svg>
                <span>{isSharing ? 'Copying...' : 'Share'}</span>
                <span className="hidden sm:inline">{isSharing ? '' : ' Profile'}</span>
             </button>

             <div className="h-8 w-px bg-slate-200 mx-1 hidden lg:block"></div>
             
             {user ? (
               <div className="flex items-center gap-3">
                 <div className="hidden lg:block text-right">
                   <div className="text-[10px] font-bold text-slate-900 truncate max-w-[100px]">{user.email}</div>
                   <div className="text-[8px] text-indigo-600 font-bold uppercase tracking-wider">Cloud Saved</div>
                 </div>
                 <button 
                   onClick={handleSignOut}
                   className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                   title="Sign Out"
                 >
                   <LogOut className="w-5 h-5" />
                 </button>
               </div>
             ) : (
               <button 
                 onClick={() => setShowAuthModal(true)}
                 className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                 title="Sign In"
               >
                 <UserIcon className="w-5 h-5" />
               </button>
             )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-smooth p-4 md:p-12 flex flex-col items-center relative">
          <div className="absolute opacity-0 pointer-events-none -z-50 overflow-hidden" style={{ width: pdfSettings.orientation === 'landscape' ? (pdfSettings.format === 'a4' ? '1131px' : '1035px') : '800px', height: '0' }}>
            <div id="resume-capture-target" className="bg-white" style={{ width: '100%' }}>
              <ResumePreview profile={profile} onShare={handleShare} settings={pdfSettings} />
            </div>
            <div id="website-capture-target" className="bg-white" style={{ width: '100%' }}>
              <WebsitePreview profile={profile} onShare={handleShare} isDarkMode={websiteDarkMode} />
            </div>
          </div>

          {previewTab === 'resume' && (
            <div className="animate-in fade-in zoom-in duration-500 w-full overflow-x-auto pb-8 no-scrollbar">
              <div className="min-w-[320px] max-w-[800px] mx-auto">
                <ResumePreview profile={profile} onAddSkill={handleAddSkill} onShare={handleShare} settings={pdfSettings} />
              </div>
            </div>
          )}
          
          {previewTab === 'website' && (
            <div className="w-full max-w-[1200px] shadow-2xl rounded-2xl overflow-hidden border border-slate-200 bg-white animate-in slide-in-from-bottom-8 duration-500">
              <WebsitePreview profile={profile} onShare={handleShare} isDarkMode={websiteDarkMode} />
            </div>
          )}

          {previewTab === 'code' && (
            <div className="w-full max-w-5xl bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
              <div className="bg-[#2d2d2d] px-6 py-4 flex justify-between items-center border-b border-white/5">
                <div className="flex gap-4 items-center">
                  <div className="flex gap-1.5 mr-4">
                    <div className="w-3 h-3 bg-[#ff5f56] rounded-full"></div>
                    <div className="w-3 h-3 bg-[#ffbd2e] rounded-full"></div>
                    <div className="w-3 h-3 bg-[#27c93f] rounded-full"></div>
                  </div>
                  <div className="flex bg-white/5 p-1 rounded-lg">
                    <button onClick={() => setCodeSource('website')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${codeSource === 'website' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>Website.html</button>
                    <button onClick={() => setCodeSource('resume')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${codeSource === 'resume' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>Resume.html</button>
                  </div>
                </div>
                <button onClick={copyCode} className="text-white/60 hover:text-white flex items-center gap-2 text-xs font-bold transition-all active:scale-95 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy Code
                </button>
              </div>
              <div className="p-8 overflow-x-auto max-h-[70vh]">
                <pre className="font-mono text-xs md:text-sm text-indigo-300 whitespace-pre-wrap selection:bg-indigo-500/40">
                  <code>{getFullHTML(codeSource)}</code>
                </pre>
              </div>
            </div>
          )}

          {previewTab === 'design' && (
            <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                  <Palette className="w-6 h-6 text-indigo-600" />
                  Theme Customization
                </h2>

                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest">Primary Theme Color</label>
                      <div className="flex flex-wrap gap-4">
                        {['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#1e293b'].map(color => (
                          <button
                            key={color}
                            onClick={() => setProfile(p => ({ ...p, themeColor: color }))}
                            className={`w-12 h-12 rounded-full border-4 transition-all hover:scale-110 ${
                              profile.themeColor === color ? 'border-indigo-200 scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <div className="relative group">
                          <input 
                            type="color" 
                            value={profile.themeColor}
                            onChange={(e) => setProfile(p => ({ ...p, themeColor: e.target.value }))}
                            className="w-12 h-12 rounded-full border-4 border-transparent cursor-pointer opacity-0 absolute inset-0 z-10"
                          />
                          <div 
                            className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-50 transition-all"
                            style={{ backgroundColor: profile.themeColor }}
                          >
                            <Plus className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest">Typography Style</label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['sans', 'serif', 'mono'] as const).map(font => (
                          <button
                            key={font}
                            onClick={() => setProfile(p => ({ ...p, fontFamily: font }))}
                            className={`py-3 rounded-xl border-2 transition-all font-bold capitalize ${
                              profile.fontFamily === font 
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                                : 'border-slate-100 text-slate-500 hover:border-slate-200'
                            }`}
                            style={{ fontFamily: font === 'sans' ? 'Inter' : font === 'serif' ? 'Playfair Display' : 'JetBrains Mono' }}
                          >
                            {font}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest">Resume Template</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['modern', 'classic', 'minimal', 'sidebar', 'technical', 'creative', 'executive', 'academic', 'functional'] as const).map(template => (
                          <button
                            key={template}
                            onClick={() => setProfile(p => ({ ...p, resumeTemplate: template }))}
                            className={`py-3 rounded-xl border-2 transition-all font-bold capitalize ${
                              profile.resumeTemplate === template 
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                                : 'border-slate-100 text-slate-500 hover:border-slate-200'
                            }`}
                          >
                            {template}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest">Website Template</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['modern', 'bento', 'minimal', 'creative', 'terminal', 'magazine', 'sidebar', 'portfolio', 'startup', 'minimalist'] as const).map(template => (
                          <button
                            key={template}
                            onClick={() => setProfile(p => ({ ...p, websiteTemplate: template }))}
                            className={`py-3 rounded-xl border-2 transition-all font-bold capitalize ${
                              profile.websiteTemplate === template 
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                                : 'border-slate-100 text-slate-500 hover:border-slate-200'
                            }`}
                          >
                            {template}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest">Website Mode</label>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button 
                          onClick={() => setWebsiteDarkMode(false)} 
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${!websiteDarkMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          Light
                        </button>
                        <button 
                          onClick={() => setWebsiteDarkMode(true)} 
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${websiteDarkMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                          Dark
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest">Quick Presets</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setProfile(p => ({ ...p, themeColor: '#4f46e5' }))}
                          className="p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all text-left group"
                        >
                          <div className="w-8 h-8 bg-indigo-600 rounded-lg mb-2 group-hover:scale-110 transition-transform"></div>
                          <span className="text-sm font-bold text-slate-900">Modern Indigo</span>
                        </button>
                        <button 
                          onClick={() => setProfile(p => ({ ...p, themeColor: '#1e293b' }))}
                          className="p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all text-left group"
                        >
                          <div className="w-8 h-8 bg-slate-800 rounded-lg mb-2 group-hover:scale-110 transition-transform"></div>
                          <span className="text-sm font-bold text-slate-900">Midnight Slate</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-8 flex flex-col items-center justify-center text-center border border-slate-100">
                    <div className="w-24 h-24 rounded-full mb-6 shadow-xl animate-pulse" style={{ backgroundColor: profile.themeColor }}></div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Live Preview</h3>
                    <p className="text-sm text-slate-500 max-w-[200px]">Your selected color will be applied across headers, buttons, and accents in both resume and website.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewTab === 'edit' && (
            <ManualEdit 
              profile={profile} 
              onSave={async (newProfile) => {
                setProfile(newProfile);
                await handleManualCloudSave(); // This handles both database sync and PDF storage backup
                setPreviewTab('resume');
              }}
              onCancel={() => setPreviewTab('resume')}
            />
          )}

          {previewTab === 'export' && (
            <div className="w-full max-w-6xl flex flex-col gap-8 animate-in slide-in-from-right-8 duration-500">
              <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Cloud Backup</h3>
                  <p className="text-sm text-slate-500">Save your current progress to your personal Storage bucket.</p>
                </div>
                <button 
                  onClick={handleManualCloudSave}
                  disabled={isGeneratingPDF}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {!user && <Lock className="w-4 h-4 mr-0.5 opacity-70" />}
                  {isGeneratingPDF ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                  {isGeneratingPDF ? 'Backing up...' : 'Save to Storage'}
                </button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* PDF Export Card */}
                <div className="group bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all flex flex-col">
                  <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-4">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">PDF Document</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">Professional, print-ready PDF format.</p>
                  <button 
                    onClick={() => handleExportClick('pdf')}
                    className="mt-auto w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview & Export
                  </button>
                </div>

                {/* DOCX Export Card */}
                <div className="group bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all flex flex-col">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <FileDown className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Word (DOCX)</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">Editable Microsoft Word document.</p>
                  <button 
                    onClick={() => handleExportClick('docx')}
                    className="mt-auto w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview & Export
                  </button>
                </div>

                {/* TXT Export Card */}
                <div className="group bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all flex flex-col">
                  <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-4">
                    <Type className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Plain Text</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">Clean text format for ATS systems.</p>
                  <button 
                    onClick={() => handleExportClick('txt')}
                    className="mt-auto w-full py-2.5 bg-slate-600 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview & Export
                  </button>
                </div>

                {/* HTML Export Card */}
                <div className="group bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all flex flex-col">
                  <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center mb-4">
                    <Code className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">HTML Website</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">Standalone portfolio website file.</p>
                  <button 
                    onClick={() => handleExportClick('html')}
                    className="mt-auto w-full py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-bold hover:bg-cyan-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview & Export
                  </button>
                </div>
              </div>

              {/* Cloud Storage Section */}
              <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Cloud Storage</h3>
                  </div>
                  {isGoogleConnected && (
                    <button 
                      onClick={handleGoogleLogout}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 uppercase tracking-widest"
                    >
                      Disconnect
                    </button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${isGoogleConnected ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isGoogleConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.5,2L20.42,15.83L15.67,24H4.33L9.17,15.83L12.5,2M12,4L10.3,7.11L15.3,15.83L17,13L12,4M8.1,15.83L5.5,20.33H14.5L17.1,15.83H8.1Z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Google Drive</h4>
                        <p className="text-xs text-slate-500">{isGoogleConnected ? 'Connected & Ready' : 'Save resumes directly to Drive'}</p>
                      </div>
                    </div>
                    {!isGoogleConnected ? (
                      <button 
                        onClick={handleGoogleConnect}
                        className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                      >
                        Connect
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xs font-bold">Active</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 rounded-3xl border-2 border-slate-50 opacity-50 cursor-not-allowed flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center">
                        <Cloud className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-400">OneDrive</h4>
                        <p className="text-xs text-slate-400">Coming Soon</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Settings Panel */}
              <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                    <Palette className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">PDF & HTML Settings</h3>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Export Source</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button onClick={() => setPdfSettings(s => ({ ...s, source: 'resume' }))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${pdfSettings.source === 'resume' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Resume</button>
                      <button onClick={() => setPdfSettings(s => ({ ...s, source: 'website' }))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${pdfSettings.source === 'website' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Website</button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Page Format</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button onClick={() => setPdfSettings(s => ({ ...s, format: 'letter' }))} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${pdfSettings.format === 'letter' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Letter</button>
                      <button onClick={() => setPdfSettings(s => ({ ...s, format: 'a4' }))} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${pdfSettings.format === 'a4' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>A4</button>
                      <button onClick={() => setPdfSettings(s => ({ ...s, format: 'fit' }))} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${pdfSettings.format === 'fit' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Fit</button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Orientation</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button onClick={() => setPdfSettings(s => ({ ...s, orientation: 'portrait' }))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${pdfSettings.orientation === 'portrait' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Portrait</button>
                      <button onClick={() => setPdfSettings(s => ({ ...s, orientation: 'landscape' }))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${pdfSettings.orientation === 'landscape' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Landscape</button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Font Size</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button onClick={() => setPdfSettings(s => ({ ...s, fontSize: 'small' }))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${pdfSettings.fontSize === 'small' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Small</button>
                      <button onClick={() => setPdfSettings(s => ({ ...s, fontSize: 'medium' }))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${pdfSettings.fontSize === 'medium' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Medium</button>
                      <button onClick={() => setPdfSettings(s => ({ ...s, fontSize: 'large' }))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${pdfSettings.fontSize === 'large' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Large</button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Margins</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button onClick={() => setPdfSettings(s => ({ ...s, margin: 'none' }))} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${pdfSettings.margin === 'none' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>None</button>
                      <button onClick={() => setPdfSettings(s => ({ ...s, margin: 'small' }))} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${pdfSettings.margin === 'small' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Small</button>
                      <button onClick={() => setPdfSettings(s => ({ ...s, margin: 'normal' }))} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${pdfSettings.margin === 'normal' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Normal</button>
                      <button onClick={() => setPdfSettings(s => ({ ...s, margin: 'large' }))} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${pdfSettings.margin === 'large' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Large</button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">
                    <strong>Pro Tip:</strong> Use the "Preview & Export" button to review your content before downloading. For DOCX and TXT, we automatically format your profile for maximum ATS compatibility.
                  </p>
                </div>
              </div>

              {/* Cloud Dashboard - Recent Exports */}
              <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">My Cloud Dashboard</h3>
                      <p className="text-xs text-slate-500">Access and download your previously generated documents.</p>
                    </div>
                  </div>
                  <div className="bg-indigo-50 px-3 py-1 rounded-full">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{exports.length} Saved Files</span>
                  </div>
                </div>

                {exports.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exports.map((exp, idx) => (
                      <div key={idx} className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-xl transition-all h-full flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            exp.type.toLowerCase() === 'pdf' ? 'bg-rose-50 text-rose-600' : 
                            exp.type.toLowerCase() === 'docx' ? 'bg-blue-50 text-blue-600' : 
                            'bg-indigo-50 text-indigo-600'
                          }`}>
                            {exp.type.toLowerCase() === 'pdf' ? <FileText className="w-5 h-5" /> : 
                             exp.type.toLowerCase() === 'docx' ? <FileDown className="w-5 h-5" /> : 
                             <Clock className="w-5 h-5" />}
                          </div>
                          <a 
                            href={exp.url} 
                            download={exp.name}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-100 hover:border-indigo-100 shadow-sm transition-all"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm truncate mb-1" title={exp.name}>{exp.name}</h4>
                        <div className="flex items-center gap-2 mt-auto">
                          <span className="text-[10px] text-slate-400 font-medium">Archived on {new Date(exp.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <CloudOff className="w-8 h-8 text-slate-300" />
                    </div>
                    <h4 className="font-bold text-slate-600">No cloud files found</h4>
                    <p className="text-xs text-slate-400 max-w-[200px] mx-auto mt-1">Generate and export your first document to see it here!</p>
                  </div>
                )}
              </div>

              {/* Social Image Card */}
              <div className="group bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Social Ready</div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Social Preview Asset</h3>
                <p className="text-slate-400 mb-8 leading-relaxed relative z-10">A high-impact snapshot of your identity optimized for LinkedIn, Twitter, or Instagram sharing.</p>
                
                <button 
                  onClick={exportAsImage}
                  disabled={isCapturingImage}
                  className="mt-auto w-full py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 relative z-10"
                >
                  {isCapturingImage ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                  {isCapturingImage ? 'Capturing...' : 'Generate Social Snapshot'}
                </button>
              </div>
            </div>
          )}
        </main>
        <ExportPreviewModal 
          show={showExportPreview}
          onClose={() => setShowExportPreview(false)}
          format={exportFormat}
          profile={profile}
          pdfSettings={pdfSettings}
          websiteDarkMode={websiteDarkMode}
          isGoogleConnected={isGoogleConnected}
          isGeneratingPDF={isGeneratingPDF}
          isUploadingToDrive={isUploadingToDrive}
          onGoogleConnect={handleGoogleConnect}
          onExportPDF={exportAsPDF}
          onExportDocx={exportAsDocx}
          onExportTxt={exportAsTxt}
          onExportHTML={exportAsHTML}
          onSaveToCloud={handleSavePreviewToCloud}
          user={user}
        />
      </div>
    );
  }

  return null;
};

export default App;
