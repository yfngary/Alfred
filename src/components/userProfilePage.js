import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function UserProfilePage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [friendStatus, setFriendStatus] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:5001/userApi/${userId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (response.ok) {
          setUser(result.user);
        } else {
          setMessage(result.error || "Failed to load user profile.");
        }
      } catch (error) {
        setMessage("Error fetching user profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const sendFriendRequest = async (toUserId) => {
    const token = localStorage.getItem("token");
  
    try {
      const response = await fetch(`http://localhost:5001/requestsApi/sendFriendRequest/${toUserId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      const result = await response.json();
      if (response.ok) {
        alert("✅ Friend request sent!");
      } else {
        alert(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("An error occurred while sending the friend request.");
    }
  };
  

  if (loading) return <p>Loading user profile...</p>;
  if (message) return <p className="text-red-500">{message}</p>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg text-center">
      <h2 className="text-xl font-bold mb-4">{user?.name}'s Profile</h2>
      <img
        src={`http://localhost:5001/${user?.profilePicture}`}
        alt={user?.username}
        style={{
          width: "100px", // Set a fixed width
          height: "100px", // Set a fixed height
          borderRadius: "50%", // Makes it a circle
          objectFit: "cover", // Ensures the image fills the space properly
          marginTop: "10px", // Adds spacing
        }}
      />
      <p className="text-lg mt-4">
        <strong>Username:</strong> {user?.username}
      </p>
      <p className="text-lg">
        <strong>Email:</strong> {user?.email}
      </p>

      {/* Add Friend Button */}
      <button
        onClick={() => (sendFriendRequest(user?._id))}
        className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Add Friend
      </button>

      {friendStatus && <p className="mt-2 text-green-600">{friendStatus}</p>}
    </div>
  );
}
