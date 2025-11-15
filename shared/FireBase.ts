// ===============================
// 🔥 Firebase config cho toàn app
// ===============================
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ✅ Cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyCzYg1Di5hS48SDnw2VtxPwtOPV6iMmDeg",
  authDomain: "foodapp-30765.firebaseapp.com",
  projectId: "foodapp-30765",
  storageBucket: "foodapp-30765.firebasestorage.app",
  messagingSenderId: "1060177711103",
  appId: "1:1060177711103:web:c82bea8b120b22d72461ca",
  measurementId: "G-4D8VPKJGB9"
};
// ✅ Khởi tạo app & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
