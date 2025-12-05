import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthContext } from "../../hooks/useAuth.jsx";
import { db } from "@shared/FireBase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  FaHome,
  FaClipboardList,
  FaPizzaSlice,
  FaSignOutAlt,
  FaStoreAlt,
} from "react-icons/fa";
import "../css/Side.css";

export default function RestaurantSidebar() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Nhà hàng";
  const branchId = user?.branchId || user?.restaurantBranchId || "—";

  useEffect(() => {
    if (!branchId) return;
    const q = query(collection(db, "orders"), where("branchId", "==", branchId));
    const unsub = onSnapshot(q, (snap) => {
      let count = 0;
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.status === "pending" || data.status === "processing") count++;
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
    <aside className="rest-side">
      <div className="rest-side-brand">
        <FaStoreAlt className="rest-side-logo" />
        <div>
          <div className="rest-side-name">{displayName}</div>
          <div className="rest-side-branch">Chi nhánh {branchId}</div>
        </div>
      </div>

      <nav className="rest-side-nav">
        <NavLink
          to="/restaurant"
          end
          className={({ isActive }) =>
            isActive ? "rest-side-link active" : "rest-side-link"
          }
        >
          <FaHome /> <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/restaurant/orders"
          className={({ isActive }) =>
            isActive ? "rest-side-link active" : "rest-side-link"
          }
        >
          <FaClipboardList /> <span>Đơn hàng</span>
          {pendingCount > 0 && (
            <span className="rest-side-badge">{pendingCount}</span>
          )}
        </NavLink>

        <NavLink
          to="/restaurant/menu"
          className={({ isActive }) =>
            isActive ? "rest-side-link active" : "rest-side-link"
          }
        >
          <FaPizzaSlice /> <span>Món ăn</span>
        </NavLink>
      </nav>

      <button className="rest-side-logout" onClick={handleLogout}>
        <FaSignOutAlt /> <span>Đăng xuất</span>
      </button>
    </aside>
  );
}