import { useState } from "react";
import "./CustomerAuth.css";

const API_URL = "http://localhost:5000/api/customers";

export default function CustomerAuth({ onClose, onLogin }) {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: ""
  });

  function updateField(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const endpoint =
        mode === "signup" ? "/register" : "/login";

      const payload =
        mode === "signup"
          ? form
          : {
              email: form.email,
              password: form.password
            };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Authentication failed.");
      }

      localStorage.setItem("customerToken", data.token);
      localStorage.setItem(
        "customerData",
        JSON.stringify(data.customer)
      );

      setSuccess(data.message);

      onLogin(data.customer);

    } catch (err) {
      setError(err.message || "Server connection failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="customer-auth-page">

      <div className="customer-auth-card">

        <div className="customer-auth-form-section">

          <button
            className="customer-auth-back"
            onClick={onClose}
            type="button"
          >
            ← Back to Store
          </button>

          <div className="customer-auth-brand">
            <img
              src="/images/eva-novara-logo.png"
              alt="EVA NOVARA"
            />
          </div>

          <div className="customer-auth-heading">
            <span>WELCOME TO EVA NOVARA</span>

            <h1>
              {mode === "signup"
                ? "Create an Account"
                : "Welcome Back"}
            </h1>

            <p>
              {mode === "signup"
                ? "Create your account and explore smarter living."
                : "Login to manage your account and orders."}
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {mode === "signup" && (
              <>
                <label>
                  Full Name

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={updateField}
                    minLength="2"
                    maxLength="150"
                    autoComplete="name"
                    required
                  />
                </label>

                <label>
                  Mobile Number

                  <input
                    type="tel"
                    name="mobile"
                    placeholder="Enter mobile number"
                    value={form.mobile}
                    onChange={updateField}
                    pattern="[0-9]{10,15}"
                    maxLength="15"
                    autoComplete="tel"
                    required
                  />
                </label>
              </>
            )}

            <label>
              Email Address

              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={updateField}
                maxLength="150"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password

              <div className="customer-password-field">

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={updateField}
                  minLength="8"
                  maxLength="72"
                  autoComplete={
                    mode === "signup"
                      ? "new-password"
                      : "current-password"
                  }
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>
            </label>

            {mode === "login" && (
              <div className="customer-auth-options">
                <label className="customer-remember">
                  <input type="checkbox" />
                  Remember me
                </label>

                <span>Forgot Password?</span>
              </div>
            )}

            {error && (
              <div className="customer-auth-error" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="customer-auth-success">
                {success}
              </div>
            )}

            <button
              className="customer-auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "signup"
                  ? "Create Account →"
                  : "Login →"}
            </button>

          </form>

          <div className="customer-auth-switch">

            {mode === "login" ? (
              <>
                Don't have an account?

                <button
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setSuccess("");
                  }}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?

                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccess("");
                  }}
                >
                  Login
                </button>
              </>
            )}

          </div>

          <p className="customer-auth-terms">
            By continuing, you agree to EVA NOVARA's
            Terms & Privacy Policy.
          </p>

        </div>

        <div className="customer-auth-visual">

          <div className="customer-auth-visual-content">

            <span>SMARTER LIVING STARTS HERE</span>

            <h2>
              Make Your Home
              <br />
              Smarter & Safer.
            </h2>

            <p>
              Discover intelligent automation,
              smart controllers, connected sensors
              and modern home security solutions.
            </p>

            <div className="customer-auth-features">
              <div>✓ Smart Home Automation</div>
              <div>✓ Intelligent Security</div>
              <div>✓ Connected Technology</div>
            </div>

          </div>

          <div className="customer-auth-visual-decoration">
            ⌂
          </div>

        </div>

      </div>

    </section>
  );
}
