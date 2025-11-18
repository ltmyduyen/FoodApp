// src/pages/CategorySidebar.jsx
import "./css/Category.css";

const CATEGORIES = [
  { slug: "pizza", label: "Pizza" },
  { slug: "burger", label: "Burger" },
  { slug: "drink", label: "Drink" },
];

export default function CategorySidebar({ activeSlug }) {
  return (
    <aside className="cate-sidebar">
      <h3 className="cate-sidebar-title">DANH MỤC</h3>
      <ul className="cate-sidebar-list">
        {CATEGORIES.map((c) => (
          <li
            key={c.slug}
            className={c.slug === activeSlug ? "active" : undefined}
          >
            {c.label}
          </li>
        ))}
      </ul>
    </aside>
  );
}
