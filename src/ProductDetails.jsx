import { useState } from "react";

const getImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("/uploads/")) {
    return `http://localhost:5000${image}`;
  }
  return image;
};

function ProductDetails({ product, onAddToCart, onBack }) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return <h2>Product not found</h2>;

  const parseArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object") {
          return Object.entries(parsed).map(([name, value]) => ({ name, value }));
        }
        return [];
      } catch {
        return [];
      }
    }
    if (value && typeof value === "object") {
      return Object.entries(value).map(([name, value]) => ({ name, value }));
    }
    return [];
  };

  const features = parseArray(product.features);
  const working = parseArray(product.working);
  const applications = parseArray(product.applications);
  const specifications = parseArray(product.specifications);
  const boxContents = parseArray(product.box_contents);
  const price = Number(product.price || 0);
  const featureIcons = ["💡", "📶", "⚙️", "🏠", "📱", "🔌"];

  const getSpecification = (item, index) => {
    if (Array.isArray(item)) {
      return {
        name: item[0] || `Specification ${index + 1}`,
        value: item[1] ?? "",
      };
    }
    if (item && typeof item === "object") {
      return {
        name:
          item.name || item.label || item.title || item.key ||
          item.parameter || item.specification || `Specification ${index + 1}`,
        value: item.value ?? item.text ?? item.description ?? item.details ?? "",
      };
    }
    return { name: `Specification ${index + 1}`, value: item ?? "" };
  };

  return (
    <main className="product-details-page">
      <div className="product-back-button">
        <button onClick={onBack}>← Back to Products</button>
      </div>

      <div className="product-breadcrumb">
        Home / Products / {product.category}
      </div>

      <section className="product-details-container">
        <div className="product-details-image">
          <img
            src={getImageUrl(product.image)}
            alt={product.name}
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden";
            }}
          />
        </div>

        <div className="product-details-info">
          <span className="product-category">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="product-description">{product.description}</p>
          <div className="product-price">₹{price.toLocaleString("en-IN")}</div>
          <div className="product-rating">
            ⭐ {product.rating || 0} / 5 ({product.reviews || 0} Reviews)
          </div>
          <p className="stock-status">
            {Number(product.stock) > 0
              ? `● In Stock (${product.stock})`
              : "● Currently Unavailable"}
          </p>

          <div className="quantity-control">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
            <span>{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </button>
          </div>

          <button
            className="details-add-cart"
            disabled={Number(product.stock) <= 0}
            onClick={() => onAddToCart(product, quantity)}
          >
            🛒 Add to Cart
          </button>
        </div>
      </section>

      {features.length > 0 && (
        <section className="product-features">
          <h2>Product Features</h2>
          <div className="feature-grid">
            {features.map((feature, index) => {
              const isObject = typeof feature === "object" && feature !== null;
              const title = isObject
                ? feature.title || feature.name || feature.label
                : feature;
              const description = isObject
                ? feature.text || feature.description || ""
                : "";
              return (
                <div key={index}>
                  <span>
                    {isObject
                      ? feature.icon || "✓"
                      : featureIcons[index % featureIcons.length]}
                  </span>
                  <h3>{title}</h3>
                  {description && <p>{description}</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {working.length > 0 && (
        <section className="how-it-works">
          <h2>How It Works</h2>
          <div className="working-flow">
            {working.map((step, index) => (
              <span key={index}>
                {typeof step === "object"
                  ? step.text || step.title || step.description
                  : step}
              </span>
            )).reduce((result, item, index) => {
              if (index > 0) result.push(<b key={`arrow-${index}`}>→</b>);
              result.push(item);
              return result;
            }, [])}
          </div>
        </section>
      )}

      {product.overview && (
        <section className="product-extra-section">
          <h2>Product Overview</h2>
          <p>{product.overview}</p>
        </section>
      )}

      {applications.length > 0 && (
        <section className="product-extra-section">
          <h2>Applications</h2>
          <div className="application-grid">
            {applications.map((item, index) => (
              <div key={index} className="application-card">
                ✓ {typeof item === "object"
                  ? item.name || item.title || item.text
                  : item}
              </div>
            ))}
          </div>
        </section>
      )}

      {specifications.length > 0 && (
        <section className="product-extra-section">
          <h2>Technical Specifications</h2>
          <table className="specification-table">
            <tbody>
              {specifications.map((item, index) => {
                const spec = getSpecification(item, index);
                return (
                  <tr key={index}>
                    <th>{spec.name}</th>
                    <td>{spec.value}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {boxContents.length > 0 && (
        <section className="product-extra-section">
          <h2>What's in the Box?</h2>
          <ul className="box-content-list">
            {boxContents.map((item, index) => (
              <li key={index}>
                ✓ {typeof item === "object"
                  ? item.name || item.title || item.text
                  : item}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

export default ProductDetails;
