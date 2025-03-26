import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/login.css";

// Memoized star component to prevent re-rendering
const Star = memo(({ top, left, size, delay }) => (
  <div
    className="star"
    style={{
      top,
      left,
      width: size,
      height: size,
      animationDelay: delay
    }}
  ></div>
));

// Memoized floating element
const FloatingElement = memo(({ top, left, size, delay }) => (
  <div 
    style={{
      position: 'absolute',
      width: `${20 + parseInt(size) * 10}px`,
      height: `${20 + parseInt(size) * 10}px`,
      borderRadius: '50%',
      background: `rgba(255, 255, 255, ${0.1 + parseInt(delay) * 0.05})`,
      top,
      left,
      animation: `float ${5 + parseInt(delay) * 3}s ease-in-out infinite alternate`,
      animationDelay: delay,
      zIndex: 1
    }}
  ></div>
));

// Memoized traveler component
const Traveler = memo(() => (
  <div className="traveler">
    <div className="traveler-backpack"></div>
    <div className="traveler-body"></div>
    <div className="traveler-head"></div>
    <div className="traveler-leg traveler-leg-left"></div>
    <div className="traveler-leg traveler-leg-right"></div>
  </div>
));

// Memoized animated background
const AnimatedBackground = memo(({ stars }) => (
  <div className="animated-background">
    {/* Twinkling stars */}
    {stars.map(star => (
      <Star 
        key={star.id}
        top={star.top}
        left={star.left}
        size={star.size}
        delay={star.delay}
      />
    ))}
  
    {/* Path for the traveler */}
    <div className="path"></div>
    
    {/* Animated traveler */}
    <Traveler />
    
    {/* Add some floating elements for depth */}
    {stars.slice(0, 8).map((star, i) => (
      <FloatingElement 
        key={`float-${i}`}
        top={star.top}
        left={star.left}
        size={star.size}
        delay={star.delay}
      />
    ))}
  </div>
));

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Generate random stars only once and memoize them
  const stars = useMemo(() => {
    const generatedStars = [];
    const starCount = 50; // Adjust the number of stars as needed
    
    for (let i = 0; i < starCount; i++) {
      generatedStars.push({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 2 + 1}px`,
        delay: `${Math.random() * 2}s`
      });
    }
    
    return generatedStars;
  }, []);

  // Debug effect to monitor authentication state
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    console.log("Auth State:", {
      hasToken: !!token,
      hasUser: !!user,
      user: user ? JSON.parse(user) : null
    });
    
    // If user is already logged in, redirect to dashboard
    if (token && user) {
      const from = location.state?.from?.pathname || "/dashboard";
      console.log("User already logged in. Redirecting to:", from);
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

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
          
          // Delay navigation slightly to ensure token is stored and confirm with console log
          setTimeout(() => {
            const from = location.state?.from?.pathname || "/dashboard";
            console.log("Login successful! Redirecting to:", from);
            
            // Use both methods to ensure reliability
            // First try React Router navigation
            navigate(from, { replace: true });
            
            // As a backup, if the above doesn't cause a navigation after a short delay,
            // force a full page reload to the correct URL
            setTimeout(() => {
              const currentPath = window.location.pathname;
              if (currentPath === "/login" || currentPath === "/") {
                console.log("Forcing hard navigation after login");
                window.location.href = from.startsWith('/') ? from : `/${from}`;
              }
            }, 200);
          }, 500);
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
    <div className="login-page-wrapper">
      {/* Use memoized background component */}
      <AnimatedBackground stars={stars} />

      <div className="login-container">
        <h2>Adventure Awaits</h2>
        {message && (
          <p className={`text-center text-sm ${message.includes("successful") ? "text-green-500" : "text-red-500"}`}
             style={{ textAlign: 'center', marginBottom: '15px', fontWeight: 'bold' }}>
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
          {errors.email && (
            <p className="text-red-500 text-sm" style={{ marginTop: '-10px', marginBottom: '10px', fontSize: '0.8rem' }}>
              {errors.email}
            </p>
          )}

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
            <p className="text-red-500 text-sm" style={{ marginTop: '-10px', marginBottom: '10px', fontSize: '0.8rem' }}>
              {errors.password}
            </p>
          )}

          <button 
            type="submit" 
            className={`login-button ${loading ? "opacity-50 cursor-not-allowed" : ""}`} 
            disabled={loading}
          >
            {loading ? "Embarking..." : "Begin Your Journey"}
          </button>
        </form>
      </div>
    </div>
  );
}
