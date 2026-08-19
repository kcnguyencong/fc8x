import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// Cấu hình Firebase - sử dụng biến môi trường (Environment Variables) khi deploy Vercel
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://fc8x-quy-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Khởi tạo app
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const CLUB_DATA_REF = ref(db, 'club-data');

// Storage abstraction tương thích với code hiện tại
window.storage = {
  async get(key, shared) {
    const cached = localStorage.getItem(key);
    return cached ? { value: cached } : null;
  },
  async set(key, value, shared) {
    localStorage.setItem(key, value);
    window.dispatchEvent(new CustomEvent('club-data-changed', { detail: value }));

    try {
      await set(CLUB_DATA_REF, JSON.parse(value));
    } catch (e) {
      console.warn("Lỗi lưu Firebase (dùng fallback localStorage):", e);
    }
    return true;
  }
};

// Lắng nghe dữ liệu realtime thay đổi từ Cloud Firebase
onValue(CLUB_DATA_REF, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    const stringified = JSON.stringify(data);
    localStorage.setItem('club-data', stringified);
    window.dispatchEvent(new CustomEvent('club-data-changed', { detail: stringified }));
  }
});
