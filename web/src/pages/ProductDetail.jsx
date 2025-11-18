// src/pages/ProductDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./css/ProductDetail.css";
import { db } from "@shared/FireBase";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import QuantityInput from "../components/QuantityInput";
import ProductList from "../components/ProductList";
import { addToCart } from "../services/cartClient";

// shuffle gợi ý
function shuffle(arr) {
  return [...arr].sort(() => 0.5 - Math.random());
}

export default function ProductDetailPage() {
  // id trong URL chính là slug: com-bo-vien-xot-ca-chua
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);

  const [suggested, setSuggested] = useState([]);

  // user
  const userStr =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const userId = currentUser?.id;

  // ===== load product + gợi ý =====
  useEffect(() => {
    let alive = true;

    async function loadProduct() {
      setLoading(true);
      try {
        // 1) lấy món chính theo slug (field id trong document)
        const q = query(
          collection(db, "foods"),
          where("id", "==", id) // 👈 so sánh theo slug
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          if (alive) {
            setProduct(null);
          }
          return;
        }

        const docSnap = snap.docs[0];

        // giữ slug trong field id, lưu docId riêng
        const data = {
          docId: docSnap.id,
          ...docSnap.data(),
        };

        if (data.isActive === false) {
          if (alive) setProduct(null);
          return;
        }

        if (alive) {
          setProduct(data);
          setQty(1);
          setNote("");
        }

        // 2) gợi ý (lấy vài món khác, ưu tiên cùng category)
        const allSnap = await getDocs(collection(db, "foods"));
        const allFoods = allSnap.docs
          .map((d) => ({
            docId: d.id,
            ...d.data(), // id ở đây vẫn là slug
          }))
          .filter(
            (f) =>
              f.id !== data.id && // khác món hiện tại
              f.isActive !== false
          );

        const sameCat = allFoods.filter(
          (f) => f.category && f.category === data.category
        );
        const pool = sameCat.length >= 4 ? sameCat : allFoods;
        const random4 = shuffle(pool).slice(0, 4);

        if (alive) setSuggested(random4);
      } catch (err) {
        console.error("Lỗi load product detail:", err);
        if (alive) setProduct(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      alive = false;
    };
  }, [id]);

  const unitPrice = product?.price ?? 0;

  // ===== add to cart =====
  const handleAddToCart = async () => {
    if (!product) return;

    if (!userId) {
      alert("Bạn cần đăng nhập trước nha ✋");
      navigate("/login");
      return;
    }

    const branchId =
      typeof window !== "undefined"
        ? localStorage.getItem("selectedBranchId")
        : null;

    if (!branchId) {
      alert("Bạn chưa chọn chi nhánh. Vui lòng chọn chi nhánh trước.");
      return;
    }

    try {
      const result = await addToCart(userId, product, {
        selectedSize: null,
        selectedBase: null,
        selectedTopping: null,
        selectedAddOn: null,
        note: note || "",
        quantity: qty,
        branchId,
      });

      if (result?.merged) {
        alert("Đã cộng thêm vào món có sẵn trong giỏ ✅");
      } else {
        alert("Đã thêm vào giỏ ✅");
      }
    } catch (err) {
      console.error(err);
      alert("Không thêm được vào giỏ 😢");
    }
  };

  if (loading) {
    return <div className="pd-page">Đang tải món ăn...</div>;
  }

  if (!product) {
    return <div className="pd-page">Không tìm thấy món ăn.</div>;
  }

  return (
    <div className="pd-page">
      <div className="pd-content">
        {/* Hình */}
        <div className="pd-left">
          <img
            src={
              product.image ||
              product.imageUrl ||
              "https://via.placeholder.com/500?text=No+Image"
            }
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/500?text=No+Image";
            }}
          />
        </div>

        {/* Thông tin chính */}
        <div className="pd-right">
          <h1>{product.name}</h1>

          {/* meta: category / calories / rating */}
          <div className="pd-meta-row">
            {product.category && (
              <span className="pd-meta-tag">{product.category}</span>
            )}
            {typeof product.calories === "number" && (
              <span className="pd-meta-tag">{product.calories} kcal</span>
            )}
            {typeof product.rating === "number" && (
              <span className="pd-meta-tag">⭐ {product.rating}</span>
            )}
          </div>

          <p className="pd-desc">
            {product.description || "Món này chưa có mô tả chi tiết."}
          </p>

          {/* Ghi chú */}
          <div className="pd-group">
            <h3>Ghi chú</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: ít cay, thêm sốt, bớt cơm…"
            />
          </div>

          {/* Quantity + tổng tiền + nút */}
          <div className="pd-actions-row">
            <QuantityInput value={qty} min={1} onChange={setQty} />

            <div className="pd-price-pill">
              <div className="pd-price-pill__price">
                {(unitPrice * qty).toLocaleString("vi-VN")} đ
              </div>
              <button
                type="button"
                className="pd-price-pill__btn"
                onClick={handleAddToCart}
              >
                Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gợi ý */}
      {suggested.length > 0 && (
        <div className="pd-related">
          <ProductList title="Món gợi ý" items={suggested} limit={4} />
        </div>
      )}
    </div>
  );
}
