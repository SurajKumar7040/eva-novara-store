import { useEffect, useMemo, useState } from "react";
import "./App.css";
import ProductDetails from "./ProductDetails.jsx";
import Categories from "./Categories.jsx";
import About from "./About.jsx";
import Contact from "./Contact.jsx";
import Support from "./Support.jsx";
import CustomerAuth from "./CustomerAuth.jsx";
import CustomerDashboard from "./CustomerDashboard.jsx";

const categories = [

  ["", "Smart Controllers", "/images/Glossy Smart Home Icon.png"],

  ["", "Sensors", "/images/Glossy PIR Motion Sensor with Signal Waves.png"],

  ["", "Switches & Plugs", "/images/Minimalist White Smart Socket on Peach Background.png"],

  ["", "Smart Security", "/images/Glossy Smart Home Camera on Lavender.png"],

  ["", "Power & Accessories", "/images/Glowing Bulb on Pastel Pink.png"],

];

const filters = ["All", "Controllers", "Sensors", "Switches & Plugs", "Security"];

function money(amount) {

  return `₹${Number(amount || 0).toLocaleString("en-IN", {

    minimumFractionDigits: 2,

    maximumFractionDigits: 2,

  })}`;

}



// Uploaded product images are served by the backend, not the Vite frontend.
function getImageUrl(image) {
  if (!image) return "";
  if (image.startsWith("/uploads/")) {
    return `http://localhost:5000${image}`;
  }
  return image;
}

export default function App() {

  const [activeFilter, setActiveFilter] = useState("All");

  const [search, setSearch] = useState("");

  const [cart, setCart] = useState([]);

  const [notice, setNotice] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [showCategories, setShowCategories] = useState(false);

  const [showAbout, setShowAbout] = useState(false);

  const [showContact, setShowContact] = useState(false);

  const [showSupport, setShowSupport] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [products, setProducts] = useState([]);

  const [productsLoading, setProductsLoading] = useState(true);

  const [productsError, setProductsError] = useState("");

  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");

const [showCustomerAuth, setShowCustomerAuth] = useState(false);
const [showCustomerDashboard, setShowCustomerDashboard] = useState(false);

const [customer, setCustomer] = useState(null);

const [customerLoading, setCustomerLoading] = useState(true);

useEffect(() => {
  const token = localStorage.getItem("customerToken");

  if (!token) {
    setCustomerLoading(false);
    return;
  }

  fetch("http://localhost:5000/api/customers/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(async (response) => {
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Session expired");
      }

      setCustomer(data.customer);
      localStorage.setItem(
        "customerData",
        JSON.stringify(data.customer)
      );
    })
    .catch(() => {
      localStorage.removeItem("customerToken");
      localStorage.removeItem("customerData");
      setCustomer(null);
    })
    .finally(() => {
      setCustomerLoading(false);
    });
}, []);

  useEffect(() => {
    if (showCart) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showCart]);

  useEffect(() => {
    const controller = new AbortController();



  async function loadProducts() {

    try {

      setProductsLoading(true);

      setProductsError("");



      const response = await fetch(

        "http://localhost:5000/api/products",

        { signal: controller.signal }

      );



      if (!response.ok) {

        throw new Error("API request failed");

      }



      const data = await response.json();



      if (!data.success || !Array.isArray(data.products)) {

        throw new Error("Invalid API response");

      }



      setProducts(data.products);



    } catch (error) {

      if (error.name !== "AbortError") {

        console.error("Products API Error:", error);

        setProductsError("Products load nahi ho paaye.");

      }

    } finally {

      if (!controller.signal.aborted) {

        setProductsLoading(false);

      }

    }

  }



  loadProducts();



  return () => controller.abort();



}, []);



  const visibleProducts = useMemo(() => {

    return products.filter((product) => {

      const matchesCategory =

        activeFilter === "All" || product.category === activeFilter;

      const matchesSearch =

        `${product.name} ${product.description} ${product.category}`

          .toLowerCase()

          .includes(search.toLowerCase());



      return matchesCategory && matchesSearch;

    });

}, [products, activeFilter, search]);



  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = cart.reduce(

    (sum, item) => sum + item.price * item.quantity,

    0

  );



  function addToCart(product, quantity = 1) {

    setCart((current) => {

      const existing = current.find((item) => item.id === product.id);



      if (existing) {

        return current.map((item) =>

          item.id === product.id

            ? { ...item, quantity: item.quantity + quantity }

            : item

        );

      }



      return [...current, { ...product, quantity }];

    });



    setNotice(`${product.name} added to cart`);

    window.setTimeout(() => setNotice(""), 2500);

  }



    function updateCartQuantity(productId, change) {

  setCart((current) =>

    current

      .map((item) =>

        item.id === productId

          ? { ...item, quantity: item.quantity + change }

          : item

      )

      .filter((item) => item.quantity > 0)

  );

}



function removeFromCart(productId) {

  setCart((current) =>

    current.filter((item) => item.id !== productId)

  );

}

async function handlePlaceOrder(event) {
  event.preventDefault();

  if (cart.length === 0) {
    setShowCheckout(false);
    setShowCart(true);
    return;
  }

  const form = event.currentTarget;
  const formData = new FormData(form);
  const customer = {
    name: String(formData.get("fullName") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    state: String(formData.get("state") || "").trim(),
    pincode: String(formData.get("pincode") || "").trim(),
  };

  try {
    setOrderSubmitting(true);
    setOrderError("");

const token = localStorage.getItem("customerToken");

const response = await fetch("http://localhost:5000/api/orders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify({
    customer,
    items: cart.map((item) => ({
      id: item.id,
      quantity: item.quantity,
    })),
  }),
});

    const data = await response.json();
    if (!response.ok || !data.success || !data.order) {
      throw new Error(data.message || "Order submit nahi ho paaya.");
    }

    const order = {
      orderNumber: data.order.orderNumber,
      customer,
      items: data.order.items.map((savedItem) => {
        const cartItem = cart.find((item) => Number(item.id) === Number(savedItem.productId));
        return {
          id: savedItem.productId,
          name: savedItem.productName,
          price: Number(savedItem.price),
          quantity: Number(savedItem.quantity),
          image: cartItem?.image || "",
        };
      }),
      total: Number(data.order.totalAmount),
      createdAt: data.order.createdAt || new Date().toLocaleString("en-IN"),
      databaseId: data.order.id,
    };

    setPlacedOrder(order);
    setCart([]);
    setShowCheckout(false);
    setShowCart(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Place Order Error:", error);
    setOrderError(error.message || "Server se connection nahi ho paaya. Backend check karein.");
  } finally {
    setOrderSubmitting(false);
  }
}

  function chooseCategory(label) {

    const categoryFilter = {

      Controllers: "Controllers",

      "Smart Controllers": "Controllers",

      Sensors: "Sensors",

      "Switches & Plugs": "Switches & Plugs",

      Security: "Security",

      "Smart Security": "Security",

      "Power & Accessories": "All",

    };



    setActiveFilter(categoryFilter[label] || "All");

    setSearch("");

    setShowCategories(false);

    setShowAbout(false);

    setShowContact(false);

    setShowSupport(false);

    window.setTimeout(() => {

      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });

    }, 100);

  }



  function openProductDetails(product) {

    setSelectedProduct(product);

    window.scrollTo({ top: 0, behavior: "smooth" });

  }



  function exploreProducts() {

  setShowAbout(false);

  setShowCategories(false);

  setShowContact(false);

  setShowSupport(false);

  setSelectedProduct(null);



  window.setTimeout(() => {

    document.getElementById("products")?.scrollIntoView({

      behavior: "smooth",

      block: "start",

    });

  }, 150);

}

const handleCustomerLogin = (customerData) => {
  setCustomer(customerData);
  setShowCustomerAuth(false);
  setShowCustomerDashboard(true);

  setSelectedProduct(null);
  setShowCart(false);
  setShowCheckout(false);
  setPlacedOrder(null);

  setShowCategories(false);
  setShowAbout(false);
  setShowContact(false);
  setShowSupport(false);

  window.scrollTo({ top: 0, behavior: "smooth" });
};

const handleCustomerLogout = async () => {
  const token = localStorage.getItem("customerToken");

  try {
    if (token) {
      await fetch("http://localhost:5000/api/customers/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error("Customer logout error:", error);
  }

  localStorage.removeItem("customerToken");
  localStorage.removeItem("customerData");

  setCustomer(null);
  setNotice("You have been logged out successfully.");

  window.scrollTo({ top: 0, behavior: "smooth" });
};


  return (

<>
  {showCustomerAuth ? (
    <CustomerAuth
      onClose={() => setShowCustomerAuth(false)}
      onLogin={handleCustomerLogin}
    />
  ) : showCustomerDashboard ? (
    <CustomerDashboard
      customer={customer}
      onLogout={handleCustomerLogout}
      onContinueShopping={() => {
        setShowCustomerDashboard(false);
        setShowCustomerAuth(false);
        setSelectedProduct(null);
        setShowCart(false);
        setShowCheckout(false);
        setPlacedOrder(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    />
  ) : selectedProduct ? (
    <ProductDetails



          product={selectedProduct}

          onAddToCart={addToCart}

          onBack={() => setSelectedProduct(null)}

        />

      ) : (

        <>

          <div className="topbar">

            <div>

              ✉ info@evanovara.com <span>☎ +91 98765 43210</span>

            </div>

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

            <a className="logo" href="#home" aria-label="EVA NOVARA Home" onClick={() => { setShowCategories(false); setShowAbout(false); setShowContact(false); setShowSupport(false); setSelectedProduct(null); }}>

              <img

                src="/images/eva-novara-logo.png"

                alt="EVA NOVARA Technologies"

                className="logo-image"

              />

            </a>

            <button

            className="mobile-menu-toggle"

            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}

            aria-label="Toggle navigation menu"

            aria-expanded={mobileMenuOpen}

          >

            {mobileMenuOpen ? "✕" : "☰"}

          </button>

          <nav className={`main-nav ${mobileMenuOpen ? "mobile-nav-open" : ""}`}

            onClick={() => setMobileMenuOpen(false)}>



          <a href="#home" onClick={() => {

            setShowCategories(false);

            setShowAbout(false);

            setShowContact(false);

            setShowSupport(false);

            setShowCheckout(false);

            setShowCart(false);

            setPlacedOrder(null);

            setSelectedProduct(null);

          }}>Home</a>



          <a href="#products">Products⌄</a>



          <a href="#solutions">Smart Solutions⌄</a>



          <a href="#categories" onClick={(event) => {

            event.preventDefault();

            setShowCategories(true);

            setShowAbout(false);

            setShowContact(false);

            setShowSupport(false);

            setSelectedProduct(null);

            window.scrollTo({ top: 0, behavior: "smooth" });

          }}>Categories⌄</a>



          <a href="#about" onClick={(event) => {

            event.preventDefault();

            setShowAbout(true);

            setShowCategories(false);

            setShowContact(false);

            setShowSupport(false);

            setSelectedProduct(null);

            window.scrollTo({ top: 0, behavior: "smooth" });

          }}>About Us</a>



          <a href="#support" onClick={(event) => {

            event.preventDefault();

            setShowSupport(true);

            setShowAbout(false);

            setShowCategories(false);

            setShowContact(false);

            setSelectedProduct(null);

            window.scrollTo({ top: 0, behavior: "smooth" });

          }}>Support⌄</a>



          <a href="#contact" onClick={(event) => {

            event.preventDefault();

            setShowContact(true);

            setShowAbout(false);

            setShowCategories(false);

            setShowSupport(false);

            setSelectedProduct(null);

            window.scrollTo({ top: 0, behavior: "smooth" });

          }}>Contact</a>

        </nav>



            <form

              className="search-box"

              onSubmit={(event) => {

                event.preventDefault();

                document

                  .getElementById("products")

                  ?.scrollIntoView({ behavior: "smooth" });

              }}

            >

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



{customer ? (
  <div className="customer-nav-account">
    <button
      type="button"
      className="nav-action"
      onClick={() => {
        setShowCustomerDashboard(true);
        setShowCustomerAuth(false);
        setSelectedProduct(null);
        setShowCart(false);
        setShowCheckout(false);
        setPlacedOrder(null);
        setShowCategories(false);
        setShowAbout(false);
        setShowContact(false);
        setShowSupport(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      ♙ <span>My Account</span>
    </button>

    <button
      type="button"
      className="nav-action"
      onClick={handleCustomerLogout}
    >
      Logout
    </button>
  </div>
) : (
  <button
    type="button"
    className="nav-action"
    onClick={() => {
      setSelectedProduct(null);
      setShowCart(false);
      setShowCheckout(false);
      setPlacedOrder(null);
      setShowCategories(false);
      setShowAbout(false);
      setShowContact(false);
      setShowSupport(false);
      setMobileMenuOpen(false);
      setShowCustomerAuth(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }}
  >
    ♙ <span>Login</span>
  </button>
)}

                <button

  className="nav-action cart-action"

  onClick={() => {

    setShowCart(true);

    setShowCheckout(false);

    setPlacedOrder(null);

    setSelectedProduct(null);

    setShowCategories(false);

    setShowAbout(false);

    setShowContact(false);

    setShowSupport(false);

    window.scrollTo({ top: 0, behavior: "smooth" });

  }}

>

  🛒 <span>Cart ({cartCount})</span>

</button>

          </header>



          <main>

            {placedOrder ? (
              <section className="order-confirmation-page">
                <div className="order-confirmation-card">
                  <div className="order-success-icon">✓</div>
                  <span className="checkout-eyebrow">ORDER SUMMARY</span>
                  <h1>Thank You for Your Order!</h1>
                  <p className="order-confirmation-message">
                    Your demo order has been created successfully on this website.
                    No payment has been collected and the order has not been sent
                    to a live order-management system.
                  </p>

                  <div className="order-number-box">
                    <span>Demo Order Number</span>
                    <strong>{placedOrder.orderNumber}</strong>
                    <small>{placedOrder.createdAt}</small>
                  </div>

                  <div className="confirmation-customer">
                    <h3>Delivery Details</h3>
                    <p><strong>{placedOrder.customer.name}</strong></p>
                    <p>{placedOrder.customer.phone} · {placedOrder.customer.email}</p>
                    <p>
                      {placedOrder.customer.address}, {placedOrder.customer.city},
                      {" "}{placedOrder.customer.state} - {placedOrder.customer.pincode}
                    </p>
                  </div>

                  <div className="confirmation-items">
                    <h3>Ordered Products</h3>
                    {placedOrder.items.map((item) => (
                      <div className="confirmation-item" key={item.id}>
                        <span>{item.name} × {item.quantity}</span>
                        <strong>{money(item.price * item.quantity)}</strong>
                      </div>
                    ))}
                    <div className="confirmation-total">
                      <span>Order Total</span>
                      <strong>{money(placedOrder.total)}</strong>
                    </div>
                  </div>

                  <button
                    className="checkout-primary-button"
                    onClick={() => {
                      setPlacedOrder(null);
                      setShowCart(false);
                      setShowCheckout(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Continue Shopping
                  </button>
                </div>
              </section>
            ) : showCheckout ? (
              <section className="checkout-page">
                <div className="checkout-page-heading">
                  <span className="checkout-eyebrow">SECURE CHECKOUT</span>
                  <h1>Delivery Information</h1>
                  <p>Enter your delivery details to save your order.</p>
                </div>

                <div className="checkout-layout">
                  <form className="checkout-form-card" onSubmit={handlePlaceOrder}>
                    <h2>Customer Details</h2>

                    <div className="checkout-form-grid">
                      <label className="checkout-field checkout-field-full">
                        Full Name
                        <input
                          type="text"
                          name="fullName"
                          defaultValue={customer?.name || ""}
                          placeholder="Enter your full name"
                          maxLength="150"
                          autoComplete="name"
                          required
                        />
                      </label>

                      <label className="checkout-field">
                        Email Address
                        <input
                          type="email"
                          name="email"
                          defaultValue={customer?.email || ""}
                          placeholder="name@example.com"
                          maxLength="255"
                          autoComplete="email"
                          required
                        />
                      </label>

                      <label className="checkout-field">
                        Mobile Number
                        <input
                          type="tel"
                          name="phone"
                          defaultValue={customer?.mobile || ""}
                          placeholder="10-digit mobile number"
                          pattern="[6-9][0-9]{9}"
                          title="Enter a valid 10-digit Indian mobile number"
                          maxLength="10"
                          autoComplete="tel"
                          required
                        />
                      </label>

                      <label className="checkout-field checkout-field-full">
                        House / Street / Area
                        <textarea
                          name="address"
                          rows="3"
                          placeholder="Enter your complete delivery address"
                          maxLength="500"
                          autoComplete="street-address"
                          required
                        />
                      </label>

                      <label className="checkout-field">
                        City
                        <input
                          type="text"
                          name="city"
                          placeholder="Enter city"
                          maxLength="100"
                          autoComplete="address-level2"
                          required
                        />
                      </label>

                      <label className="checkout-field">
                        State
                        <input
                          type="text"
                          name="state"
                          placeholder="Enter state"
                          maxLength="100"
                          autoComplete="address-level1"
                          required
                        />
                      </label>

                      <label className="checkout-field">
                        PIN Code
                        <input
                          type="text"
                          name="pincode"
                          placeholder="6-digit PIN code"
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          maxLength="6"
                          autoComplete="postal-code"
                          required
                        />
                      </label>
                    </div>

                    <div className="checkout-demo-notice">
                      <strong>Order submission</strong>
                      <p>Your order and delivery details will be saved to the EVA NOVARA database. Online payment is not enabled yet.</p>
                    </div>

                    {orderError && <p className="empty-results" role="alert">{orderError}</p>}

                    <div className="checkout-form-actions">
                      <button
                        type="button"
                        className="checkout-secondary-button"
                        onClick={() => {
                          setShowCheckout(false);
                          setShowCart(true);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        ← Back to Cart
                      </button>
                      <button type="submit" className="checkout-primary-button" disabled={orderSubmitting}>
                        {orderSubmitting ? "Submitting Order..." : "Place Order →"}
                      </button>
                    </div>
                  </form>

                  <aside className="checkout-summary-card">
                    <h2>Order Summary</h2>
                    <div className="checkout-summary-items">
                      {cart.map((item) => (
                        <div className="checkout-summary-item" key={item.id}>
                          <img src={getImageUrl(item.image)} alt={item.name} />
                          <div>
                            <strong>{item.name}</strong>
                            <span>Qty: {item.quantity}</span>
                          </div>
                          <b>{money(item.price * item.quantity)}</b>
                        </div>
                      ))}
                    </div>

                    <div className="checkout-summary-line">
                      <span>Subtotal</span>
                      <strong>{money(cartTotal)}</strong>
                    </div>
                    <div className="checkout-summary-line">
                      <span>Delivery</span>
                      <strong>Calculated later</strong>
                    </div>
                    <div className="checkout-summary-total">
                      <span>Order Total</span>
                      <strong>{money(cartTotal)}</strong>
                    </div>
                    <p className="checkout-summary-note">
                      Delivery charges and online payment will be confirmed separately.
                    </p>
                  </aside>
                </div>
              </section>
            ) : showCart ? (
              <section className="shopping-cart-page">
                <h1>Shopping Cart</h1>

                <button onClick={() => {
                  setShowCart(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>
                  ← Continue Shopping
                </button>

                {cart.length === 0 ? (
                  <div className="cart-empty-state">
                    <h2>Your cart is empty.</h2>
                    <p>Add products to your cart to continue.</p>
                  </div>
                ) : (
                  <>
                    {cart.map((item) => (
                      <div className="cart-product" key={item.id}>
                        <img src={getImageUrl(item.image)} alt={item.name} />
                        <div>
                          <h3>{item.name}</h3>
                          <p>{money(item.price)}</p>
                          <button
                            aria-label={`Decrease ${item.name} quantity`}
                            onClick={() => updateCartQuantity(item.id, -1)}
                          >
                            −
                          </button>
                          <span> {item.quantity} </span>
                          <button
                            aria-label={`Increase ${item.name} quantity`}
                            onClick={() => updateCartQuantity(item.id, 1)}
                          >
                            +
                          </button>
                          <button onClick={() => removeFromCart(item.id)}>
                            Remove
                          </button>
                        </div>
                        <strong>{money(item.price * item.quantity)}</strong>
                      </div>
                    ))}

                    <div className="cart-total">
                      <h2>Total: {money(cartTotal)}</h2>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCheckout(true);
                          setShowCart(false);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Proceed to Checkout →
                      </button>
                      <p>Review your delivery details on the next step.</p>
                    </div>
                  </>
                )}
              </section>
) : showAbout ? (

              <About onExploreProducts={exploreProducts} />

            ) : showCategories ? (

              <Categories

              onSelectCategory={chooseCategory}

              products={products}

            />

            ) : showContact ? (

              <Contact />

            ) : showSupport ? (

              <Support />

            ) : (

              <>

            <section className="hero" id="home">

              <div className="hero-copy">

                <div className="eyebrow">SMART HOME · SIMPLE CONTROL</div>

                <h1>

                  Smart Automation

                  <br />

                  for a <span>Smarter Home</span>

                </h1>

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

                  <a className="primary-button" href="#products">

                    Shop Smart Home →

                  </a>

                  <a className="video-link" href="#solutions">

                    ⌂   Explore Solutions

                  </a>

                </div>

              </div>



              <div

                className="hero-visual"

                aria-label="Smart home features and mobile app"

              >

                <div className="smart-house">

                  <div className="house-windows" />

                </div>



                <div className="feature-badge feature-auto">

                  <b>💡</b>

                  <span><strong>Auto Light</strong><small>On Motion</small></span>

                </div>



                <div className="feature-badge feature-voice">

                  <b>🎙️</b>

                  <span><strong>Voice Control</strong></span>

                </div>



                <div className="feature-badge feature-mobile">

                  <b>📱</b>

                  <span><strong>Mobile App</strong></span>

                </div>



                <div className="feature-badge feature-sensors">

                  <b>◉</b>

                  <span><strong>Smart Sensors</strong></span>

                </div>



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

                      <span>{icon}   {label}</span>

                      <span className={`switch ${enabled ? "" : "switch-off"}`} />

                    </div>

                  ))}

                  <div className="microphone">🎙</div>

                  <small>Tap to Speak</small>

                </div>



                <div className="voice-command">

                  "Turn on Living Room Light"

                </div>



                <div className="audio-waveform">▂▅▇▃▆█▅▂▆▇▃▅▂</div>



                <div className="assistant-badges">

                  <span>🌐 Works with Google Assistant</span>

                  <span>🔊 Works with Amazon Alexa</span>

                </div>

              </div>

            </section>



            <section className="benefits">

              <div>

                <b>♧</b>

                <span><strong>Smart Home Essentials</strong><small>Designed for everyday comfort</small></span>

              </div>

              <div>

                <b>⬡</b>

                <span><strong>Secure Packaging</strong><small>Safe and reliable delivery</small></span>

              </div>

              <div>

                <b>▤</b>

                <span><strong>Multiple Payment Options</strong><small>UPI, Cards, Net Banking, COD</small></span>

              </div>

              <div>

                <b>☏</b>

                <span><strong>Customer Support</strong><small>We're here to help</small></span>

              </div>

            </section>



            <section className="content-section" id="categories">

              <div className="section-heading">

                <div>

                  <h2>

                    Shop <span className="heading-accent">Smart Home</span> Categories

                  </h2>

                  <p className="section-subtitle">

                    Explore our wide range of smart home solutions for a safer,

                    smarter and more comfortable living.

                  </p>

                </div>

                <button

                  className="outline-button"

                  onClick={() => { setShowCategories(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}

                >

                  View All Categories →

                </button>

              </div>



              <div className="category-grid">

                {categories.map(([icon, label, image]) => (

                  <button

                    className="category-card"

                    key={label}

                    onClick={() => chooseCategory(label)}

                  >

                    <span className="category-icon">

                      {image ? <img src={image} alt={label} /> : icon}

                    </span>

                    <strong>{label}</strong>

                    <small>

                      {label === "Smart Controllers"

                        ? "12+ Products"

                        : label === "Sensors"

                        ? "18+ Products"

                        : label === "Switches & Plugs"

                        ? "15+ Products"

                        : label === "Smart Security"

                        ? "10+ Products"

                        : "8+ Products"}

                    </small>

                    <b className="category-arrow">→</b>

                  </button>

                ))}

              </div>

            </section>



            <section className="content-section products-section" id="products">

              <div className="section-heading product-heading">

                <div>

                  <h2>

                    Featured <span className="heading-accent">Smart Home</span> Products

                  </h2>

                  <p className="section-subtitle">

                    Practical technology for a smarter, more comfortable home.

                  </p>

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

              {productsLoading && (

                <p className="empty-results">Loading products...</p>

              )}



              {productsError && (

                <p className="empty-results" role="alert">

                  {productsError}

                </p>

              )}

              <div className="product-grid">

                {visibleProducts.map((product) => (

                  <article className="product-card" key={product.id}>

                    <div className={`product-art art-${product.id}`}>

                      <img src={getImageUrl(product.image)} alt={product.name} />

                    </div>



                    <div className="product-info">

                      <h3>{product.name}</h3>

                      <p>{product.description}</p>



                      <div

                        className="product-rating"

                        aria-label={`${product.rating} out of 5 stars`}

                      >

                        <span className="stars">★</span>

                        <strong>{product.rating}</strong>

                        <small>({product.reviews})</small>

                      </div>



                      <div className="product-buy">

                        <strong>{money(product.price)}</strong>

                        <button

                          className="view-details-button"

                          onClick={() => openProductDetails(product)}

                        >

                          View Details

                        </button>

                        <button onClick={() => addToCart(product)}>

                          🛒 Add to Cart

                        </button>

                      </div>

                    </div>

                  </article>

                ))}

              </div>



              {!productsLoading && !productsError && visibleProducts.length === 0 && (

                <p className="empty-results">

                  No products found. Try a different search.

                </p>

              )}

            </section>



            <section className="promo-grid" id="solutions">

              <article className="promo promo-voice">

                <div>

                  <h3>Voice Controlled Home</h3>

                  <p>Control compatible lights and appliances with voice commands.</p>

                  <button onClick={() => chooseCategory("Smart Controllers")}>

                    Explore Controllers →

                  </button>

                </div>

                <span>🔊</span>

              </article>



              <article className="promo promo-light">

                <div>

                  <h3>Automatic Lighting</h3>

                  <p>Motion-based lighting for entrances, rooms and corridors.</p>

                  <button onClick={() => chooseCategory("Sensors")}>

                    Explore Sensors →

                  </button>

                </div>

                <span>💡</span>

              </article>



              <article className="promo promo-security">

                <div>

                  <h3>Smart Home Security</h3>

                  <p>Connected sensors and camera concepts for home awareness.</p>

                  <button onClick={() => chooseCategory("Smart Security")}>

                    Explore Security →

                  </button>

                </div>

                <span>⌂</span>

              </article>

            </section>

              </>

            )}

          </main>



          <footer id="contact">

            <div className="footer-brand">

              <strong>EVA NOVARA Technologies</strong>

              <span>Engineering the Future</span>

            </div>

            <div id="about">About Us · Products · Smart Solutions</div>

            <div id="support">Support · Contact: info@evanovara.com</div>

            <div id="login">© 2026 EVA NOVARA Technologies</div>

          </footer>

        </>

      )}



      {notice && <div className="toast">{notice}</div>}





    </>

  );

}
