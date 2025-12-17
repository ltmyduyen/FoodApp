// importData.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import fs from "fs";
import crypto from "crypto";

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
  measurementId: "G-4D8VPKJGB9",
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
// 🕒 Helper: convert createdAt -> Firestore Timestamp
// =========================
function toTimestamp(value) {
  if (!value) return null;

  // Nếu đã là Timestamp (hiếm khi trong JSON) thì trả về luôn
  if (value instanceof Timestamp) return value;

  // Nếu là Date object
  if (value instanceof Date) return Timestamp.fromDate(value);

  // Nếu là number (millis)
  if (typeof value === "number") return Timestamp.fromMillis(value);

  // Nếu là string ISO
  if (typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return Timestamp.fromDate(d);
  }

  // Không parse được
  return null;
}

// =========================
// 🧼 Chuẩn hoá dữ liệu theo collection
// =========================
function normalizeDoc(collectionName, item) {
  // clone tránh mutate
  const docData = { ...item };

  // ✅ RULE CHUNG: nếu có createdAt trong file -> convert sang Timestamp
  // Nếu không có -> tuỳ collection mà set now hay bỏ
  if ("createdAt" in docData) {
    const ts = toTimestamp(docData.createdAt);
    if (ts) docData.createdAt = ts;
    else delete docData.createdAt; // tránh rác string lỗi
  }

  // ✅ Orders: convert items[].createdAt luôn
  if (collectionName === "orders") {
    if (Array.isArray(docData.items)) {
      docData.items = docData.items.map((it) => {
        const it2 = { ...it };
        if ("createdAt" in it2) {
          const ts = toTimestamp(it2.createdAt);
          if (ts) it2.createdAt = ts;
          else delete it2.createdAt;
        }
        return it2;
      });
    }
  }

  // ✅ Nếu doc KHÔNG có createdAt thì set now cho foods/branches/drones (tuỳ bạn)
  // Còn orders thì KHÔNG set now, vì bạn cần đúng lịch 3 tháng.
  if (!("createdAt" in docData)) {
    if (collectionName !== "orders") {
      docData.createdAt = Timestamp.fromDate(new Date());
    }
  }

  return docData;
}

// =========================
// 🚀 4. Hàm import 1 collection
// =========================
async function importCollection(collectionName, data, prefix = "") {
  console.log(`📂 Import ${data.length} document vào "${collectionName}"...`);
  let i = 1;

  for (const item of data) {
    const id = item.id || (prefix ? makeId(prefix, i) : undefined);
    const docId = id || crypto.randomUUID();

    const docData = normalizeDoc(collectionName, item);

    await setDoc(doc(db, collectionName, docId), docData);

    console.log(
      `✅ [${collectionName}] thêm: ${docId} - ${item.name || item.email || item.orderCode || ""}`
    );
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
  const orders = loadJSON("./orders.json");

  console.log("🚀 Bắt đầu import toàn bộ dữ liệu...\n");

  await importCollection("foods", foods, "F");
  await importCollection("branches", branches, "B");
  await importCollection("drones", drones, "D");

  // ✅ Orders: giữ createdAt theo file (10-11-12)
  await importCollection("orders", orders, "O");

  console.log("🏁 Tất cả collection đã import xong!");
}

run().catch(console.error);
