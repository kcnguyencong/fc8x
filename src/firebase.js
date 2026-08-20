import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

let CLUB_DATA_REF = null;

try {
  if (firebaseConfig.databaseURL || firebaseConfig.projectId) {
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    CLUB_DATA_REF = ref(db, 'club-data');

    onValue(CLUB_DATA_REF, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const stringified = JSON.stringify(data);
        localStorage.setItem('club-data', stringified);
        window.dispatchEvent(new CustomEvent('club-data-changed', { detail: stringified }));
      }
    });
  }
} catch (err) {
  console.warn("Firebase initialization skipped/failed:", err);
}

window.storage = {
  async get(key, shared) {
    try {
      const cached = localStorage.getItem(key);
      return cached ? { value: cached } : null;
    } catch {
      return null;
    }
  },
  async set(key, value, shared) {
    try {
      localStorage.setItem(key, value);
      window.dispatchEvent(new CustomEvent('club-data-changed', { detail: value }));

      if (CLUB_DATA_REF) {
        await set(CLUB_DATA_REF, JSON.parse(value));
      }
    } catch (e) {
      console.warn("Storage set error:", e);
    }
    return true;
  }
};

