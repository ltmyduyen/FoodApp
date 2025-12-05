import { NavLink, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuth.jsx";
import { FaHome, FaClipboardList, FaStore, FaUsers, FaSignOutAlt } from "react-icons/fa";
import "../css/Sidebar.css";

export default function AdminSidebar() {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  };

  return (
    <aside className="adm-sidebar">
      <div className="adm-brand">
        <div className="adm-brand-circle">⚙️</div>
        <div className="adm-brand-text">
          <div className="adm-brand-name">Admin</div>
          <div className="adm-brand-sub">{user?.email || "Hệ thống"}</div>
        </div>
      </div>

      <nav className="adm-nav">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => (isActive ? "adm-link active" : "adm-link")}
        >
          <FaHome /> <span>Tổng quan</span>
        </NavLink>

        <NavLink
          to="/admin/orders"
          className={({ isActive }) => (isActive ? "adm-link active" : "adm-link")}
        >
          <FaClipboardList /> <span>Đơn hàng</span>
        </NavLink>

        <NavLink
          to="/admin/branches"
          className={({ isActive }) => (isActive ? "adm-link active" : "adm-link")}
        >
          <FaStore /> <span>Chi nhánh</span>
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) => (isActive ? "adm-link active" : "adm-link")}
        >
          <FaUsers /> <span>Người dùng</span>
        </NavLink>

        <button onClick={handleLogout} className="adm-link logout">
          <FaSignOutAlt /> <span>Đăng xuất</span>
        </button>
      </nav>
    </aside>
  );
}