import React, { useState, useEffect, useMemo, memo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../styles/login.css";

// Reuse the same star component from the login page
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

// Reuse the same floating element from the login page
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

// Memoized compass component for the reset page
const Compass = memo(() => (
  <div className="compass">
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="2" fill="#4a90e2" />
      <path d="M12 5V7" stroke="white" strokeWidth="1.5" />
      <path d="M12 17V19" stroke="white" strokeWidth="1.5" />
      <path d="M5 12H7" stroke="white" strokeWidth="1.5" />
      <path d="M17 12H19" stroke="white" strokeWidth="1.5" />
      <path d="M12 12L16 8" stroke="#4a90e2" strokeWidth="1.5" />
      <path d="M12 12L8 16" stroke="#4a90e2" strokeWidth="1.5" />
    </svg>
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
    
    {/* Add compass in the center */}
    <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)' }}>
      <Compass />
    </div>
    
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

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ 
    password: "", 
    confirmPassword: "" 
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tokenValid, setTokenValid] = useState(null); // null = checking, true = valid, false = invalid
  const [showPassword, setShowPassword] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

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

  // Verify token validity when component mounts
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/auth/verify-reset-token/${token}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        
        const result = await response.json();
        
        if (response.ok) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setMessage(result.error || "This password reset link is invalid or has expired. Please request a new one.");
        }
      } catch (error) {
        console.error("Token verification error:", error);
        setTokenValid(false);
        setMessage("An error occurred while verifying your reset link. Please try again.");
      }
    };
    
    if (token) {
      verifyToken();
    } else {
      setTokenValid(false);
      setMessage("No reset token provided. Please request a new password reset link.");
    }
  }, [token]);

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
    
    if (!formData.password) {
      tempErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      tempErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      tempErrors.password = "Password must contain at least 1 uppercase letter";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      tempErrors.password = "Password must contain at least 1 special character";
    }
    
    if (!formData.confirmPassword) {
      tempErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      setMessage("");

      try {
        const response = await fetch("http://localhost:5001/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            token, 
            password: formData.password 
          }),
        });
        
        const result = await response.json();
        
        if (response.ok) {
          setMessage("Your password has been reset successfully!");
          setResetComplete(true);
          // Redirect to login page after a delay
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setMessage(result.error || "Failed to reset password. Please try again.");
        }
      } catch (error) {
        console.error("Password reset error:", error);
        setMessage("An unexpected error occurred. Please try again.");
      }

      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <AnimatedBackground stars={stars} />

      <div className="login-container">
        <h2>{resetComplete ? "Password Reset Complete" : "Reset Your Password"}</h2>
        
        {message && (
          <p className={`text-center text-sm ${message.includes("success") ? "text-green-500" : "text-red-500"}`}
             style={{ textAlign: 'center', marginBottom: '15px', fontWeight: 'bold' }}>
            {message}
          </p>
        )}
        
        {tokenValid === false ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'white', marginBottom: '20px' }}>
              This password reset link is invalid or has expired.
            </p>
            <button 
              className="login-button"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </div>
        ) : tokenValid === null ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'white' }}>Verifying reset link...</p>
          </div>
        ) : resetComplete ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'white', marginBottom: '20px' }}>
              Your password has been reset successfully! You will be redirected to the login page in a few seconds.
            </p>
            <button 
              className="login-button"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
                Enter your new password below. Make sure it's secure!
              </p>
              
              <div style={{ position: 'relative', marginBottom: '15px' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="New Password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`login-input ${errors.password ? "border-red-500" : ""}`}
                  disabled={loading}
                />
                <span 
                  style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm" style={{ marginTop: '-10px', marginBottom: '15px', fontSize: '0.8rem' }}>
                  {errors.password}
                </p>
              )}
              
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`login-input ${errors.confirmPassword ? "border-red-500" : ""}`}
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm" style={{ marginTop: '5px', fontSize: '0.8rem' }}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button 
              type="submit" 
              className={`login-button ${loading ? "opacity-50 cursor-not-allowed" : ""}`} 
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            
            <p 
              style={{ 
                textAlign: 'center', 
                marginTop: '15px', 
                cursor: 'pointer',
                textDecoration: 'underline',
                color: '#4a90e2'
              }}
              onClick={() => navigate('/login')}
            >
              Back to Login
            </p>
          </form>
        )}
      </div>
    </div>
  );
} 