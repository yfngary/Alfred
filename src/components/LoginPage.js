import React, { useState } from "react";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        const response = await fetch("http://localhost:5001/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        
        const result = await response.json();
        console.log("Server Response:", result);
        
        if (response.ok) {
          setMessage("Login successful! Redirecting...");
          setTimeout(() => {
            window.location.href = "/dashboard"; // Redirect after login
          }, 2000);
        } else {
          setMessage(result.error?.toString() || "Login failed.");
        }
      } catch (error) {
        setMessage("Error connecting to the server.");
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">User Login</h2>
      {message && <p className="text-center text-sm text-red-500">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
