import { useEffect, useMemo, useState } from "react";
import "./CustomerDashboard.css";

const API_URL = "http://localhost:5000/api/customers";

function money(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status) {
  return String(status || "Pending")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export default function CustomerDashboard({ customer, onLogout, onContinueShopping }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(customer || null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      const token = localStorage.getItem("customerToken");

      if (!token) {
        setError("Please login to view your dashboard.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [profileResponse, ordersResponse] = await Promise.all([
          fetch(`${API_URL}/profile`, { headers }),
          fetch(`${API_URL}/orders`, { headers }),
        ]);

        const profileData = await profileResponse.json();
        const ordersData = await ordersResponse.json();

        if (
          !profileResponse.ok ||
          !profileData.success
        ) {
          throw new Error(profileData.message || "Unable to load profile.");
        }

        if (
          !ordersResponse.ok ||
          !ordersData.success
        ) {
          throw new Error(ordersData.message || "Unable to load orders.");
        }

        if (!cancelled) {
          setProfile(profileData.customer);
          setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);

          localStorage.setItem(
            "customerData",
            JSON.stringify(profileData.customer)
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Dashboard data load nahi ho paaya.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const pending = orders.filter(
      (order) => String(order.status).toLowerCase() === "pending"
    ).length;

    const delivered = orders.filter(
      (order) => String(order.status).toLowerCase() === "delivered"
    ).length;

    const totalSpent = orders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0
    );

    return {
      total: orders.length,
      pending,
      delivered,
      totalSpent,
    };
  }, [orders]);

  function openOrder(order) {
    setSelectedOrder(order);
    setActiveTab("order-details");
  }

  function showOrders() {
    setSelectedOrder(null);
    setActiveTab("orders");
  }

  return (
    <div className="customer-dashboard">
      <header className="customer-dashboard-header">
        <div className="customer-dashboard-brand">
          <span className="dashboard-brand-mark">EV</span>
          <div>
            <strong>EVA NOVARA</strong>
            <small>Customer Account</small>
          </div>
        </div>

        <div className="dashboard-header-actions">
          <button type="button" onClick={onContinueShopping}>
            ← Continue Shopping
          </button>
          <button
            type="button"
            className="dashboard-logout"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="customer-dashboard-layout">
        <aside className="customer-dashboard-sidebar">
          <div className="dashboard-user-card">
            <div className="dashboard-avatar">
              {(profile?.name || "C").charAt(0).toUpperCase()}
            </div>
            <strong>{profile?.name || "Customer"}</strong>
            <span>{profile?.email || ""}</span>
          </div>

          <nav className="dashboard-menu">
            <button
              className={activeTab === "overview" ? "active" : ""}
              onClick={() => {
                setSelectedOrder(null);
                setActiveTab("overview");
              }}
            >
              <span>▦</span> Overview
            </button>

            <button
              className={activeTab === "orders" || activeTab === "order-details" ? "active" : ""}
              onClick={showOrders}
            >
              <span>▤</span> My Orders
            </button>

            <button
              className={activeTab === "profile" ? "active" : ""}
              onClick={() => {
                setSelectedOrder(null);
                setActiveTab("profile");
              }}
            >
              <span>♙</span> My Profile
            </button>
          </nav>

          <div className="dashboard-sidebar-note">
            <strong>Need help?</strong>
            <p>Our support team is here to assist you.</p>
            <a href="mailto:info@evanovara.com">Contact Support →</a>
          </div>
        </aside>

        <main className="customer-dashboard-content">
          <div className="dashboard-welcome">
            <div>
              <span className="dashboard-eyebrow">CUSTOMER ACCOUNT</span>
              <h1>
                {activeTab === "overview"
                  ? `Welcome, ${profile?.name?.split(" ")[0] || "Customer"}!`
                  : activeTab === "orders"
                  ? "My Orders"
                  : activeTab === "order-details"
                  ? "Order Details"
                  : "My Profile"}
              </h1>
              <p>Manage your orders and account details in one place.</p>
            </div>

            <div className="dashboard-welcome-icon">⌂</div>
          </div>

          {loading ? (
            <div className="dashboard-message">Loading your account...</div>
          ) : error ? (
            <div className="dashboard-message dashboard-error" role="alert">
              {error}
              <button type="button" onClick={() => window.location.reload()}>
                Reload Dashboard
              </button>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <>
                  <section className="dashboard-stats">
                    <article className="dashboard-stat-card">
                      <span>Total Orders</span>
                      <strong>{stats.total}</strong>
                      <small>All your orders</small>
                    </article>

                    <article className="dashboard-stat-card">
                      <span>Pending Orders</span>
                      <strong>{stats.pending}</strong>
                      <small>Awaiting processing</small>
                    </article>

                    <article className="dashboard-stat-card">
                      <span>Delivered Orders</span>
                      <strong>{stats.delivered}</strong>
                      <small>Successfully delivered</small>
                    </article>

                    <article className="dashboard-stat-card">
                      <span>Total Order Value</span>
                      <strong>{money(stats.totalSpent)}</strong>
                      <small>Based on saved orders</small>
                    </article>
                  </section>

                  <section className="dashboard-panel">
                    <div className="dashboard-panel-heading">
                      <div>
                        <h2>Recent Orders</h2>
                        <p>Your latest order activity</p>
                      </div>
                      <button type="button" onClick={showOrders}>
                        View All →
                      </button>
                    </div>

                    {orders.length === 0 ? (
                      <div className="dashboard-empty">
                        <span>▤</span>
                        <h3>No orders yet</h3>
                        <p>Your orders will appear here after checkout.</p>
                        <button type="button" onClick={onContinueShopping}>
                          Explore Products
                        </button>
                      </div>
                    ) : (
                      <div className="dashboard-table-wrap">
                        <table className="dashboard-table">
                          <thead>
                            <tr>
                              <th>Order Number</th>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Status</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.slice(0, 5).map((order) => (
                              <tr key={order.id}>
                                <td>{order.order_number}</td>
                                <td>{formatDate(order.created_at)}</td>
                                <td>{money(order.total_amount)}</td>
                                <td>
                                  <span className={`dashboard-status ${statusClass(order.status)}`}>
                                    {order.status || "Pending"}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="dashboard-view-button"
                                    onClick={() => openOrder(order)}
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </>
              )}

              {activeTab === "orders" && (
                <section className="dashboard-panel">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>All Orders</h2>
                      <p>{orders.length} order(s) found</p>
                    </div>
                  </div>

                  {orders.length === 0 ? (
                    <div className="dashboard-empty">
                      <span>▤</span>
                      <h3>No orders found</h3>
                      <p>Start shopping to see your orders here.</p>
                      <button type="button" onClick={onContinueShopping}>
                        Shop Now
                      </button>
                    </div>
                  ) : (
                    <div className="dashboard-table-wrap">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Order Number</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order) => (
                            <tr key={order.id}>
                              <td>{order.order_number}</td>
                              <td>{formatDate(order.created_at)}</td>
                              <td>{order.items?.length || 0}</td>
                              <td>{money(order.total_amount)}</td>
                              <td>
                                <span className={`dashboard-status ${statusClass(order.status)}`}>
                                  {order.status || "Pending"}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="dashboard-view-button"
                                  onClick={() => openOrder(order)}
                                >
                                  Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {activeTab === "order-details" && selectedOrder && (
                <section className="dashboard-panel">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>{selectedOrder.order_number}</h2>
                      <p>Placed on {formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <button type="button" onClick={showOrders}>
                      ← Back to Orders
                    </button>
                  </div>

                  <div className="dashboard-order-meta">
                    <div>
                      <span>Order Status</span>
                      <strong className={`dashboard-status ${statusClass(selectedOrder.status)}`}>
                        {selectedOrder.status || "Pending"}
                      </strong>
                    </div>
                    <div>
                      <span>Payment Status</span>
                      <strong>{selectedOrder.payment_status || "Not Paid"}</strong>
                    </div>
                    <div>
                      <span>Order Total</span>
                      <strong>{money(selectedOrder.total_amount)}</strong>
                    </div>
                  </div>

                  <h3 className="dashboard-subheading">Ordered Products</h3>

                  <div className="dashboard-order-items">
                    {(selectedOrder.items || []).map((item) => (
                      <div className="dashboard-order-item" key={item.id}>
                        <div>
                          <strong>{item.product_name}</strong>
                          <span>Quantity: {item.quantity}</span>
                        </div>
                        <strong>{money(Number(item.price) * Number(item.quantity))}</strong>
                      </div>
                    ))}
                  </div>

                  <h3 className="dashboard-subheading">Delivery Address</h3>
                  <div className="dashboard-address">
                    <strong>{selectedOrder.customer_name}</strong>
                    <p>{selectedOrder.mobile}</p>
                    <p>
                      {selectedOrder.address}, {selectedOrder.city},{" "}
                      {selectedOrder.state} - {selectedOrder.pincode}
                    </p>
                  </div>

                  <div className="dashboard-order-total">
                    <span>Subtotal</span>
                    <strong>{money(selectedOrder.subtotal)}</strong>
                    <span>Delivery Charge</span>
                    <strong>{money(selectedOrder.delivery_charge)}</strong>
                    <span>Grand Total</span>
                    <strong>{money(selectedOrder.total_amount)}</strong>
                  </div>
                </section>
              )}

              {activeTab === "profile" && (
                <section className="dashboard-panel">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>Personal Information</h2>
                      <p>Your registered account details</p>
                    </div>
                  </div>

                  <div className="dashboard-profile-grid">
                    <div>
                      <span>Full Name</span>
                      <strong>{profile?.name || "—"}</strong>
                    </div>
                    <div>
                      <span>Email Address</span>
                      <strong>{profile?.email || "—"}</strong>
                    </div>
                    <div>
                      <span>Mobile Number</span>
                      <strong>{profile?.mobile || "—"}</strong>
                    </div>
                    <div>
                      <span>Customer ID</span>
                      <strong>EVN-{profile?.id ?? "—"}</strong>
                    </div>
                    <div>
                      <span>Account Created</span>
                      <strong>{formatDate(profile?.created_at)}</strong>
                    </div>
                  </div>

                  <p className="dashboard-profile-note">
                    Profile editing will be enabled in a future update.
                  </p>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
