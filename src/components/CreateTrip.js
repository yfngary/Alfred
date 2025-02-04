import React, { useState, useEffect } from "react";

export default function CreateTrip() {
  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setMessage("You must be logged in to create a trip.");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.destination) tempErrors.destination = "Destination is required";
    if (!formData.startDate) tempErrors.startDate = "Start date is required";
    if (!formData.endDate) tempErrors.endDate = "End date is required";
    else if (new Date(formData.startDate) > new Date(formData.endDate))
      tempErrors.endDate = "End date must be after start date";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage("You must be logged in to create a trip.");
      return;
    }
    if (validate()) {
      setLoading(true);
      setMessage("");
      
      try {
        const response = await fetch("http://localhost:5001/api/trips", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ ...formData, userId: user.id }),
        });
        
        const result = await response.json();
        console.log("Server Response:", result);
        
        if (response.ok) {
          setMessage("Trip created successfully!");
          setFormData({ destination: "", startDate: "", endDate: "", notes: "" });
        } else {
          setMessage(result.error?.toString() || "Failed to create trip.");
        }
      } catch (error) {
        setMessage("Error connecting to the server.");
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Create a New Trip</h2>
      {message && <p className="text-center text-sm text-red-500">{message}</p>}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="destination"
            placeholder="Destination"
            value={formData.destination}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
          {errors.destination && <p className="text-red-500 text-sm">{errors.destination}</p>}

          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
          {errors.startDate && <p className="text-red-500 text-sm">{errors.startDate}</p>}

          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
          {errors.endDate && <p className="text-red-500 text-sm">{errors.endDate}</p>}

          <textarea
            name="notes"
            placeholder="Additional Notes (Optional)"
            value={formData.notes}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? "Creating Trip..." : "Create Trip"}
          </button>
        </form>
      ) : (
        <p className="text-center text-red-500">You must be logged in to create a trip.</p>
      )}
    </div>
  );
}
