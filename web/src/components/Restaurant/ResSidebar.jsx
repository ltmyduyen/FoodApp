import { useEffect, useState, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuth.jsx";
import { db } from "@shared/FireBase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "../css/ResSidebar.css";

export default function RestaurantSidebar() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  const displayName = useMemo(() => {
    return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Nhà hàng";
  }, [user?.firstName, user?.lastName]);

  const branchId = user?.branchId || user?.restaurantBranchId || "—";

  // Listen orders đang chờ
  useEffect(() => {
    if (!branchId || branchId === "—") {
      setPendingCount(0);
      return;
    }

    const q1 = query(
      collection(db, "orders"),
      where("branchId", "==", branchId)
    );

    const unsub = onSnapshot(
      q1,
      (snap) => {
        let count = 0;
        snap.forEach((doc) => {
          const data = doc.data();
          if (data?.status === "processing" || data?.status === "pending") count++;
        });
        setPendingCount(count); // ✅ FIX: bỏ chữ 'a'
      },
      (err) => console.error("listen pending orders error:", err)
    );

    return () => unsub();
  }, [branchId]);

  const handleLogout = async () => {
    try {
      await logout?.();
    } finally {
      navigate("/login");
    }
  };

  return (
    <aside className="rest-side">
      {/* Meta card */}
      <div className="rest-side__meta">
        <div className="rest-side__metaRow">
        </div>
       <div className="rest-side__metaRow">
       <div className="branch-title">Chi nhánh</div>
      <div className="branch-code">{branchId}</div>
      </div>

      </div>

      {/* Nav */}
      <nav className="rest-side__nav">
        <NavLink
          to="/restaurant"
          end
          className={({ isActive }) =>
            isActive ? "rest-side__link active" : "rest-side__link"
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/restaurant/orders"
          className={({ isActive }) =>
            isActive ? "rest-side__link active" : "rest-side__link"
          }
        >
          Đơn hàng
          {pendingCount > 0 && <span className="rest-side__badge">{pendingCount}</span>}
        </NavLink>

        <NavLink
          to="/restaurant/menu"
          className={({ isActive }) =>
            isActive ? "rest-side__link active" : "rest-side__link"
          }
        >
          Món ăn
        </NavLink>
      </nav>

      {/* Logout */}
      <button className="rest-side__logout" onClick={handleLogout}>
        Đăng xuất
      </button>
    </aside>
  );
}
