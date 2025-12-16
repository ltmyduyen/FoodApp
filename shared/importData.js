// importData.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

// =========================
// 🔧 1. Cấu hình Firebase
// =========================
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

// =========================
// 📦 2. Hàm đọc file JSON
// =========================
function loadJSON(path) {
  try {
    const raw = fs.readFileSync(path, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Không thể đọc file: ${path}`, err);
    process.exit(1);
  }
}

// =========================
// 🧩 3. Hàm sinh mã ID
// =========================
function makeId(prefix, index) {
  return `${prefix}${String(index).padStart(2, "0")}`;
}

// =========================
// 🚀 4. Hàm import 1 collection
// =========================
async function importCollection(collectionName, data, prefix = "") {
  console.log(`📂 Import ${data.length} document vào "${collectionName}"...`);
  let i = 1;
  for (const item of data) {
    const id = item.id || (prefix ? makeId(prefix, i) : undefined);
    await setDoc(doc(db, collectionName, id || crypto.randomUUID()), {
      ...item,
      createdAt: new Date()
    });
    console.log(`✅ [${collectionName}] thêm: ${id || "(auto-ID)"} - ${item.name || item.email || ""}`);
    i++;
  }
  console.log(`🎉 Hoàn tất "${collectionName}"!\n`);
}

// =========================
// 🧠 5. Chạy import
// =========================
async function run() {
  const foods = loadJSON("./foods.json");
  const branches = loadJSON("./restaurants.json"); // hoặc branches.json
  const drones = loadJSON("./drones.json");

  console.log("🚀 Bắt đầu import toàn bộ dữ liệu...\n");

  await importCollection("foods", foods, "F");
  await importCollection("branches", branches, "B");
  await importCollection("drones", drones, "D");

  console.log("🏁 Tất cả collection đã import xong!");
}

run().catch(console.error);
