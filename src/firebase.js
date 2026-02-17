import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuration Firebase
// En production (Vercel), utilise les variables d'environnement
// En local, utilise les valeurs directes
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBCs8NEqVhBEupD48_FkABzywF6ZH1d9i4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "intellectionclasseboard-v2-u.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "intellectionclasseboard-v2-u",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "intellectionclasseboard-v2-u.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "759135350022",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:759135350022:web:7c2160c569762fbd790287"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export it
export const db = getFirestore(app);

// Initialize Storage and export it
export const storage = getStorage(app);