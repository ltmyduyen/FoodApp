// ===============================
// 🚀 Import dữ liệu vào Firestore (Node 20 ESM)
// ===============================
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc } from "firebase/firestore";
import foods from "./foods.json" assert { type: "json" }; // ✅ import JSON chuẩn ESM
import branchFoods from "./branchFoods.json" assert { type: "json" };
// ✅ Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCzYg1Di5hS48SDnw2VtxPwtOPV6iMmDeg",
  authDomain: "foodapp-30765.firebaseapp.com",
  projectId: "foodapp-30765",
  storageBucket: "foodapp-30765.firebasestorage.app",
  messagingSenderId: "1060177711103",
  appId: "1:1060177711103:web:c82bea8b120b22d72461ca",
  measurementId: "G-4D8VPKJGB9"
};

// 🔥 Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 📦 Import dữ liệu
async function importFoods() {
  console.log(`📦 Bắt đầu import ${foods.length} món...`);
  try {
    for (const food of foods) {
      await addDoc(collection(db, "foods"), food);
      console.log(`✅ Đã thêm: ${food.name}`);
    }
    console.log("🎉 Import hoàn tất!");
  } catch (error) {
    console.error("❌ Lỗi khi import:", error);
  }
}

async function importBranchFoods() {
  console.log("🍕 Importing branchFoods...");
  for (const branchId in branchFoods) {
    const list = branchFoods[branchId];
    for (const food of list) {
      await setDoc(doc(db, `branches/${branchId}/branchFoods`, food.foodName), {
        foodName: food.foodName,
        isAvailable: food.isAvailable,
        stock: food.stock,
      });
    }
    console.log(`✅ Imported foods for branch: ${branchId}`);
  }
}

//importFoods();
importBranchFoods();
