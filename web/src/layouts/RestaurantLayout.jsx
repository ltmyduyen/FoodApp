// src/layouts/RestaurantLayout.jsx
import { Outlet } from "react-router-dom";
import RestaurantSidebar from "../components/Restaurant/ResSidebar.jsx";


export default function RestaurantLayout() {
  return (
    <div className="admin-layout">
      <RestaurantSidebar />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
