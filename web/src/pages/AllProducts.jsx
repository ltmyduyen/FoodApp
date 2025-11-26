// src/pages/AllProducts.jsx
import { useEffect, useState, useMemo } from "react";
import ProductList from "../components/ProductList";
import {
  getAllFoods,
  getFoodsForBranch,
} from "../services/foodService";
import "./css/Category.css";

const PAGE_SIZE = 12; // mỗi trang 12 món, thích thì đổi

export default function AllProductsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let stop = false;

    async function load() {
      setLoading(true);
      setCurrentPage(1); // khi load lại thì quay về trang 1

      const userStr = localStorage.getItem("user");
      const hasUser = !!userStr;
      const branchId = localStorage.getItem("selectedBranchId") || null;

      try {
        let foods = [];

        // Có user + chi nhánh -> lấy theo chi nhánh
        if (hasUser && branchId) {
          foods = await getFoodsForBranch(branchId);
        } else {
          // Không thì lấy tất cả món đang active
          foods = await getAllFoods();
        }

        if (!stop) {
          setItems(foods);
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

  // ====== TÍNH LIST THEO TRANG ======
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / PAGE_SIZE)),
    [items.length]
  );

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return items.slice(start, end);
  }, [items, currentPage]);

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    // cuộn lên đầu danh sách cho dễ nhìn
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="cate-page">
      <h1 className="cate-title">Tất Cả Sản Phẩm</h1>

      {loading ? (
        <ProductList limit={PAGE_SIZE} maxWidth="100%" />
      ) : (
        <>
          <ProductList items={pagedItems} maxWidth="100%" />

          {/* ====== PHÂN TRANG ====== */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="page-btn"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                « Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={
                    "page-btn" + (p === currentPage ? " page-btn--active" : "")
                  }
                  onClick={() => changePage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                className="page-btn"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sau »
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
