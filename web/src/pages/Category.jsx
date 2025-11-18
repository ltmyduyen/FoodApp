// src/pages/Category.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ProductList from "../components/ProductList.jsx";
import CategorySidebar from "./CategorySidebar.jsx";
import SortBar from "./SortBar.jsx";

import {
  getFoodsByCategory,
  getFoodsByCategoryForBranch,
} from "../services/foodService.js";

import "./css/Category.css";

const CAT_MAP = {
  pizz: { name: "Pizza" },
  burger: { name: "Burger" },
  drink: { name: "Drink" },
};

export default function Category() {
  const { slug } = useParams();
  const cat = CAT_MAP[slug];

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState("popular"); // Phổ biến / Mới nhất / Bán chạy / Giá

  // slug không hợp lệ
  if (!cat) {
    return <div style={{ padding: 16 }}>Danh mục không tồn tại.</div>;
  }

  useEffect(() => {
    let stop = false;

    async function load() {
      setLoading(true);

      const userStr = localStorage.getItem("user");
      const hasUser = !!userStr;
      const branchId = localStorage.getItem("selectedBranchId");

      try {
        let data = [];

        // không đăng nhập hoặc chưa chọn chi nhánh -> lấy tất cả theo category
        if (!hasUser || !branchId) {
          data = await getFoodsByCategory(cat.name);
        } else {
          // có user + có chi nhánh -> lọc theo chi nhánh
          data = await getFoodsByCategoryForBranch(branchId, cat.name);
        }

        if (!stop) setItems(data);
      } finally {
        if (!stop) setLoading(false);
      }
    }

    load();

    return () => {
      stop = true;
    };
  }, [slug, cat.name]);

  // sắp xếp theo sortType
  const sortedItems = [...items].sort((a, b) => {
    switch (sortType) {
      case "new":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "best":
        return (b.sold ?? 0) - (a.sold ?? 0);
      case "price":
        return (a.price ?? 0) - (b.price ?? 0);
      default:
        // "popular" => giữ nguyên
        return 0;
    }
  });

  return (
    <section className="cate-page">
      <div className="cate-layout">
        {/* Sidebar bên trái */}
        <CategorySidebar activeSlug={slug} />

        {/* Nội dung bên phải */}
        <div className="cate-main">
          <div className="cate-breadcrumb">
            Trang chủ &gt; <span>{cat.name}</span>
          </div>

          <h1 className="cate-title">{cat.name}</h1>

          <SortBar sort={sortType} setSort={setSortType} />

          {loading ? (
            <ProductList limit={6} maxWidth="1180px" />
          ) : (
            <ProductList items={sortedItems} maxWidth="1180px" />
          )}
        </div>
      </div>
    </section>
  );
}
