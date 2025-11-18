// src/layouts/RestaurantLayout.jsx
import { Outlet } from "react-router-dom";
import RestaurantSidebar from "../components/Restaurant/Sidebar.jsx";


export default function RestaurantLayout() {
  return (
    <div className="rest-shell">
      <RestaurantSidebar />      {/* topbar ngang */}
      <main className="rest-main">
        <Outlet />
      </main>
    </div>
  );
}
