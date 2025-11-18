import { FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./css/ProductCard.css";

export default function ProductCard({ product, onAdd }) {
  const navigate = useNavigate();
  if (!product) return null;

  // ====== Lấy tên ======
  const name =
    product.name ||
    product.title ||
    "Sản phẩm";

  // ====== Lấy giá ======
  const rawPrice =
    product.price ??
    (Array.isArray(product.sizes) && product.sizes[0]
      ? product.sizes[0].price
      : 0);

  const priceNumber = Number(rawPrice) || 0;

  // ====== Lấy ảnh ======
  const rawImg =
    product.image ||
    product.thumbnail ||
    product.img ||
    (Array.isArray(product.images) ? product.images[0] : null);

  const imgSrc = rawImg
    ? (String(rawImg).startsWith("http")
        ? rawImg
        : "/" + rawImg)
    : "https://via.placeholder.com/500?text=No+Image";

  // ====== Lấy ID để chuyển qua trang chi tiết ======
  const id =
    product.id ||
    product.code ||
    product.productId ||
    product.docId ||
    null;

  const handleCardClick = () => {
    if (!id) return;
    navigate(`/product/${id}`);   // 👈 chuyển qua ProductDetail
  };

  const handleAdd = (e) => {
    e.stopPropagation();          // không cho bubble lên card
    onAdd?.(product);
  };

  return (
    <article
      className="product-card"
      role="group"
      aria-label={name}
      onClick={handleCardClick}
    >
      <div className="product-card__media">
        <img
          src={imgSrc}
          alt={name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/500?text=No+Image";
          }}
        />
      </div>

      <h3 className="product-card__title">{name}</h3>

      <button
        className="product-card__add"
        type="button"
        onClick={handleAdd}
      >
        <FiPlus size={22} />
      </button>

      <div className="product-card__price">
        {priceNumber.toLocaleString("vi-VN")} <span>vnđ</span>
      </div>
    </article>
  );
}
