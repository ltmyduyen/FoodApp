// ===============================
// 🔥 IMPORT DATA BRANCHFOODS TỰ ĐỘNG
// ===============================
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ==== Đọc file foods.json cùng thư mục ====

// ESM không có __dirname sẵn, nên tự tạo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đường dẫn đến foods.json (đặt cùng folder với file này)
const foodsPath = path.join(__dirname, "foods.json");

// Đọc & parse JSON
const foods = JSON.parse(fs.readFileSync(foodsPath, "utf8"));

// ==== Firebase config của em ====
const firebaseConfig = {
  apiKey: "AIzaSyCzYg1Di5hS48SDnw2VtxPwtOPV6iMmDeg",
  authDomain: "foodapp-30765.firebaseapp.com",
  projectId: "foodapp-30765",
  storageBucket: "foodapp-30765.firebasestorage.app",
  messagingSenderId: "1060177711103",
  appId: "1:1060177711103:web:c82bea8b120b22d72461ca",
  measurementId: "G-4D8VPKJGB9",
};

// 🔥 Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Các chi nhánh cần import
const branches = ["B01", "B02"];

// ==== Hàm import ====
async function importBranchFoods() {
  try {
    for (const branchId of branches) {
      console.log(`\n🔥 Importing foods vào chi nhánh: ${branchId} ...`);

      const branchFoodsRef = collection(db, `branches/${branchId}/branchFoods`);

      for (const food of foods) {
        await setDoc(doc(branchFoodsRef, food.id), {
          foodId: food.id,
          isActive: food.isActive !== false, // nếu có isActive=false trong foods thì tắt, còn lại mặc định true
          stock: 10,
        });

        console.log(`✔ Đã thêm: ${food.id}`);
      }
    }

    console.log("\n🎉 Import thành công toàn bộ branchFoods!");
  } catch (error) {
    console.error("❌ Lỗi import:", error);
  }
}

// Chạy
importBranchFoods();
