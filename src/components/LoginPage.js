import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [showResendForm, setShowResendForm] = useState(false);
  const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isRequestingPasswordReset, setIsRequestingPasswordReset] = useState(false);

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

  // Check for verification success in URL query params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const isVerified = searchParams.get('verified') === 'true';
    
    if (isVerified) {
      setMessage("Your email has been verified successfully! You can now log in.");
    }
    
    // Check if we should show resend verification form
    if (location.state?.resendVerification) {
      setShowResendForm(true);
      if (location.state.email) {
        setResendEmail(location.state.email);
      }
    }
  }, [location]);

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

  const validateResendEmail = () => {
    if (!resendEmail) {
      setErrors(prev => ({ ...prev, resendEmail: "Email is required" }));
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resendEmail)) {
      setErrors(prev => ({ ...prev, resendEmail: "Invalid email format" }));
      return false;
    }
    setErrors(prev => ({ ...prev, resendEmail: "" }));
    return true;
  };

  const validateForgotPasswordEmail = () => {
    if (!forgotPasswordEmail) {
      setErrors(prev => ({ ...prev, forgotPasswordEmail: "Email is required" }));
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail)) {
      setErrors(prev => ({ ...prev, forgotPasswordEmail: "Invalid email format" }));
      return false;
    }
    setErrors(prev => ({ ...prev, forgotPasswordEmail: "" }));
    return true;
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
          
          // Check if this is an email verification error
          if (result.error === "Email not verified") {
            setMessage("Your email is not verified. Please check your inbox for the verification email or request a new one.");
            // Store the email for resend form
            setResendEmail(formData.email);
            setShowResendForm(true);
          } else {
            setMessage(errorMessage);
          }
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

  const handleResendVerification = async (e) => {
    e.preventDefault();
    if (validateResendEmail()) {
      setIsResendingVerification(true);
      
      try {
        const response = await fetch("http://localhost:5001/api/auth/resend-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resendEmail }),
        });
        
        const result = await response.json();
        
        if (response.ok) {
          setMessage("Verification email has been resent. Please check your inbox.");
          setShowResendForm(false);
        } else {
          setMessage(result.error || result.message || "Failed to resend verification email.");
        }
      } catch (error) {
        console.error("Resend verification error:", error);
        setMessage("An unexpected error occurred. Please try again.");
      }
      
      setIsResendingVerification(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (validateForgotPasswordEmail()) {
      setIsRequestingPasswordReset(true);
      setMessage("");
      
      try {
        const response = await fetch("http://localhost:5001/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotPasswordEmail }),
        });
        
        const result = await response.json();
        
        if (response.ok) {
          setMessage("Password reset link sent to your email. Please check your inbox.");
          // Keep the form open but provide feedback
        } else {
          setMessage(result.error || result.message || "Failed to request password reset.");
        }
      } catch (error) {
        console.error("Password reset request error:", error);
        setMessage("An unexpected error occurred. Please try again.");
      }
      
      setIsRequestingPasswordReset(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Use memoized background component */}
      <AnimatedBackground stars={stars} />

      <div className="login-container">
        <h2>Adventure Awaits</h2>
        {message && (
          <p className={`text-center text-sm ${message.includes("successful") || message.includes("verified") || message.includes("reset link sent") ? "text-green-500" : "text-red-500"}`}
             style={{ textAlign: 'center', marginBottom: '15px', fontWeight: 'bold' }}>
            {message}
          </p>
        )}
        
        {showForgotPasswordForm ? (
          <>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Reset Your Password</h3>
              <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem', color: 'white' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <input
                type="email"
                name="forgotPasswordEmail"
                placeholder="Email"
                value={forgotPasswordEmail}
                onChange={(e) => {
                  setForgotPasswordEmail(e.target.value);
                  if (errors.forgotPasswordEmail) {
                    setErrors(prev => ({ ...prev, forgotPasswordEmail: "" }));
                  }
                }}
                className={`login-input ${errors.forgotPasswordEmail ? "border-red-500" : ""}`}
                disabled={isRequestingPasswordReset}
              />
              {errors.forgotPasswordEmail && (
                <p className="text-red-500 text-sm" style={{ marginTop: '-10px', marginBottom: '10px', fontSize: '0.8rem' }}>
                  {errors.forgotPasswordEmail}
                </p>
              )}
              
              <button 
                type="submit" 
                className={`login-button ${isRequestingPasswordReset ? "opacity-50 cursor-not-allowed" : ""}`} 
                disabled={isRequestingPasswordReset}
              >
                {isRequestingPasswordReset ? "Sending..." : "Send Reset Link"}
              </button>
              
              <p 
                style={{ 
                  textAlign: 'center', 
                  marginTop: '15px', 
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  color: '#4a90e2'
                }}
                onClick={() => setShowForgotPasswordForm(false)}
              >
                Back to Login
              </p>
            </form>
          </>
        ) : showResendForm ? (
          <>
            <form onSubmit={handleResendVerification} className="space-y-4">
              <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Resend Verification Email</h3>
              <input
                type="email"
                name="resendEmail"
                placeholder="Email"
                value={resendEmail}
                onChange={(e) => {
                  setResendEmail(e.target.value);
                  if (errors.resendEmail) {
                    setErrors(prev => ({ ...prev, resendEmail: "" }));
                  }
                }}
                className={`login-input ${errors.resendEmail ? "border-red-500" : ""}`}
                disabled={isResendingVerification}
              />
              {errors.resendEmail && (
                <p className="text-red-500 text-sm" style={{ marginTop: '-10px', marginBottom: '10px', fontSize: '0.8rem' }}>
                  {errors.resendEmail}
                </p>
              )}
              
              <button 
                type="submit" 
                className={`login-button ${isResendingVerification ? "opacity-50 cursor-not-allowed" : ""}`} 
                disabled={isResendingVerification}
              >
                {isResendingVerification ? "Sending..." : "Resend Verification Email"}
              </button>
              
              <p 
                style={{ 
                  textAlign: 'center', 
                  marginTop: '15px', 
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  color: '#4a90e2'
                }}
                onClick={() => setShowResendForm(false)}
              >
                Back to Login
              </p>
            </form>
          </>
        ) : (
          <>
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

              <p 
                style={{ 
                  textAlign: 'right', 
                  marginTop: '5px', 
                  marginBottom: '15px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  color: '#4a90e2',
                  fontSize: '0.9rem'
                }}
                onClick={() => setShowForgotPasswordForm(true)}
              >
                Forgot Password?
              </p>

              <button 
                type="submit" 
                className={`login-button ${loading ? "opacity-50 cursor-not-allowed" : ""}`} 
                disabled={loading}
              >
                {loading ? "Embarking..." : "Begin Your Journey"}
              </button>
              
              <p 
                style={{ 
                  textAlign: 'center', 
                  marginTop: '15px', 
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  color: '#4a90e2'
                }}
                onClick={() => setShowResendForm(true)}
              >
                Need to verify your email?
              </p>
              <p 
                style={{ 
                  textAlign: 'center', 
                  marginTop: '15px', 
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  color: '#4a90e2'
                }}
              >
                <Link to="/register" style={{ color: '#4a90e2' }}>Need to register an account?</Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
