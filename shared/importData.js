// importData.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

// 1. đọc file JSON
const raw = fs.readFileSync("./foods.json", "utf-8");
const foods = JSON.parse(raw);

// 2. CẤU HÌNH FIREBASE của bạn (dán config thật vào đây)
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

function makeId(index) {
  // index = 1 -> F01, 2 -> F02, 10 -> F10
  return `F${String(index).padStart(2, "0")}`;
}

async function run() {
  console.log("📦 Bắt đầu import", foods.length, "món...");

  let i = 1;
  for (const item of foods) {
    const id = makeId(i);

    await setDoc(doc(db, "foods", id), {
      ...item,
      code: id,
      createdAt: new Date(),
    });

    console.log("✅ đã thêm:", id, item.name);
    i++;
  }

  console.log("🎉 xong!");
}

run().catch(console.error);
