// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "../components/Slider.jsx";
import ProductList from "../components/ProductList.jsx";

import {
  getFoodsByCategory,
  getFoodsByCategoryForBranch,
} from "../services/foodService.js";

import "./css/Category.css";

// ====== CÁC CATEGORY CỦA MENU CỐ ĐỊNH ======
const FIXED_CATEGORIES = [
  "Cơm",
  "Mỳ",
  "Bún",
  "Gimbab",
  "Cuốn",
  "Salad",
];

// ====== CÁC CATEGORY CỦA ĐỒ UỐNG & SNACK ======
const HEALTHY_CATEGORIES = [
  "Đồ Uống",
  "Kombucha",
  "Healthy Snack",
  "Healthy Drink",
  "Snack",
];

export default function Home() {
  const navigate = useNavigate();

  const [fixedItems, setFixedItems] = useState([]);
  const [healthyItems, setHealthyItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----- HÀM LẤY NHIỀU CATEGORY -----
  async function fetchMultiCategory(categories, branchId) {
    let all = [];

    for (const cat of categories) {
      let foods = branchId
        ? await getFoodsByCategoryForBranch(branchId, cat)
        : await getFoodsByCategory(cat);

      all = [...all, ...foods];
    }
    return all;
  }

  useEffect(() => {
    let stop = false;

    async function load() {
      setLoading(true);

      const userStr = localStorage.getItem("user");
      const hasUser = !!userStr;
      const branchId = localStorage.getItem("selectedBranchId") || null;

      try {
        let fixed = [];
        let healthy = [];

        if (!hasUser || !branchId) {
          // Không login hoặc chưa chọn chi nhánh
          fixed = await fetchMultiCategory(FIXED_CATEGORIES);
          healthy = await fetchMultiCategory(HEALTHY_CATEGORIES);
        } else {
          // Có user + chi nhánh
          fixed = await fetchMultiCategory(FIXED_CATEGORIES, branchId);
          healthy = await fetchMultiCategory(HEALTHY_CATEGORIES, branchId);
        }

        if (!stop) {
          setFixedItems(fixed.slice(0, 8));
          setHealthyItems(healthy.slice(0, 8));
        }
      } finally {
        if (!stop) setLoading(false);
      }
    }

    load();
    return () => {
      stop = true;
    };
  }, []);

  // ====== HANDLER SIDEBAR ======
  const handleScrollTo = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="home-page">
      {/* --- Sidebar + Banner --- */}
      <div className="home-top">
        <aside className="cate-sidebar home-sidebar">
          <h3 className="cate-sidebar-title">DANH MỤC</h3>
          <ul className="cate-sidebar-list">
            <li
              className="cate-link"
              onClick={() => navigate("/products")}
            >
              Tất Cả Sản Phẩm
            </li>
            <li
              className="cate-link"
              onClick={() => handleScrollTo("section-fixed")}
            >
              Menu Cố Định
            </li>
            <li
              className="cate-link"
              onClick={() => handleScrollTo("section-healthy")}
            >
              Đồ Uống &amp; Đồ Ăn Vặt Healthy
            </li>
              <li
               className="cate-link"
               onClick={() => handleScrollTo("section-contact")}
              >
              Liên hệ
            </li>
          </ul>
        </aside>

        <div className="home-top-main">
          <Slider autoplay={2000} />
        </div>
      </div>

      {/* --- MENU CỐ ĐỊNH --- */}
      <div id="section-fixed" className="home-section">
        <h2 className="cate-title">Menu Cố Định</h2>
        {loading ? (
          <ProductList limit={6} maxWidth="1180px" />
        ) : (
          <ProductList items={fixedItems} maxWidth="1180px" />
        )}
      </div>

      {/* --- ĐỒ UỐNG & SNACK --- */}
      <div id="section-healthy" className="home-section">
        <h2 className="cate-title">Đồ Uống &amp; Đồ Ăn Vặt Healthy</h2>
        {loading ? (
          <ProductList limit={6} maxWidth="1180px" />
        ) : (
          <ProductList items={healthyItems} maxWidth="1180px" />
        )}
      </div>
      <section id="section-contact" className="contact">
  ...
</section>
    </section>
  );
}
