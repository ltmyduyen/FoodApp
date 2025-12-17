// src/components/Admin/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuth.jsx";
import "../css/SideBar.css"; 

export default function AdminSidebar() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout?.();
    } finally {
      navigate("/login");
    }
  };

  return (
    <aside className="adm-sidebar">
      {/* BRAND */}
      <div className="adm-brand">
        <div className="adm-brand-circle">⚙️</div>
        <div className="adm-brand-name">Admin</div>
      </div>

      {/* NAV */}
      <nav className="adm-nav">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            isActive ? "adm-link active" : "adm-link"
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/orders"
          className={({ isActive }) =>
            isActive ? "adm-link active" : "adm-link"
          }
        >
          Đơn hàng
        </NavLink>

        <NavLink
          to="/admin/foods"
          className={({ isActive }) =>
            isActive ? "adm-link active" : "adm-link"
          }
        >
          Món ăn
        </NavLink>
      </nav>

      {/* BOTTOM */}
      <div className="adm-bottom">
        <p className="adm-user-name">
          {user?.email || "admin"}
        </p>

        <button className="adm-logout" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
