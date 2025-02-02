import React, { useState } from "react";

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    profilePicture: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, profilePicture: e.target.files[0] }));
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.name) tempErrors.name = "Name is required";
    if (!formData.email) tempErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      tempErrors.email = "Invalid email format";
    if (!formData.password || formData.password.length < 8)
      tempErrors.password = "Password must be at least 8 characters, include 1 uppercase letter, and 1 special character";
    else if (!/[A-Z]/.test(formData.password))
      tempErrors.password = "Password must contain at least 1 uppercase letter";
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password))
      tempErrors.password = "Password must contain at least 1 special character";
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
        formDataToSend.append(key, formData[key]);
      });
      
      try {
        const response = await fetch("http://localhost:5000/api/register", {
          method: "POST",
          body: formDataToSend,
        });
        
        const result = await response.json();
        if (response.ok) {
          setMessage("Registration successful!");
        } else {
          setMessage(result.error || "Registration failed.");
        }
      } catch (error) {
        setMessage("Error connecting to the server.");
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">User Registration</h2>
      {message && <p className="text-center text-sm text-red-500">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

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
        {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

        <input
          type="text"
          name="phone"
          placeholder="Phone (Optional)"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <input
          type="file"
          name="profilePicture"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />

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
