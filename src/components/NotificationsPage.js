import React, { useEffect, useState } from "react";

export default function NotificationsPage() {
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const fetchFriendRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/requestsApi/friendRequests", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setFriendRequests(result.friendRequests);
      } else {
        setMessage(result.error || "Failed to load friend requests.");
      }
    } catch (error) {
      setMessage("Error connecting to the server.");
    }
    setLoading(false);
  };

  const handleAction = async (id, action) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5001/requestsApi/friendRequests/${id}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log("📝 Server Response:", result);
      if (response.ok) {
        setFriendRequests((prev) => prev.filter((req) => req._id !== id));
        setMessage(`Friend request ${action === "accept" ? "accepted" : "rejected"}.`);
      } else {
        setMessage(result.error || "Failed to process request.");
      }
    } catch (error) {
      setMessage("Error connecting to the server.");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Friend Requests</h2>
      {message && <p className="text-center text-sm text-red-500">{message}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : friendRequests.length > 0 ? (
        <ul>
          {friendRequests.map((request) => (
            <li key={request._id} className="flex items-center justify-between mb-4 border-b pb-2">
              <div className="flex items-center">
                <img
                  src={`http://localhost:5001/${request.from.profilePicture}`}
                  alt={request.from.username}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <span>{request.from.username}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(request._id, "accept")}
                  className="bg-green-500 text-white px-3 py-1 rounded"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleAction(request._id, "reject")}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No pending friend requests.</p>
      )}
    </div>
  );
}

