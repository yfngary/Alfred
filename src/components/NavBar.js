import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Define widths for collapsed and expanded states
const collapsedWidth = "60px";
const expandedWidth = "250px";

// Function to generate nav style based on state
const navStyle = (isOpen) => ({
  position: "fixed",
  left: 0,
  top: 0,
  height: "100vh",
  width: isOpen ? expandedWidth : collapsedWidth,
  backgroundColor: "#3B82F6",
  color: "white",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  transition: "width 0.3s ease",
  overflow: "hidden",
});

// Styles for the toggle button
const toggleButtonStyle = {
  backgroundColor: "transparent",
  border: "none",
  color: "white",
  cursor: "pointer",
  fontSize: "1.2rem",
  marginBottom: "1rem",
};

const headerStyle = {
  fontSize: "1.5rem",
  fontWeight: "bold",
  marginBottom: "1rem",
};

const selectStyle = {
  marginBottom: "2rem",
  padding: "0.5rem",
  borderRadius: "4px",
  border: "none",
};

const linkStyle = {
  color: "white",
  textDecoration: "none",
  marginBottom: "1rem",
};

export default function NavBar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const [selectedTrip, setSelectedTrip] = useState("");
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token"); // Ensure token is retrieved
    // Fetch the user's trips from the API
    fetch(`http://localhost:5001/api/userTrips`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Ensure token is in the header
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.trips) {
          setTrips(data.trips);
        }
      })
      .catch((error) => console.error("Error fetching trips:", error));
  }, []);

// Then update your handleTripChange function
const handleTripChange = (e) => {
  const tripId = e.target.value;
  setSelectedTrip(tripId); // Store the selected trip ID in state
  if (tripId) {
    navigate(`/trips/${tripId}`); // Navigate to the trip dashboard
  }
};

  return (
    <nav style={navStyle(isOpen)}>
      <button
        style={toggleButtonStyle}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? "<" : ">"}
      </button>

      {isOpen && (
        <>
          <h1 style={headerStyle}>Trip Planner</h1>
          <select
            value={selectedTrip}
            onChange={handleTripChange}
            style={selectStyle}
            disabled={trips.length === 0}
          >
            {trips.length === 0 ? (
              <option value="">No Trips Found</option>
            ) : (
              <>
                <option value="" disabled>
                  Select a Trip
                </option>
                {trips.map((trip) => (
                  <option key={trip._id} value={trip._id}>
                    {trip.tripName}
                  </option>
                ))}
              </>
            )}
          </select>
          <Link to="/createTrip" style={linkStyle}>
            Create Trip
          </Link>
          <Link to="/notifications" style={linkStyle}>
            Notifications
          </Link>
          <div style={{ marginTop: "auto", width: "100%" }}>
            <div
              style={{
                width: "100%",
                padding: "1rem",
                backgroundColor: "#2563EB",
                borderRadius: "4px",
                textAlign: "center",
              }}
            >
              <Link to="/profilePage" style={{ ...linkStyle, marginBottom: 0 }}>
                Profile
              </Link>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
