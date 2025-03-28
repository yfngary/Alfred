import React, { useState, useMemo, memo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "../utils/axiosConfig";
import "../styles/login.css"; // Use same styles as login page
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Stack,
  Link as MuiLink
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  CloudUpload as UploadIcon,
  HowToReg as RegisterIcon
} from "@mui/icons-material";

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

// Memoized airplane component
const Airplane = memo(() => (
  <div 
    className="airplane"
    style={{
      position: 'absolute',
      width: '50px',
      height: '50px',
      zIndex: 2,
      animation: 'fly 20s linear infinite',
      transformOrigin: 'center',
    }}
  >
    {/* Airplane trail effect */}
    <div className="airplane-trail" style={{
      position: 'absolute',
      width: '60px',
      height: '1px',
      background: 'linear-gradient(to left, rgba(255,255,255,0.5), rgba(255,255,255,0))',
      right: '45px',
      top: '50%',
      transform: 'translateY(-50%)',
    }}></div>
    
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 19.5L21.5 12L2.5 4.5L6.5 12L2.5 19.5Z" fill="white" stroke="#4a90e2" strokeWidth="0.5"/>
      <path d="M6.5 12L12 14.5" stroke="#4a90e2" strokeWidth="0.5"/>
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
  
    {/* Path for the airplane */}
    <div 
      style={{
        position: 'absolute',
        top: '50%',
        left: '0',
        width: '100%',
        height: '1px',
        borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
        zIndex: 1
      }}
    ></div>
    
    {/* Animated airplane */}
    <Airplane />
    
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
    
    {/* Add custom CSS animation for the airplane */}
    <style>
      {`
        @keyframes fly {
          0% {
            transform: translate(-60px, 30vh) rotate(15deg);
          }
          10% {
            transform: translate(10vw, 25vh) rotate(5deg);
          }
          20% {
            transform: translate(20vw, 35vh) rotate(-5deg);
          }
          30% {
            transform: translate(30vw, 20vh) rotate(10deg);
          }
          40% {
            transform: translate(40vw, 25vh) rotate(0deg);
          }
          50% {
            transform: translate(50vw, 35vh) rotate(-8deg);
          }
          60% {
            transform: translate(60vw, 30vh) rotate(5deg);
          }
          70% {
            transform: translate(70vw, 20vh) rotate(12deg);
          }
          80% {
            transform: translate(80vw, 28vh) rotate(-2deg);
          }
          90% {
            transform: translate(90vw, 32vh) rotate(8deg);
          }
          100% {
            transform: translate(110vw, 25vh) rotate(0deg);
          }
        }
      `}
    </style>
  </div>
));

export default function RegistrationForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const inviteCode = searchParams.get('invite');

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    profilePicture: null,
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateUsername = (username) => {
    return /^\S*$/.test(username);
  };

  const handleUsernameChange = (e) => {
    const { name, value } = e.target;

    if (name === "username" && !validateUsername(value)) {
      setErrors((prev) => ({
        ...prev,
        username: "Username cannot contain spaces",
      }));
    } else {
      setErrors((prev) => ({ ...prev, username: "" }));
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profilePicture: file }));
    }
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.username) tempErrors.username = "Username is required";
    if (!formData.name) tempErrors.name = "Name is required";
    if (!formData.email) tempErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      tempErrors.email = "Invalid email format";
    if (!formData.password || formData.password.length < 8)
      tempErrors.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(formData.password))
      tempErrors.password = "Password must contain at least 1 uppercase letter";
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password))
      tempErrors.password = "Password must contain at least 1 special character";
    if (!formData.agreeToTerms)
      tempErrors.agreeToTerms = "You must agree to the Terms of Service and Privacy Policy";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      setMessage("");
      setSuccessMessage("");

      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "profilePicture" && formData[key] instanceof File) {
          formDataToSend.append("profilePicture", formData[key]);
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      try {
        console.log('Sending registration request...');
        const response = await axios.post("/api/auth/register", formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('Registration response:', response.data);
        
        // Set success message and registered state
        setIsRegistered(true);
        setSuccessMessage(response.data.message || "Registration successful! Please check your email to verify your account.");
        
        // Redirect to login page after a delay
        setTimeout(() => {
          navigate('/login');
        }, 5000);
        
      } catch (error) {
        console.error('Registration error:', error.response || error);
        setMessage(error.response?.data?.error || "Registration failed.");
        if (error.response?.data?.error === "Email already in use") {
          setErrors((prev) => ({
            ...prev,
            email: "This email is already registered.",
          }));
        }
      }

      setLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="login-page-wrapper">
        <AnimatedBackground stars={stars} />
        <div className="login-container" style={{ maxWidth: "500px" }}>
          <h2>Registration Complete</h2>
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage || "Registration successful! Please check your email to verify your account."}
          </Alert>
          <Typography sx={{ color: 'white', mb: 2, textAlign: 'center' }}>
            You will be redirected to the login page in a few seconds.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-wrapper">
      <AnimatedBackground stars={stars} />
      
      <div className="login-container" style={{ maxWidth: "500px", overflowY: "auto", maxHeight: "90vh" }}>
        <h2>Join the Adventure</h2>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          After registration, you will need to verify your email address before you can log in.
        </Alert>

        {message && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleUsernameChange}
              className={`login-input ${errors.username ? "border-red-500" : ""}`}
              disabled={loading}
            />
            {errors.username && (
              <p className="text-red-500 text-sm" style={{ marginTop: '5px', fontSize: '0.8rem' }}>
                {errors.username}
              </p>
            )}
          </div>

          <div className="mb-4">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className={`login-input ${errors.name ? "border-red-500" : ""}`}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-red-500 text-sm" style={{ marginTop: '5px', fontSize: '0.8rem' }}>
                {errors.name}
              </p>
            )}
          </div>

          <div className="mb-4">
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
              <p className="text-red-500 text-sm" style={{ marginTop: '5px', fontSize: '0.8rem' }}>
                {errors.email}
              </p>
            )}
          </div>

          <div className="mb-4" style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
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
            {errors.password && (
              <p className="text-red-500 text-sm" style={{ marginTop: '5px', fontSize: '0.8rem' }}>
                {errors.password}
              </p>
            )}
          </div>

          <div className="mb-4">
            <input
              type="tel"
              name="phone"
              placeholder="Phone (Optional)"
              value={formData.phone}
              onChange={handleChange}
              className="login-input"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              {formData.profilePicture && (
                <Avatar
                  src={URL.createObjectURL(formData.profilePicture)}
                  sx={{ width: 80, height: 80, mb: 1 }}
                />
              )}
              
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadIcon />}
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    borderColor: 'white'
                  }
                }}
              >
                Upload Profile Picture
                <input
                  type="file"
                  hidden
                  name="profilePicture"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
            </Box>
          </div>

          <div className="mb-4">
            <FormControlLabel
              control={
                <Checkbox
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  sx={{ color: 'white', '&.Mui-checked': { color: '#4a90e2' } }}
                />
              }
              label={
                <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                  I agree to the{" "}
                  <MuiLink href="#" sx={{ color: '#4a90e2' }}>
                    Terms of Service
                  </MuiLink>{" "}
                  and{" "}
                  <MuiLink href="#" sx={{ color: '#4a90e2' }}>
                    Privacy Policy
                  </MuiLink>
                </Typography>
              }
            />
            {errors.agreeToTerms && (
              <p className="text-red-500 text-sm" style={{ marginTop: '5px', fontSize: '0.8rem' }}>
                {errors.agreeToTerms}
              </p>
            )}
          </div>

          <button
            type="submit"
            className={`login-button ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              "Begin Your Journey"
            )}
          </button>

          <p 
            style={{ 
              textAlign: 'center', 
              marginTop: '15px', 
              cursor: 'pointer',
              textDecoration: 'underline',
              color: '#4a90e2'
            }}
          >
            <Link to="/login" style={{ color: '#4a90e2' }}>Already have an account? Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
