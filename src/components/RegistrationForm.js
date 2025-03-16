import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateUsername = (username) => {
    return /^\S*$/.test(username); // Ensures no spaces
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
    if (!formData.name) tempErrors.name = "Name is required";
    if (!formData.email) tempErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      tempErrors.email = "Invalid email format";
    if (!formData.password || formData.password.length < 8)
      tempErrors.password =
        "Password must be at least 8 characters, include 1 uppercase letter, and 1 special character";
    else if (!/[A-Z]/.test(formData.password))
      tempErrors.password = "Password must contain at least 1 uppercase letter";
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password))
      tempErrors.password =
        "Password must contain at least 1 special character";
    if (!formData.agreeToTerms)
      tempErrors.agreeToTerms =
        "You must agree to the Terms of Service and Privacy Policy";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      setMessage("");

      const formDataToSend = new FormData();

      // Append all form data fields
      Object.keys(formData).forEach((key) => {
        if (key === "profilePicture" && formData[key] instanceof File) {
          // Append the profile picture as a file
          formDataToSend.append("profilePicture", formData[key]);
        } else {
          // Append other fields as usual
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
          navigate('/dashboard');
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
      <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg text-center">
        <h2 className="text-xl font-bold mb-4">Registration Successful!</h2>
        <p className="mb-4">Your account has been created successfully.</p>
        <p className="mb-4">
          You can now <Link to="/login">login</Link> using your email and
          password.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h1>Welcome to Alfred App</h1>
      <h2 className="text-xl font-bold mb-4">User Registration</h2>
      {message && <p className="text-center text-sm text-red-500">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleUsernameChange}
          className="w-full p-2 border rounded"
          required
        />
        {errors.username && (
          <p className="text-red-500 text-sm">{errors.username}</p>
        )}
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

        {formData.profilePicture && (
          <img
            src={URL.createObjectURL(formData.profilePicture)}
            alt="Profile Preview"
            style={{
              width: "100px", // Set a fixed width
              height: "100px", // Set a fixed height
              borderRadius: "50%", // Makes it a circle
              objectFit: "cover", // Ensures the image fills the space properly
              marginTop: "10px", // Adds spacing
            }}
          />
        )}

        <input
          type="file"
          name="profilePicture"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password}</p>
        )}

        <input
          type="text"
          name="phone"
          placeholder="Phone (Optional)"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-sm">
            I agree to the{" "}
            <a href="#" className="text-blue-500">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-500">
              Privacy Policy
            </a>
          </label>
        </div>
        {errors.agreeToTerms && (
          <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
