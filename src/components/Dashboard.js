import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);
  const [formData, setFormData] = useState({
    tripName: "",
    destination: "",
    startDate: null,
    endDate: null,
    notes: "",
    lodgings: [],
    adults: 1,
    children: 0,
    guests: [],
  });
  const [sortOption, setSortOption] = useState("name");
  const [editingGuest, setEditingGuest] = useState(null);
  const [guestForm, setGuestForm] = useState({
    name: "",
    email: "",
    phone: "",
    relationship: "other",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
  
    if (storedUser && token) {
      const userObj = { ...JSON.parse(storedUser), token };
      setUser(userObj);
      fetchTrips(userObj.id); // Pass user ID instead
    } else {
      setMessage("You must be logged in to view your dashboard.");
    }
  }, []);
  
  const fetchTrips = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // Ensure token is retrieved
  
      const response = await fetch(`http://localhost:5001/api/userTrips`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Ensure token is in the header
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch trips: ${response.statusText}`);
      }
  
      const result = await response.json();
      setTrips(result.trips);
    } catch (error) {
      setMessage("Error connecting to the server.");
      console.error("Fetch Trips Error:", error);
    }
    setLoading(false);
  }; 

  const sortGuests = (guests) => {
    if (sortOption === "name") {
      return [...guests].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "relationship") {
      return [...guests].sort((a, b) =>
        (a.relationship || "other").localeCompare(b.relationship || "other")
      );
    }
    return guests;
  };

  const updateGuest = async (tripId, guestId, updatedGuest) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/${tripId}/guests/${guestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(updatedGuest), // Make sure it includes the updated relationship
        }
      );
      const result = await response.json();
      if (response.ok) {
        fetchTrips(user);
        setEditingGuest(null);
      } else {
        setMessage(result.error || "Failed to update guest.");
      }
    } catch (error) {
      setMessage("Error connecting to the server.");
    }
  };

  const deleteGuest = async (tripId, guestId) => {
    if (!window.confirm("Are you sure you want to remove this guest?")) return;
    try {
      const response = await fetch(
        `http://localhost:5001/api/${tripId}/guests/${guestId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      if (response.ok) {
        fetchTrips(user);
      } else {
        setMessage("Failed to delete guest.");
      }
    } catch (error) {
      setMessage("Error connecting to the server.");
    }
  };

  const updateTrip = async (tripId) => {
    if (!tripId) {
      setMessage("Invalid Trip ID.");
      return;
    }
  
    //console.log("Sending update request for Trip ID:", tripId, formData); // Debugging
  
    try {
      const response = await fetch(`http://localhost:5001/api/trips/${tripId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(formData),
      });
  
      const result = await response.json();
      //console.log("Update Response:", result); // Debugging
  
      if (response.ok && result.success) {
        fetchTrips(); // Refresh UI
        setEditingTrip(null);
        setMessage("Trip updated successfully!");
      } else {
        setMessage(result.error || "Failed to update trip.");
        console.log(result)
      }
    } catch (error) {
      setMessage("Error connecting to the server.");
      console.error("Update error:", error);
    }
  };
  

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {message && <p className="text-red-500 mb-4">{message}</p>}
      {loading ? (
        <p>Loading trips...</p>
      ) : trips.length > 0 ? (
        trips.map((trip) => (
          <div key={trip._id} className="border p-4 rounded mb-4 shadow">
            <button
              onClick={() => {
                setEditingTrip(trip._id);
              }}
              className="bg-blue-500 text-white p-2 rounded ml-2"
            >
              Edit
            </button>
            {editingTrip === trip._id ? (
              <div>
                <input
                  type="text"
                  placeholder="Trip Name"
                  value={formData.tripName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tripName: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Destination"
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
                <label className="block text-sm font-medium">Start Date</label>
                <DatePicker
                  selected={formData.startDate || new Date(trip.startDate)}
                  onChange={(date) =>
                    setFormData({ ...formData, startDate: date })
                  }
                  className="w-full p-2 border rounded"
                />
                <label className="block text-sm font-medium">End Date</label>
                <DatePicker
                  selected={formData.endDate || new Date(trip.endDate)}
                  onChange={(date) =>
                    setFormData({ ...formData, endDate: date })
                  }
                  className="w-full p-2 border rounded"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={
                      () => updateTrip(trip._id)}
                    className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditingTrip(null);
                    }}
                    className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {trip.tripName || "Unnamed Trip"}
                </h2>
                <p>
                  <strong>Destination:</strong> {trip.destination}
                </p>
                <>
                  <p>
                    <strong>Dates:</strong>{" "}
                    {new Date(trip.startDate).toLocaleDateString()} -{" "}
                    {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                </>
              </div>
            )}
            {trip.lodgings && trip.lodgings.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold">Lodgings:</h3>
                <ul className="list-disc list-inside">
                  {trip.lodgings.map((lodging, idx) => (
                    <li key={idx}>
                      <p>{lodging.address}</p>
                      <p className="text-sm text-gray-600">
                        Check-in:{" "}
                        {lodging.checkIn
                          ? new Date(lodging.checkIn).toLocaleDateString()
                          : "N/A"}{" "}
                        - Check-out:{" "}
                        {lodging.checkOut
                          ? new Date(lodging.checkOut).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {trip.guests && trip.guests.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold">Guests:</h3>
                <label className="block text-sm font-medium mb-2">
                  Sort By:
                </label>
                <select
                  className="w-full p-2 border rounded mb-4"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="name">A-Z</option>
                  <option value="relationship">Relationship</option>
                </select>
                <ul className="list-disc list-inside">
                  {sortGuests(trip.guests).map((guest, idx) => (
                    <li key={idx}>
                      {editingGuest === guest._id ? (
                        <div>
                          <input
                            type="text"
                            value={guestForm.name}
                            onChange={(e) =>
                              setGuestForm({
                                ...guestForm,
                                name: e.target.value,
                              })
                            }
                            placeholder="Name"
                            className="w-full p-2 border rounded"
                          />
                          <input
                            type="email"
                            value={guestForm.email}
                            onChange={(e) =>
                              setGuestForm({
                                ...guestForm,
                                email: e.target.value,
                              })
                            }
                            placeholder="Email"
                            className="w-full p-2 border rounded mt-2"
                          />
                          <input
                            type="tel"
                            value={guestForm.phone}
                            onChange={(e) =>
                              setGuestForm({
                                ...guestForm,
                                phone: e.target.value,
                              })
                            }
                            placeholder="Phone"
                            className="w-full p-2 border rounded mt-2"
                          />
                          <label className="block text-sm font-medium mt-2">
                            Relationship:
                          </label>
                          <select
                            className="w-full p-2 border rounded"
                            value={guestForm.relationship || "other"}
                            onChange={(e) =>
                              setGuestForm((prev) => ({
                                ...prev,
                                relationship: e.target.value,
                              }))
                            }
                          >
                            <option value="spouse">Spouse</option>
                            <option value="child">Child</option>
                            <option value="friend">Friend</option>
                            <option value="parent">Parent</option>
                            <option value="other">Other</option>
                          </select>
                          <button
                            onClick={() =>
                              updateGuest(trip._id, guest._id, guestForm)
                            }
                            className="bg-green-500 text-white p-2 rounded mt-2"
                          >
                            Save
                          </button>

                          <button
                            onClick={() => setEditingGuest(null)}
                            className="bg-gray-500 text-white p-2 rounded mt-2 ml-2"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p>
                            <strong>Name:</strong> {guest.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Email:</strong> {guest.email || "N/A"} |{" "}
                            <strong>Phone:</strong> {guest.phone || "N/A"}
                            <strong>Relationship:</strong>{" "}
                            {guest.relationship || "N/A"}
                          </p>
                          <button
                            onClick={() => {
                              setEditingGuest(guest._id);
                              setGuestForm(guest);
                            }}
                            className="bg-blue-500 text-white p-2 rounded mt-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteGuest(trip._id, guest._id)}
                            className="bg-red-500 text-white p-2 rounded mt-2 ml-2"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))
      ) : (
        <p>No trips found.</p>
      )}
    </div>
  );
}
