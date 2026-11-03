import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const API_URL = "http://localhost:5000/api";

function AdminDashboard() {
  const navigate = useNavigate();
  const adminData = JSON.parse(
    localStorage.getItem("adminData") || "{}"
  );

  const [statistics, setStatistics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  // Admin Activity Logs
const [activityLogs, setActivityLogs] = useState([]);
const [activityLogsLoading, setActivityLogsLoading] = useState(true);
const [activityLogsError, setActivityLogsError] = useState("");
  const emptyProduct = {
    name: "", description: "", price: "", category: "", image: "",
    stock: 0, rating: 0, reviews: 0, overview: "",
    features: "", working: "", applications: "", specifications: "", box_contents: ""
  };
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productError, setProductError] = useState("");
  const [productSaving, setProductSaving] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [selectedProductImage, setSelectedProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // Customer management (customers who have placed orders)
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customerError, setCustomerError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  // Complete customer order history
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [customerHistoryLoading, setCustomerHistoryLoading] = useState(false);
  const [customerHistoryError, setCustomerHistoryError] = useState("");

  // Contact message management
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messageError, setMessageError] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [messageFilter, setMessageFilter] = useState("All");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [updatingMessage, setUpdatingMessage] = useState(null);

  // Admin profile and account security
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileTab, setProfileTab] = useState("profile");
  const [profile, setProfile] = useState({
    name: adminData.name || "",
    email: adminData.email || "",
    role: adminData.role || "Admin",
    created_at: ""
  });
  const [profileForm, setProfileForm] = useState({
    name: adminData.name || "",
    email: adminData.email || ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });




  const getToken = () => localStorage.getItem("adminToken");

  const handleUnauthorized = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/admin/login", { replace: true });
  };

  // Dashboard statistics
  const fetchDashboard = async () => {
    const response = await fetch(`${API_URL}/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      handleUnauthorized();
      return;
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to load dashboard.");
    }

    setStatistics(data.statistics);
  };

  // Fetch all orders
  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrderError("");

    try {
      const response = await fetch(`${API_URL}/admin/orders`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to fetch orders.");
      }

      setOrders(data.orders || []);
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setOrdersLoading(false);
    }
  };


  const listToText = (value) => {
    if (Array.isArray(value)) return value.join("\n");
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.join("\n") : value;
      } catch { return value; }
    }
    return "";
  };

  const textToList = (value) =>
    String(value || "").split("\n").map((v) => v.trim()).filter(Boolean);

  const fetchProducts = async () => {
    setProductsLoading(true);
    setProductError("");
    try {
      const response = await fetch(`${API_URL}/admin/products`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to fetch products.");
      setProducts(data.products || []);
    } catch (err) {
      setProductError(err.message);
    } finally {
      setProductsLoading(false);
    }
  };

  const getProductImageUrl = (image) => {
    if (!image) return "";
    return image.startsWith("/uploads/")
      ? `http://localhost:5000${image}`
      : image;
  };

  const openAddProduct = () => {
    setEditingProductId(null);
    setProductForm({ ...emptyProduct });
    setSelectedProductImage(null);
    setImagePreview("");
    setProductError("");
    setShowProductForm(true);
  };

  const openEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      ...emptyProduct, ...product,
      features: listToText(product.features),
      working: listToText(product.working),
      applications: listToText(product.applications),
      specifications: listToText(product.specifications),
      box_contents: listToText(product.box_contents)
    });
    setSelectedProductImage(null);
    setImagePreview(getProductImageUrl(product.image));
    setProductError("");
    setShowProductForm(true);
  };

  const handleProductFieldChange = (e) => {
    const { name, value } = e.target;

    // Keep the legacy image URL field working alongside file uploads.
    if (name === "image") {
      setSelectedProductImage(null);
      setImagePreview(getProductImageUrl(value));
    }

    setProductForm((old) => ({ ...old, [name]: value }));
  };

  const handleProductImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setProductError("Only JPG, PNG and WebP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProductError("Image size must not exceed 5 MB.");
      e.target.value = "";
      return;
    }

    setProductError("");
    setSelectedProductImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProductSaving(true);
    setProductError("");

    try {
      const editing = Boolean(editingProductId);
      let imagePath = productForm.image || "";

      // Upload the selected image first. The returned path is saved with product data.
      if (selectedProductImage) {
        const formData = new FormData();
        formData.append("image", selectedProductImage);

        const uploadResponse = await fetch(
          `${API_URL}/admin/products/upload-image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${getToken()}`
            },
            body: formData
          }
        );

        const uploadData = await uploadResponse.json();

        if (uploadResponse.status === 401 || uploadResponse.status === 403) {
          handleUnauthorized();
          return;
        }

        if (!uploadResponse.ok || !uploadData.success || !uploadData.image) {
          throw new Error(uploadData.message || "Product image upload failed.");
        }

        imagePath = uploadData.image;
      }

      const payload = {
        ...productForm,
        image: imagePath,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        rating: Number(productForm.rating || 0),
        reviews: Number(productForm.reviews || 0),
        features: textToList(productForm.features),
        working: textToList(productForm.working),
        applications: textToList(productForm.applications),
        specifications: textToList(productForm.specifications),
        box_contents: textToList(productForm.box_contents)
      };

      const response = await fetch(
        editing ? `${API_URL}/admin/products/${editingProductId}` : `${API_URL}/admin/products`,
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save product.");
      }

      setShowProductForm(false);
      setEditingProductId(null);
      setSelectedProductImage(null);
      setImagePreview("");
      await fetchProducts();
      await fetchDashboard();
      alert(editing ? "Product updated successfully!" : "Product added successfully!");
    } catch (err) {
      setProductError(err.message || "Unable to save product.");
    } finally {
      setProductSaving(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This action cannot be undone.`)) return;
    setProductError("");
    try {
      const response = await fetch(`${API_URL}/admin/products/${product.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to delete product.");
      await fetchProducts();
      await fetchDashboard();
    } catch (err) {
      setProductError(err.message);
    }
  };


  const fetchCustomers = async () => {
    setCustomersLoading(true);
    setCustomerError("");
    try {
      const response = await fetch(`${API_URL}/admin/customers`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to fetch customers.");
      }
      setCustomers(data.customers || []);
    } catch (err) {
      setCustomerError(err.message);
    } finally {
      setCustomersLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const search = customerSearch.trim().toLowerCase();
    if (!search) return true;
    return [
      customer.customer_name, customer.email, customer.mobile,
      customer.city, customer.state
    ].some((value) => String(value || "").toLowerCase().includes(search));
  });

  // Fetch complete order history for one customer
  const handleViewCustomerHistory = async (customer) => {
    setSelectedCustomer(customer);
    setCustomerHistory([]);
    setCustomerHistoryError("");
    setCustomerHistoryLoading(true);

    try {
      const params = new URLSearchParams({
        customer_name: customer.customer_name || "",
        email: customer.email || "",
        mobile: customer.mobile || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        pincode: customer.pincode || ""
      });
      const response = await fetch(`${API_URL}/admin/customers/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load customer order history.");
      }
      const rawOrders = data.orders || data.history || data.orderHistory || [];
      const rawItems = data.items || data.orderItems || [];
      const normalizedOrders = (Array.isArray(rawOrders) ? rawOrders : []).map((order) => {
        const nestedItems = order.items || order.order_items;
        const matchingItems = Array.isArray(nestedItems)
          ? nestedItems
          : rawItems.filter((item) => Number(item.order_id) === Number(order.id));
        return { ...order, items: matchingItems };
      });
      setCustomerHistory(normalizedOrders);
    } catch (err) {
      setCustomerHistoryError(err.message);
    } finally {
      setCustomerHistoryLoading(false);
    }
  };

  // Fetch contact messages from the protected admin API
  const fetchMessages = async () => {
    setMessagesLoading(true);
    setMessageError("");
    try {
      const response = await fetch(`${API_URL}/admin/messages`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to fetch contact messages.");
      }

      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (err) {
      setMessageError(err.message);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleMessageStatusChange = async (messageId, status) => {
    setUpdatingMessage(messageId);
    setMessageError("");
    try {
      const response = await fetch(`${API_URL}/admin/messages/${messageId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update message status.");
      }

      setMessages((current) => current.map((message) =>
        Number(message.id) === Number(messageId) ? { ...message, status } : message
      ));
      setSelectedMessage((current) =>
        current && Number(current.id) === Number(messageId) ? { ...current, status } : current
      );
      await fetchDashboard();
    } catch (err) {
      setMessageError(err.message);
    } finally {
      setUpdatingMessage(null);
    }
  };

  const filteredMessages = messages.filter((message) => {
    const matchesStatus = messageFilter === "All" || (message.status || "New") === messageFilter;
    const query = messageSearch.trim().toLowerCase();
    const matchesSearch = !query || [
      message.name, message.email, message.subject, message.message
    ].some((value) => String(value || "").toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

    // Fetch Admin Activity Logs
const fetchActivityLogs = async () => {
  setActivityLogsLoading(true);
  setActivityLogsError("");

  try {
    const response = await fetch(
      `${API_URL}/admin/activity-logs?limit=50`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      handleUnauthorized();
      return;
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to load activity logs.");
    }

    setActivityLogs(data.logs || []);

  } catch (error) {
    setActivityLogsError(error.message);
  } finally {
    setActivityLogsLoading(false);
  }
};

  useEffect(() => {
    const loadData = async () => {
      if (!getToken()) {
        handleUnauthorized();
        return;
      }

      try {
        await fetchDashboard();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }

      fetchOrders();
      fetchProducts();
      fetchCustomers();
      fetchMessages();
      fetchActivityLogs();
    };

    loadData();
  }, []);

  // Update order status
  const handleStatusChange = async (orderId, status) => {
    setUpdatingOrder(orderId);
    setOrderError("");

    try {
      const response = await fetch(
        `${API_URL}/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Status update failed.");
      }

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((previous) => ({ ...previous, status }));
      }

      alert("Order status updated successfully!");
      fetchDashboard();
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setUpdatingOrder(null);
    }
  };

  // View order details
  const handleViewOrder = async (orderId) => {
    setDetailsLoading(true);
    setSelectedOrder(null);
    setOrderItems([]);

    try {
      const response = await fetch(
        `${API_URL}/admin/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load order details.");
      }

      setSelectedOrder(data.order);
      setOrderItems(data.items || []);
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };


  const openProfileModal = async () => {
    setShowProfileModal(true);
    setProfileTab("profile");
    setProfileError("");
    setProfileSuccess("");
    setProfileLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load admin profile.");
      }

      const current = data.admin || {};
      setProfile(current);
      setProfileForm({
        name: current.name || "",
        email: current.email || ""
      });
      localStorage.setItem("adminData", JSON.stringify(current));
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileFieldChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((old) => ({ ...old, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(profileForm)
      });
      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update profile.");
      }

      const updated = data.admin || {};
      setProfile((old) => ({ ...old, ...updated }));
      setProfileForm({
        name: updated.name || "",
        email: updated.email || ""
      });
      localStorage.setItem("adminData", JSON.stringify(updated));
      setProfileSuccess(data.message || "Profile updated successfully.");
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordFieldChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((old) => ({ ...old, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(passwordForm)
      });
      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to change password.");
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setProfileSuccess(data.message || "Password changed. Please login again.");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");
      setShowProfileModal(false);
      alert(data.message || "Password changed successfully. Please login again.");
      navigate("/admin/login", { replace: true });
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
  const token = localStorage.getItem("adminToken");

  try {
    if (token) {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    console.error("Logout activity logging failed:", error);
  } finally {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");

    navigate("/admin/login", { replace: true });
  }
};

  const formatPrice = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const cards = statistics
    ? [
        {
          title: "Total Orders",
          value: statistics.totalOrders ?? 0,
          icon: "📦",
        },
        {
          title: "Total Revenue",
          value: formatPrice(statistics.totalRevenue),
          icon: "💰",
        },
        {
          title: "Pending Orders",
          value: statistics.pendingOrders ?? 0,
          icon: "⏳",
        },
        {
          title: "Paid Orders",
          value: statistics.paidOrders ?? 0,
          icon: "✅",
        },
        {
          title: "Total Products",
          value: statistics.totalProducts ?? 0,
          icon: "🛍️",
        },
        {
          title: "Total Customers",
          value: statistics.totalCustomers ?? 0,
          icon: "👥",
        },
        {
          title: "New Messages",
          value: statistics.newMessages ?? 0,
          icon: "✉️",
        },
      ]
    : [];

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <h1>
            EVA <span>NOVARA</span>
          </h1>
          <p>Administration Panel</p>
        </div>

        <div className="admin-header-right">
          <span>Welcome, {adminData.name || "Admin"}</span>
          <button type="button" className="admin-profile-button" onClick={openProfileModal}>
            My Profile
          </button>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="admin-dashboard-content">
        {/* Dashboard Statistics */}
        <div className="admin-dashboard-title">
          <div>
            <h2>Dashboard Overview</h2>
            <p>Welcome to your store administration dashboard.</p>
          </div>
        </div>

        {error && <div className="admin-dashboard-error">{error}</div>}

        {statistics && (
          <div className="admin-stats-grid">
            {cards.map((card) => (
              <div className="admin-stat-card" key={card.title}>
                <div className="admin-stat-icon">{card.icon}</div>
                <div>
                  <p>{card.title}</p>
                  <h3>{card.value}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Management */}
        <section className="admin-orders-section">
          <div className="admin-section-heading">
            <div>
              <h2>Order Management</h2>
              <p>Manage customer orders and delivery status.</p>
            </div>

            <button
              className="admin-refresh-button"
              onClick={fetchOrders}
              disabled={ordersLoading}
            >
              {ordersLoading ? "Loading..." : "↻ Refresh Orders"}
            </button>
          </div>

          {orderError && (
            <div className="admin-dashboard-error">{orderError}</div>
          )}

          {ordersLoading ? (
            <div className="admin-orders-message">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="admin-orders-message">No orders found.</div>
          ) : (
            <div className="admin-orders-table-wrapper">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Customer</th>
                    <th>Mobile</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Order Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="admin-order-number">
                        {order.order_number || `#${order.id}`}
                      </td>

                      <td>{order.customer_name}</td>
                      <td>{order.mobile}</td>
                      <td className="admin-order-amount">
                        {formatPrice(order.total_amount)}
                      </td>

                      <td>
                        <span
                          className={`admin-status-badge payment-${String(
                            order.payment_status || ""
                          ).toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {order.payment_status || "Unknown"}
                        </span>
                      </td>

                      <td>
                        <select
                          className={`admin-order-status status-${String(
                            order.status || ""
                          ).toLowerCase()}`}
                          value={order.status}
                          disabled={updatingOrder === order.id}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                        >
                          {[
                            "Pending",
                            "Processing",
                            "Shipped",
                            "Delivered",
                            "Cancelled",
                          ].map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>{formatDate(order.created_at)}</td>

                      <td>
                        <button
                          className="admin-view-order-button"
                          onClick={() => handleViewOrder(order.id)}
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

        {/* Product Management */}
        <section className="admin-products-section">
          <div className="admin-section-heading">
            <div>
              <h2>Product Management</h2>
              <p>Add, edit and manage all products in your store.</p>
            </div>
            <div className="admin-product-heading-actions">
              <button className="admin-refresh-button" onClick={fetchProducts} disabled={productsLoading}>
                {productsLoading ? "Loading..." : "↻ Refresh Products"}
              </button>
              <button className="admin-add-product-button" onClick={openAddProduct}>+ Add New Product</button>
            </div>
          </div>
          {productError && <div className="admin-dashboard-error">{productError}</div>}
          {productsLoading ? (
            <div className="admin-orders-message">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="admin-orders-message">No products found. Add your first product.</div>
          ) : (
            <div className="admin-orders-table-wrapper">
              <table className="admin-products-table">
                <thead><tr><th>Image</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th>Action</th></tr></thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.image ? <img className="admin-product-thumb" src={getProductImageUrl(product.image)} alt={product.name} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : "—"}</td>
                      <td className="admin-product-name">{product.name}</td>
                      <td>{product.category || "-"}</td>
                      <td className="admin-order-amount">{formatPrice(product.price)}</td>
                      <td><span className={Number(product.stock) > 0 ? "admin-stock-in" : "admin-stock-out"}>{product.stock ?? 0}</span></td>
                      <td>{Number(product.rating || 0).toFixed(1)} ({product.reviews || 0})</td>
                      <td><div className="admin-product-actions">
                        <button className="admin-product-edit" onClick={() => openEditProduct(product)}>Edit</button>
                        <button className="admin-product-delete" onClick={() => handleDeleteProduct(product)}>Delete</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Customer Management */}
        <section className="admin-customers-section">
          <div className="admin-section-heading">
            <div>
              <h2>Customer Management</h2>
              <p>View customers who have placed orders and their purchase summary.</p>
            </div>
            <button className="admin-refresh-button" onClick={fetchCustomers} disabled={customersLoading}>
              {customersLoading ? "Loading..." : "↻ Refresh Customers"}
            </button>
          </div>

          {customerError && <div className="admin-dashboard-error">{customerError}</div>}

          <div className="admin-customer-toolbar">
            <input
              type="search"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search by name, email, mobile or city..."
              aria-label="Search customers"
            />
            <span>{filteredCustomers.length} customer(s)</span>
          </div>

          {customersLoading ? (
            <div className="admin-orders-message">Loading customers...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="admin-orders-message">
              {customers.length === 0 ? "No customers with orders found." : "No matching customers found."}
            </div>
          ) : (
            <div className="admin-orders-table-wrapper">
              <table className="admin-customers-table">
                <thead>
                  <tr>
                    <th>Customer</th><th>Email</th><th>Mobile</th><th>Location</th>
                    <th>Total Orders</th><th>Total Spent</th><th>Last Order</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer, index) => (
                    <tr key={`${customer.email || customer.mobile || "customer"}-${index}`}>
                      <td className="admin-customer-name">{customer.customer_name || "-"}</td>
                      <td>{customer.email || "-"}</td>
                      <td>{customer.mobile || "-"}</td>
                      <td>{[customer.city, customer.state, customer.pincode].filter(Boolean).join(", ") || "-"}</td>
                      <td>{customer.totalOrders ?? 0}</td>
                      <td className="admin-order-amount">{formatPrice(customer.totalSpent)}</td>
                      <td>{formatDate(customer.lastOrderDate)}</td>
                      <td>
                        <button type="button" className="admin-customer-view-button" onClick={() => handleViewCustomerHistory(customer)}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Contact Message Management */}
        <section className="admin-messages-section">
          <div className="admin-section-heading">
            <div>
              <h2>Contact Message Management</h2>
              <p>View customer enquiries and manage their response status.</p>
            </div>
            <button
              className="admin-refresh-button"
              onClick={fetchMessages}
              disabled={messagesLoading}
            >
              {messagesLoading ? "Loading..." : "↻ Refresh Messages"}
            </button>
          </div>

          {messageError && <div className="admin-dashboard-error">{messageError}</div>}

          <div className="admin-message-toolbar">
            <input
              type="search"
              value={messageSearch}
              onChange={(e) => setMessageSearch(e.target.value)}
              placeholder="Search name, email, subject or message..."
              aria-label="Search contact messages"
            />
            <select
              value={messageFilter}
              onChange={(e) => setMessageFilter(e.target.value)}
              aria-label="Filter messages by status"
            >
              {["All", "New", "Read", "Replied"].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <span>{filteredMessages.length} message(s)</span>
          </div>

          {messagesLoading ? (
            <div className="admin-orders-message">Loading contact messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="admin-orders-message">
              {messages.length === 0 ? "No contact messages found." : "No matching messages found."}
            </div>
          ) : (
            <div className="admin-orders-table-wrapper">
              <table className="admin-messages-table">
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Received</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((message) => (
                    <tr key={message.id}>
                      <td className="admin-customer-name">{message.name || "-"}</td>
                      <td>{message.email || "-"}</td>
                      <td className="admin-message-subject">{message.subject || "-"}</td>
                      <td>{formatDate(message.created_at)}</td>
                      <td>
                        <select
                          className={`admin-message-status status-${String(message.status || "New").toLowerCase()}`}
                          value={message.status || "New"}
                          disabled={updatingMessage === message.id}
                          onChange={(e) => handleMessageStatusChange(message.id, e.target.value)}
                        >
                          {["New", "Read", "Replied"].map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-customer-view-button"
                          onClick={() => {
                            setSelectedMessage(message);
                            if ((message.status || "New") === "New") {
                              handleMessageStatusChange(message.id, "Read");
                            }
                          }}
                        >
                          View Message
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
                  {/* Admin Activity Logs */}
        <section className="admin-orders-section admin-activity-section">
          <div className="admin-section-heading">
            <div>
              <h2>Admin Activity Logs</h2>
              <p>Monitor admin login, logout and account activities.</p>
            </div>

            <button
              type="button"
              className="admin-refresh-button"
              onClick={fetchActivityLogs}
              disabled={activityLogsLoading}
            >
              {activityLogsLoading ? "Loading..." : "↻ Refresh Logs"}
            </button>
          </div>

          {activityLogsError && (
            <div className="admin-dashboard-error">
              {activityLogsError}
            </div>
          )}

          {activityLogsLoading ? (
            <div className="admin-orders-message">
              Loading activity logs...
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="admin-orders-message">
              No activity logs found.
            </div>
          ) : (
            <div className="admin-orders-table-wrapper">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>IP Address</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>

                <tbody>
                  {activityLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <strong>{log.admin_name || "Unknown Admin"}</strong>
                        <br />
                        <small>{log.admin_email || ""}</small>
                      </td>

                      <td>
                        <span className="admin-activity-badge">
                          {log.action}
                        </span>
                      </td>

                      <td>{log.description || "-"}</td>

                      <td>{log.ip_address || "-"}</td>

                      <td>
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString("en-IN")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>


      {/* Contact Message Details Modal */}
      {selectedMessage && (
        <div className="admin-modal-overlay" onClick={() => setSelectedMessage(null)}>
          <div className="admin-message-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2>Contact Message</h2>
                <p>Message #{selectedMessage.id}</p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedMessage(null)}
                aria-label="Close message details"
              >
                ×
              </button>
            </div>

            <div className="admin-message-detail-grid">
              <div><span>Sender Name</span><strong>{selectedMessage.name || "-"}</strong></div>
              <div><span>Email Address</span><strong>{selectedMessage.email || "-"}</strong></div>
              <div><span>Subject</span><strong>{selectedMessage.subject || "-"}</strong></div>
              <div><span>Received</span><strong>{formatDate(selectedMessage.created_at)}</strong></div>
              <div><span>Current Status</span><strong>{selectedMessage.status || "New"}</strong></div>
            </div>

            <div className="admin-message-body">
              <h3>Message</h3>
              <p>{selectedMessage.message || "No message content."}</p>
            </div>

            <div className="admin-message-modal-actions">
              <label>
                Update Status
                <select
                  className="admin-message-status"
                  value={selectedMessage.status || "New"}
                  disabled={updatingMessage === selectedMessage.id}
                  onChange={(e) => handleMessageStatusChange(selectedMessage.id, e.target.value)}
                >
                  {["New", "Read", "Replied"].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <button type="button" className="admin-product-cancel" onClick={() => setSelectedMessage(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Order History Modal */}
      {selectedCustomer && (
        <div className="admin-modal-overlay" onClick={() => { if (!customerHistoryLoading) setSelectedCustomer(null); }}>
          <div className="admin-customer-history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div><h2>Customer Order History</h2><p>{selectedCustomer.customer_name || "Customer"}</p></div>
              <button type="button" className="admin-modal-close" onClick={() => setSelectedCustomer(null)} disabled={customerHistoryLoading} aria-label="Close customer history">×</button>
            </div>
            <div className="admin-customer-history-summary">
              <div><span>Email</span><strong>{selectedCustomer.email || "-"}</strong></div>
              <div><span>Mobile</span><strong>{selectedCustomer.mobile || "-"}</strong></div>
              <div><span>Total Orders</span><strong>{selectedCustomer.totalOrders ?? 0}</strong></div>
              <div><span>Total Spent</span><strong>{formatPrice(selectedCustomer.totalSpent)}</strong></div>
            </div>
            {customerHistoryLoading ? (
              <div className="admin-orders-message">Loading customer order history...</div>
            ) : customerHistoryError ? (
              <div className="admin-dashboard-error">{customerHistoryError}</div>
            ) : customerHistory.length === 0 ? (
              <div className="admin-orders-message">No order history found for this customer.</div>
            ) : (
              <div className="admin-customer-history-list">
                {customerHistory.map((order, index) => (
                  <section className="admin-customer-history-order" key={order.id || order.order_number || index}>
                    <div className="admin-customer-history-order-heading">
                      <div><strong>{order.order_number || `Order #${order.id || index + 1}`}</strong><span>{formatDate(order.created_at || order.order_date)}</span></div>
                      <div className="admin-customer-history-order-total"><strong>{formatPrice(order.total_amount || order.total)}</strong><span>{order.status || "Pending"}</span></div>
                    </div>
                    <div className="admin-customer-history-address">{[order.address, order.city, order.state, order.pincode].filter(Boolean).join(", ") || "Address not available"}</div>
                    {order.items && order.items.length > 0 ? (
                      <div className="admin-modal-table-wrapper">
                        <table className="admin-orders-table admin-history-items-table">
                          <thead><tr><th>Product</th><th>Quantity</th><th>Price</th><th>Total</th></tr></thead>
                          <tbody>{order.items.map((item, itemIndex) => (
                            <tr key={item.id || `${order.id}-${itemIndex}`}>
                              <td>{item.product_name || item.name || `Product #${item.product_id || "-"}`}</td>
                              <td>{item.quantity ?? "-"}</td><td>{formatPrice(item.price)}</td>
                              <td>{formatPrice(item.total || item.line_total || (Number(item.price || 0) * Number(item.quantity || 0)))}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    ) : <p className="admin-history-no-items">Product details are not available for this order.</p>}
                    <div className="admin-customer-history-order-footer"><span>Payment: {order.payment_status || "Unknown"}</span><strong>Order Total: {formatPrice(order.total_amount || order.total)}</strong></div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Profile and Security Modal */}
      {showProfileModal && (
        <div className="admin-modal-overlay" onClick={() => !profileSaving && !passwordSaving && setShowProfileModal(false)}>
          <div className="admin-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2>Admin Account</h2>
                <p>Manage your profile and account security.</p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setShowProfileModal(false)}
                disabled={profileSaving || passwordSaving}
                aria-label="Close profile"
              >×</button>
            </div>

            <div className="admin-profile-tabs">
              <button type="button" className={profileTab === "profile" ? "active" : ""} onClick={() => { setProfileTab("profile"); setProfileError(""); setProfileSuccess(""); }}>
                Profile Information
              </button>
              <button type="button" className={profileTab === "password" ? "active" : ""} onClick={() => { setProfileTab("password"); setProfileError(""); setProfileSuccess(""); }}>
                Change Password
              </button>
            </div>

            {profileError && <div className="admin-dashboard-error">{profileError}</div>}
            {profileSuccess && <div className="admin-profile-success">{profileSuccess}</div>}

            {profileLoading ? (
              <div className="admin-orders-message">Loading profile...</div>
            ) : profileTab === "profile" ? (
              <>
                <div className="admin-profile-summary">
                  <div><span>Admin Role</span><strong>{profile.role || "Admin"}</strong></div>
                  <div><span>Account Created</span><strong>{profile.created_at ? formatDate(profile.created_at) : "Not available"}</strong></div>
                </div>
                <form onSubmit={handleProfileSubmit}>
                  <div className="admin-profile-form-grid">
                    <label>
                      Full Name
                      <input name="name" value={profileForm.name} onChange={handleProfileFieldChange} minLength="2" maxLength="150" required />
                    </label>
                    <label>
                      Email Address
                      <input name="email" type="email" value={profileForm.email} onChange={handleProfileFieldChange} required />
                    </label>
                  </div>
                  <div className="admin-product-form-actions">
                    <button type="button" className="admin-product-cancel" onClick={() => setShowProfileModal(false)}>Close</button>
                    <button type="submit" className="admin-add-product-button" disabled={profileSaving}>
                      {profileSaving ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <form onSubmit={handlePasswordSubmit}>
                <div className="admin-profile-form-grid admin-profile-password-grid">
                  <label>
                    Current Password
                    <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordFieldChange} autoComplete="current-password" required />
                  </label>
                  <label>
                    New Password
                    <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordFieldChange} minLength="10" autoComplete="new-password" required />
                  </label>
                  <label className="admin-profile-full-width">
                    Confirm New Password
                    <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordFieldChange} minLength="10" autoComplete="new-password" required />
                  </label>
                </div>
                <p className="admin-profile-password-hint">Use at least 10 characters, including uppercase, lowercase, a number and a special character. After changing the password, you will be logged out and must sign in again.</p>
                <div className="admin-product-form-actions">
                  <button type="button" className="admin-product-cancel" onClick={() => setShowProfileModal(false)} disabled={passwordSaving}>Cancel</button>
                  <button type="submit" className="admin-add-product-button" disabled={passwordSaving}>
                    {passwordSaving ? "Updating..." : "Change Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showProductForm && (
        <div className="admin-modal-overlay" onClick={() => !productSaving && setShowProductForm(false)}>
          <div className="admin-product-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div><h2>{editingProductId ? "Edit Product" : "Add New Product"}</h2><p>Enter product information and details.</p></div>
              <button type="button" className="admin-modal-close" onClick={() => setShowProductForm(false)} disabled={productSaving}>×</button>
            </div>
            {productError && <div className="admin-dashboard-error">{productError}</div>}
            <form className="admin-product-form" onSubmit={handleProductSubmit}>
              <div className="admin-product-form-grid">
                <label>Product Name *<input name="name" value={productForm.name} onChange={handleProductFieldChange} required /></label>
                <label>Category *<input name="category" value={productForm.category} onChange={handleProductFieldChange} required /></label>
                <label>Price (₹) *<input name="price" type="number" min="0" step="0.01" value={productForm.price} onChange={handleProductFieldChange} required /></label>
                <label>Stock *<input name="stock" type="number" min="0" value={productForm.stock} onChange={handleProductFieldChange} required /></label>
                <label>Rating<input name="rating" type="number" min="0" max="5" step="0.1" value={productForm.rating} onChange={handleProductFieldChange} /></label>
                <label>Reviews Count<input name="reviews" type="number" min="0" value={productForm.reviews} onChange={handleProductFieldChange} /></label>
                <label className="admin-product-full-width">
                  Upload Product Image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProductImageChange}
                  />
                  <small>JPG, PNG or WebP. Maximum file size: 5 MB.</small>
                </label>

                {imagePreview && (
                  <div className="admin-product-full-width admin-product-image-preview">
                    <span>Image Preview</span>
                    <img src={imagePreview} alt="Product preview" />
                  </div>
                )}

                <label className="admin-product-full-width">
                  Or use an existing Image URL
                  <input
                    name="image"
                    type="url"
                    value={productForm.image}
                    onChange={handleProductFieldChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </label>
                <label className="admin-product-full-width">Short Description *<textarea name="description" rows="2" value={productForm.description} onChange={handleProductFieldChange} required /></label>
                <label className="admin-product-full-width">Overview<textarea name="overview" rows="3" value={productForm.overview || ""} onChange={handleProductFieldChange} /></label>
                <label>Features (one per line)<textarea name="features" rows="4" value={productForm.features || ""} onChange={handleProductFieldChange} /></label>
                <label>Working Process (one per line)<textarea name="working" rows="4" value={productForm.working || ""} onChange={handleProductFieldChange} /></label>
                <label>Applications (one per line)<textarea name="applications" rows="4" value={productForm.applications || ""} onChange={handleProductFieldChange} /></label>
                <label>Specifications (one per line)<textarea name="specifications" rows="4" value={productForm.specifications || ""} onChange={handleProductFieldChange} /></label>
                <label className="admin-product-full-width">Box Contents (one per line)<textarea name="box_contents" rows="3" value={productForm.box_contents || ""} onChange={handleProductFieldChange} /></label>
              </div>
              <div className="admin-product-form-actions">
                <button type="button" className="admin-product-cancel" onClick={() => setShowProductForm(false)} disabled={productSaving}>Cancel</button>
                <button type="submit" className="admin-add-product-button" disabled={productSaving}>{productSaving ? "Saving..." : editingProductId ? "Update Product" : "Save Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {(detailsLoading || selectedOrder) && (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            if (!detailsLoading) setSelectedOrder(null);
          }}
        >
          <div
            className="admin-order-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {detailsLoading ? (
              <p>Loading order details...</p>
            ) : (
              <>
                <div className="admin-modal-header">
                  <div>
                    <h2>Order Details</h2>
                    <p>
                      {selectedOrder.order_number || `#${selectedOrder.id}`}
                    </p>
                  </div>

                  <button
                    className="admin-modal-close"
                    onClick={() => setSelectedOrder(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="admin-order-info-grid">
                  <div>
                    <span>Customer Name</span>
                    <strong>{selectedOrder.customer_name}</strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>{selectedOrder.email}</strong>
                  </div>

                  <div>
                    <span>Mobile</span>
                    <strong>{selectedOrder.mobile}</strong>
                  </div>

                  <div>
                    <span>Order Date</span>
                    <strong>{formatDate(selectedOrder.created_at)}</strong>
                  </div>

                  <div>
                    <span>Payment Status</span>
                    <strong>{selectedOrder.payment_status}</strong>
                  </div>

                  <div>
                    <span>Order Status</span>
                    <strong>{selectedOrder.status}</strong>
                  </div>
                </div>

                <div className="admin-order-address">
                  <h3>Delivery Address</h3>
                  <p>
                    {selectedOrder.address}, {selectedOrder.city},{" "}
                    {selectedOrder.state} - {selectedOrder.pincode}
                  </p>
                </div>

                <h3 className="admin-modal-products-title">Order Products</h3>

                <div className="admin-modal-table-wrapper">
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orderItems.map((item) => (
                        <tr key={item.id}>
                          <td>
                            {item.product_name || `Product #${item.product_id}`}
                          </td>
                          <td>{item.quantity}</td>
                          <td>{formatPrice(item.price)}</td>
                          <td>{formatPrice(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-order-total">
                  <p>
                    Subtotal: <strong>{formatPrice(selectedOrder.subtotal)}</strong>
                  </p>
                  <p>
                    Delivery Charge:{" "}
                    <strong>
                      {formatPrice(selectedOrder.delivery_charge)}
                    </strong>
                  </p>
                  <h3>
                    Total Amount:{" "}
                    {formatPrice(selectedOrder.total_amount)}
                  </h3>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
