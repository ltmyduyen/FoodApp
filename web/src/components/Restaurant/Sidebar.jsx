import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuth.jsx";
import { db } from "@shared/FireBase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "../css/Sidebar.css";

export default function RestaurantSidebar() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Nhà hàng";

  const branchId = user?.branchId || user?.restaurantBranchId || "—";

  // Lắng nghe đơn đang chờ
  useEffect(() => {
    if (!branchId) return;

    const q = query(collection(db, "orders"), where("branchId", "==", branchId));

    const unsub = onSnapshot(q, (snap) => {
      let count = 0;
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.status === "processing" || data.status === "pending") {
          count++;
        }
      });
      setPendingCount(count);
    });

    return () => unsub();
  }, [branchId]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  };

  return (
    <header className="rest-topbar">
      {/* Logo + brand */}
      <div className="rest-top-brand">
        <div className="rest-top-icon">🍽️</div>
        <div>
          <div className="rest-top-name">{displayName}</div>
          <div className="rest-top-branch">Chi nhánh {branchId}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="rest-top-nav">
        <NavLink
          to="/restaurant"
          end
          className={({ isActive }) =>
            isActive ? "rest-top-link active" : "rest-top-link"
          }
        >
          📊 Dashboard
        </NavLink>

        <NavLink
          to="/restaurant/orders"
          className={({ isActive }) =>
            isActive ? "rest-top-link active" : "rest-top-link"
          }
        >
          🧾 Đơn hàng
          {pendingCount > 0 && (
            <span className="rest-top-badge">{pendingCount}</span>
          )}
        </NavLink>

        <NavLink
          to="/restaurant/menu"
          className={({ isActive }) =>
            isActive ? "rest-top-link active" : "rest-top-link"
          }
        >
          🍕 Món ăn
        </NavLink>
      </nav>

      {/* Logout */}
      <button className="rest-top-logout" onClick={handleLogout}>
        Đăng xuất
      </button>
    </header>
  );
}
