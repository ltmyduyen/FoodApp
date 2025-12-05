// importSharedMenuToAllBranches.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = { /* ...config của bạn... */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// đọc foods chuẩn dùng chung
const foods = JSON.parse(fs.readFileSync("./foods.json", "utf-8"));
// 3 chi nhánh dùng chung
const BRANCHES = ["B01", "B02", "B03"];

function makeFoodId(i) {
  return `F${String(i).padStart(2, "0")}`; // F01, F02...
}

(async () => {
  console.log(`📦 Import shared menu vào ${BRANCHES.join(", ")}`);

  let i = 1;
  for (const item of foods) {
    const foodId = item.id || makeFoodId(i);

    for (const bid of BRANCHES) {
      await setDoc(
        doc(db, "branches", bid, "branchFoods", foodId),
        {
          foodId,                       // tham chiếu tới foods/Fxx
          price: item.price ?? item.basePrice ?? 0,
          isAvailable: true,
          category: item.category ?? "menu-fixed",
          // option: denormalize để hiển thị nhanh
          foodName: item.name,
          image: item.image ?? "",
          updatedAt: new Date()
        }
      );
      console.log(`✅ ${bid}/branchFoods -> ${foodId}`);
    }
    i++;
  }

  console.log("🎉 Done - 3 chi nhánh có cùng menu!");
})().catch(console.error);
