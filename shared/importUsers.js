// importUsers.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

// 1. đọc file JSON
const raw = fs.readFileSync("./users.json", "utf-8");
const users = JSON.parse(raw);

// 2. CẤU HÌNH FIREBASE của bạn (giống file importData.js)
const firebaseConfig = {
  apiKey: "AIzaSyCzYg1Di5hS48SDnw2VtxPwtOPV6iMmDeg",
  authDomain: "foodapp-30765.firebaseapp.com",
  projectId: "foodapp-30765",
  storageBucket: "foodapp-30765.firebasestorage.app",
  messagingSenderId: "1060177711103",
  appId: "1:1060177711103:web:c82bea8b120b22d72461ca",
  measurementId: "G-4D8VPKJGB9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("📦 Bắt đầu import", users.length, "user...");

  for (const u of users) {
    const { id, ...data } = u;

    await setDoc(doc(db, "users", id), {
      ...data,
      createdAt: new Date()
    });

    console.log("✅ đã thêm user:", id, data.email);
  }

  console.log("🎉 xong!");
}

run().catch(console.error);
