import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
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

export default function RegistrationForm() {
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
  const navigate = useNavigate();

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

      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "profilePicture" && formData[key] instanceof File) {
          formDataToSend.append("profilePicture", formData[key]);
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      try {
        const response = await fetch("http://localhost:5001/api/register", {
          method: "POST",
          body: formDataToSend,
        });

        const result = await response.json();
        if (response.ok) {
          localStorage.setItem('token', result.token);
          localStorage.setItem('user', JSON.stringify(result.user));
          setIsRegistered(true);
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          setMessage(result.error?.toString() || "Registration failed.");
          if (result.error === "Email already in use") {
            setErrors((prev) => ({
              ...prev,
              email: "This email is already registered.",
            }));
          }
        }
      } catch (error) {
        setMessage("Error connecting to the server.");
      }

      setLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Registration successful! Redirecting to home page...
          </Alert>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
            background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                m: '0 auto',
                mb: 2,
                bgcolor: 'primary.main',
                width: 56,
                height: 56,
              }}
            >
              <RegisterIcon />
            </Avatar>
            <Typography component="h1" variant="h4" gutterBottom>
              Welcome to Alfred
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Create your account
            </Typography>
          </Box>

          {message && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleUsernameChange}
                error={!!errors.username}
                helperText={errors.username}
                required
              />

              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                required
              />

              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                required
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Phone (Optional)"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />

              <Box sx={{ mt: 2 }}>
                {formData.profilePicture && (
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Avatar
                      src={URL.createObjectURL(formData.profilePicture)}
                      sx={{ width: 100, height: 100, margin: '0 auto' }}
                    />
                  </Box>
                )}
                
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  fullWidth
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

              <FormControlLabel
                control={
                  <Checkbox
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the{" "}
                    <MuiLink href="#" underline="hover">
                      Terms of Service
                    </MuiLink>{" "}
                    and{" "}
                    <MuiLink href="#" underline="hover">
                      Privacy Policy
                    </MuiLink>
                  </Typography>
                }
              />
              {errors.agreeToTerms && (
                <Typography color="error" variant="caption">
                  {errors.agreeToTerms}
                </Typography>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 2,
                  height: 48,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Register"
                )}
              </Button>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{" "}
                  <MuiLink component={Link} to="/login" underline="hover">
                    Login here
                  </MuiLink>
                </Typography>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
