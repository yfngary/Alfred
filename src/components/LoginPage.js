import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/login.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Debug effect to monitor authentication state
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    console.log("Auth State:", {
      hasToken: !!token,
      hasUser: !!user,
      user: user ? JSON.parse(user) : null
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.email) tempErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      tempErrors.email = "Invalid email format";
    if (!formData.password) tempErrors.password = "Password is required";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      setMessage("");

      try {
        console.log("Attempting login with:", {
          email: formData.email,
          timestamp: new Date().toISOString()
        });

        const response = await fetch("http://localhost:5001/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
          credentials: 'include'
        });

        console.log("Login response status:", response.status);
        
        const result = await response.json();
        console.log("Login response:", {
          success: response.ok,
          hasToken: !!result.token,
          hasUser: !!result.user
        });
        
        if (response.ok && result.token && result.user) {
          // Normalize the user object to ensure _id is present
          const normalizedUser = {
            ...result.user,
            _id: result.user.id || result.user._id // Ensure we have _id
          };

          // Store normalized auth data
          localStorage.setItem("user", JSON.stringify(normalizedUser));
          localStorage.setItem("token", result.token);
          
          console.log("Stored auth data:", {
            user: normalizedUser,
            hasToken: !!result.token,
            userId: normalizedUser._id // Log the ID we'll be using
          });

          setMessage("Login successful! Redirecting...");
          
          const from = location.state?.from?.pathname || "/";
          navigate(from, { replace: true });
        } else {
          const errorMessage = result.error || result.message || "Login failed. Please check your credentials.";
          console.error("Login failed:", errorMessage);
          setMessage(errorMessage);
        }
      } catch (error) {
        console.error("Login error:", error);
        setMessage(
          error.message === "Failed to fetch"
            ? "Cannot connect to the server. Please check if the server is running."
            : "An unexpected error occurred. Please try again."
        );
      }

      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>User Login</h2>
      {message && (
        <p className={`text-center text-sm ${message.includes("successful") ? "text-green-500" : "text-red-500"}`}>
          {message}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className={`login-input ${errors.email ? "border-red-500" : ""}`}
          disabled={loading}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className={`login-input ${errors.password ? "border-red-500" : ""}`}
          disabled={loading}
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password}</p>
        )}

        <button 
          type="submit" 
          className={`login-button ${loading ? "opacity-50 cursor-not-allowed" : ""}`} 
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
