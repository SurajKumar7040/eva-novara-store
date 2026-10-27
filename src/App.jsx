import { useMemo, useState } from "react";
import "./App.css";

const products = [
  {
    id: 1,
    name: "4-Channel ESP32 Wi-Fi Relay Controller",
    description: "Control lights, fans, AC and appliances from your phone.",
    price: 2999,
    category: "Controllers",
    image: "/images/relay-controller.png",
    rating: 4.8,
    reviews: 18,
  },
  {
    id: 2,
    name: "Automatic Light On Sensor",
    description: "Motion-based automatic lighting for rooms and corridors.",
    price: 499,
    category: "Sensors",
    image: "/images/EVA Novara PIR Motion Sensor Board.png",
    rating: 4.6,
    reviews: 12,
  },
  {
    id: 3,
    name: "Smart Wi-Fi Wall Switch",
    description: "Convenient app-based control for your home lighting.",
    price: 899,
    category: "Switches & Plugs",
    image: "/images/Untitled.png",
    rating: 4.7,
    reviews: 21,
  },
  {
    id: 4,
    name: "Smart Door & Window Sensor",
    description: "Get notified when a door or window opens.",
    price: 699,
    category: "Sensors",
    image: "/images/door-window-sensor.png",
    rating: 4.5,
    reviews: 10,
  },
  {
    id: 5,
    name: "Temperature & Humidity Sensor",
    description: "Monitor indoor temperature and humidity levels.",
    price: 599,
    category: "Sensors",
    image: "/images/huminity.png",
    rating: 4.6,
    reviews: 14,
  },
  {
    id: 6,
    name: "Smart Wi-Fi Camera Module",
    description: "A compact camera concept for home monitoring.",
    price: 1499,
    category: "Security",
    image: "/images/camera.png",
    rating: 4.7,
    reviews: 25,
  },
  {
    id: 7,
    name: "Smart Wi-Fi Plug",
    description: "Control compatible plug-in appliances remotely.",
    price: 799,
    category: "Switches & Plugs",
    image: "/images/Smart Wi‑Fi Plug PCB Assembly.png",
    rating: 4.5,
    reviews: 9,
  },
];

const categories = [
  ["⌂", "Smart Controllers"],
  ["◉", "Sensors"],
  ["▣", "Switches & Plugs"],
  ["◉", "Smart Security"],
  ["⚡", "Power & Accessories"],
];

const filters = ["All", "Controllers", "Sensors", "Switches & Plugs", "Security"];

function money(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function App() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [notice, setNotice] = useState("");

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = activeFilter === "All" || product.category === activeFilter;
      const matchesSearch = `${product.name} ${product.description} ${product.category}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeFilter, search]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
    setNotice(`${product.name} added to cart`);
    window.setTimeout(() => setNotice(""), 2500);
  }

  function chooseCategory(label) {
    const categoryFilter = {
      "Smart Controllers": "Controllers",
      Sensors: "Sensors",
      "Switches & Plugs": "Switches & Plugs",
      "Smart Security": "Security",
      "Power & Accessories": "All",
    };
    setActiveFilter(categoryFilter[label] || "All");
    setSearch("");
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <div className="topbar">
        <div>✉ info@evanovara.com <span>☎ +91 98765 43210</span></div>
        <div className="top-links">
          <a href="#support">Track Order</a>
          <a href="#support">Support</a>
          <a href="#contact">Dealer Portal</a>
          <a href="#contact">f</a>
          <a href="#contact">◎</a>
          <a href="#contact">in</a>
        </div>
      </div>

      <header className="navbar">
        <a className="logo" href="#home" aria-label="EVA NOVARA Home">
          <img
            src="/images/eva-novara-logo.png"
            alt="EVA NOVARA Technologies"
            className="logo-image"
          />
        </a>

        <nav className="main-nav">
          <a href="#home">Home</a>
          <a href="#products">Products⌄</a>
          <a href="#solutions">Smart Solutions⌄</a>
          <a href="#categories">Categories⌄</a>
          <a href="#about">About Us</a>
          <a href="#support">Support⌄</a>
          <a href="#contact">Contact</a>
        </nav>

        <form className="search-box" onSubmit={(event) => {
          event.preventDefault();
          document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
        }}>
          <input
            aria-label="Search products"
            placeholder="Search smart home products..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setActiveFilter("All");
            }}
          />
          <button aria-label="Search">⌕</button>
        </form>

        <a className="nav-action" href="#login">♙ <span>Login</span></a>
        <a className="nav-action cart-action" href="#cart">🛒 <span>Cart ({cartCount})</span></a>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="eyebrow">SMART HOME · SIMPLE CONTROL</div>
            <h1>Smart Automation<br />for a <span>Smarter Home</span></h1>
            <p>
              Make everyday living easier with EVA NOVARA smart controllers,
              automatic lighting, connected sensors and home security solutions.
            </p>
            <div className="hero-categories">
              <div><b>⚙</b><span>Smart<br />Controllers</span></div>
              <div><b>⌂</b><span>Home<br />Lighting</span></div>
              <div><b>◉</b><span>Smart<br />Sensors</span></div>
              <div><b>♧</b><span>Home<br />Security</span></div>
            </div>
            <div className="hero-buttons">
              <a className="primary-button" href="#products">Shop Smart Home →</a>
              <a className="video-link" href="#solutions">⌂ &nbsp; Explore Solutions</a>
            </div>
          </div>

          <div className="hero-visual" aria-label="Smart home mobile controller illustration">
            <div className="smart-house"><div className="house-windows" /></div>
            <div className="phone">
              <div className="phone-brand">EVA NOVARA</div>
              <h3>Smart Home</h3>
              {[
                ["💡", "Light", true],
                ["🌀", "Fan", true],
                ["❄️", "AC", false],
                ["🌙", "Night Light", true],
              ].map(([icon, label, enabled]) => (
                <div className="phone-device" key={label}>
                  <span>{icon} &nbsp; {label}</span>
                  <span className={`switch ${enabled ? "" : "switch-off"}`} />
                </div>
              ))}
              <div className="microphone">🎙</div>
              <small>Tap to Speak</small>
            </div>
            <div className="voice-bubble">“Turn on Living Room Light”</div>
          </div>
        </section>

        <section className="benefits">
          <div><b>♧</b><span><strong>Smart Home Essentials</strong><small>Designed for everyday comfort</small></span></div>
          <div><b>⬡</b><span><strong>Secure Packaging</strong><small>Safe and reliable delivery</small></span></div>
          <div><b>▤</b><span><strong>Multiple Payment Options</strong><small>UPI, Cards, Net Banking, COD</small></span></div>
          <div><b>☏</b><span><strong>Customer Support</strong><small>We're here to help</small></span></div>
        </section>

        <section className="content-section" id="categories">
          <div className="section-heading">
            <div>
              <h2>Shop <span className="heading-accent">Smart Home</span> Categories</h2>
              <p className="section-subtitle">Explore our wide range of smart home solutions for a safer, smarter and more comfortable living.</p>
            </div>
            <button className="outline-button" onClick={() => chooseCategory("Power & Accessories")}>
              View All Categories →
            </button>
          </div>
          <div className="category-grid">
            {categories.map(([icon, label]) => (
              <button className="category-card" key={label} onClick={() => chooseCategory(label)}>
                <span className="category-icon">{icon}</span>
                <strong>{label}</strong>
                <small>{label === "Smart Controllers" ? "12+ Products" : label === "Sensors" ? "18+ Products" : label === "Switches & Plugs" ? "15+ Products" : label === "Smart Security" ? "10+ Products" : "8+ Products"}</small>
                <b className="category-arrow">→</b>
              </button>
            ))}
          </div>
        </section>

        <section className="content-section products-section" id="products">
          <div className="section-heading product-heading">
            <div>
              <h2>Featured <span className="heading-accent">Smart Home</span> Products</h2>
              <p className="section-subtitle">Practical technology for a smarter, more comfortable home.</p>
            </div>
            <div className="filter-list">
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={activeFilter === filter ? "filter active" : "filter"}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className={`product-art art-${product.id}`}>
                  <img src={product.image} alt={product.name} />
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-rating" aria-label={`${product.rating} out of 5 stars`}>
                    <span className="stars">★</span>
                    <strong>{product.rating}</strong>
                    <small>({product.reviews})</small>
                  </div>
                  <div className="product-buy">
                    <strong>{money(product.price)}</strong>
                    <button onClick={() => addToCart(product)}>🛒 Add to Cart</button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {visibleProducts.length === 0 && (
            <p className="empty-results">No products found. Try a different search.</p>
          )}
        </section>

        <section className="promo-grid" id="solutions">
          <article className="promo promo-voice">
            <div><h3>Voice Controlled Home</h3><p>Control compatible lights and appliances with voice commands.</p><button onClick={() => chooseCategory("Smart Controllers")}>Explore Controllers →</button></div>
            <span>🔊</span>
          </article>
          <article className="promo promo-light">
            <div><h3>Automatic Lighting</h3><p>Motion-based lighting for entrances, rooms and corridors.</p><button onClick={() => chooseCategory("Sensors")}>Explore Sensors →</button></div>
            <span>💡</span>
          </article>
          <article className="promo promo-security">
            <div><h3>Smart Home Security</h3><p>Connected sensors and camera concepts for home awareness.</p><button onClick={() => chooseCategory("Smart Security")}>Explore Security →</button></div>
            <span>⌂</span>
          </article>
        </section>
      </main>

      <footer id="contact">
        <div className="footer-brand"><strong>EVA NOVARA Technologies</strong><span>Engineering the Future</span></div>
        <div id="about">About Us · Products · Smart Solutions</div>
        <div id="support">Support · Contact: info@evanovara.com</div>
        <div id="login">© 2026 EVA NOVARA Technologies</div>
      </footer>

      {notice && <div className="toast">{notice}</div>}

      <section className="cart-summary" id="cart" aria-live="polite">
        <strong>Shopping Cart</strong>
        <span>{cartCount} item(s) · Total: {money(cartTotal)}</span>
        {cart.length > 0 && (
          <div className="cart-items">
            {cart.map((item) => <div key={item.id}>{item.name} × {item.quantity}</div>)}
          </div>
        )}
        <small>Demo cart only — checkout and online payments are not enabled yet.</small>
      </section>
    </>
  );
}