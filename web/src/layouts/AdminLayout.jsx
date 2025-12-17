// src/layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/Admin/Sidebar.jsx";

export default function AdminLayout() {
  return (
    <div className="adm-shell">
      <AdminSidebar />

      {/* MAIN CONTENT */}
      <main className="adm-main">
        <Outlet />
      </main>
    </div>
  );
}
