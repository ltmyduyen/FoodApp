// src/pages/SortBar.jsx
import "./css/Category.css";

export default function SortBar({ sort, setSort }) {
  const renderBtn = (value, label) => (
    <button
      type="button"
      onClick={() => setSort(value)}
      className={sort === value ? "sort-btn active" : "sort-btn"}
    >
      {label}
    </button>
  );

  return (
    <div className="sortbar">
      <span className="sortbar-label">Sắp xếp theo:</span>
      {renderBtn("popular", "Phổ Biến")}
      {renderBtn("new", "Mới Nhất")}
      {renderBtn("best", "Bán Chạy")}
      {renderBtn("price", "Giá")}
    </div>
  );
}
