import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "@shared/FireBase";
import "../../pages/css/Restaurant/Menu.css";

const PAGE_SIZE = 10; // muốn 5 hay 10 thì đổi ở đây

export default function RestaurantMenu() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState("");
  const [page, setPage] = useState(1);

  // 🔁 Nghe realtime collection "foods"
  useEffect(() => {
    const ref = collection(db, "foods");

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() || {};

          const sizePrice =
            Array.isArray(data.sizes) && data.sizes.length > 0
              ? data.sizes[0].price || 0
              : null;
          const displayPrice =
            typeof sizePrice === "number" ? sizePrice : data.price || 0;

          return {
            id: d.id,
            code: data.code || d.id,
            name: data.name || `Món ${d.id}`,
            category: data.category || "—",
            price: displayPrice,
            isActive: data.isActive !== false, // mặc định true
            image:
              data.image ||
              data.img ||
              "https://via.placeholder.com/70x90?text=Food",
          };
        });

        setFoods(list);
        setLoading(false);
        setPage(1);
      },
      (err) => {
        console.error("load foods error", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleToggle = async (row) => {
    setToggling(row.id);
    try {
      const ref = doc(db, "foods", row.id);
      await updateDoc(ref, {
        isActive: !row.isActive,
      });
    } catch (e) {
      console.error(e);
      alert("Đổi trạng thái thất bại");
    } finally {
      setToggling("");
    }
  };

  // thống kê
  const totalFoods = foods.length;
  const activeCount = foods.filter((r) => r.isActive).length;

  // phân trang
  const totalPages =
    foods.length === 0 ? 1 : Math.ceil(foods.length / PAGE_SIZE);

  const start = (page - 1) * PAGE_SIZE;
  const currentRows = foods.slice(start, start + PAGE_SIZE);

  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <div className="rest-menu-wrap">
      <div className="rest-menu-head">
        <div>
          <h1 className="rest-menu-title">Quản lý món ăn</h1>
          <p className="rest-menu-sub">
            Bật / tắt món đang bán trong hệ thống. Khóa ở đây là khóa toàn bộ.
          </p>
        </div>
        <div className="rest-menu-meta">
          <span>
            Tổng món: <strong>{totalFoods}</strong>
          </span>
          <span>
            Đang bán: <strong>{activeCount}</strong>
          </span>
        </div>
      </div>

      <div className="rest-menu-tablewrap">
        {loading ? (
          <p className="rest-menu-empty">Đang tải dữ liệu menu...</p>
        ) : foods.length === 0 ? (
          <p className="rest-menu-empty">Chưa có món nào trong hệ thống.</p>
        ) : (
          <>
            <table className="rest-menu-table">
              <thead>
                <tr>
                  <th>Mã SP</th>
                  <th>Ảnh</th>
                  <th>Tên món</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.code}</td>
                    <td>
                      <img
                        src={r.image}
                        alt={r.name}
                        className="rest-menu-img"
                      />
                    </td>
                    <td>{r.name}</td>
                    <td>{r.category}</td>
                    <td>{r.price.toLocaleString("vi-VN")}đ</td>
                    <td>
                      <span
                        className={
                          "rest-menu-status " +
                          (r.isActive ? "active" : "inactive")
                        }
                      >
                        {r.isActive ? "Đang bán" : "Đã khoá"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className={
                          "rest-btn " + (r.isActive ? "lock" : "open")
                        }
                        onClick={() => handleToggle(r)}
                        disabled={toggling === r.id}
                      >
                        {toggling === r.id
                          ? "Đang đổi..."
                          : r.isActive
                          ? "Khoá món"
                          : "Mở bán"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* pagination */}
            <div className="rest-menu-pagination">
              <button
                type="button"
                onClick={() => goPage(page - 1)}
                disabled={page === 1}
              >
                «
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={p === page ? "active" : ""}
                  onClick={() => goPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => goPage(page + 1)}
                disabled={page === totalPages}
              >
                »
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
