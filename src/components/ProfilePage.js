import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import navigate hooks

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [friends, setFriends] = useState([]);
  const [showFriends, setShowFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5001/userApi/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = await response.json();
        if (response.ok) {
          setUser(result);
          fetchFriends(result, result.id)
        } else {
          setMessage(result.error || "Failed to fetch profile.");
        }
      } catch (error) {
        setMessage("Error connecting to the server.");
      }
    };

    const fetchFriends = async (user, id) => {
      try {
        const token = localStorage.getItem("token");
        
        if (!user || !user.id) {
          console.error("User ID is missing or invalid.");
          return;
        }
  
        const response = await fetch(
          `http://localhost:5001/userApi/${id}/friends`, // Pass user._id explicitly
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
  
        const result = await response.json();
        if (response.ok) {
          setFriends(result.friends);
        } else {
          console.error("Failed to fetch friends:", result.error);
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchTerm(query);

    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const currentUser = JSON.parse(localStorage.getItem("user")); // Get current user data

      const response = await fetch(
        `http://localhost:5001/userApi/searchUsers?query=${encodeURIComponent(
          query
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      if (response.ok && Array.isArray(result.users)) {
        // Filter out the current user
        const filteredUsers = result.users.filter(
          (user) => user._id !== currentUser.id
        );
        setSearchResults(filteredUsers);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setSearchResults([]);
    }
  };

  // Function to handle user selection
  const handleUserSelect = (id) => {
    navigate(`/profile/${id}`);
    setIsDropdownVisible(false);
  };

  const handleViewFriend = (friendId) => {
    navigate(`/profile/${friendId}`); // Redirect to friend's profile
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center", // Centers vertically
        }}
      >
        <h2 className="text-2xl font-bold mb-4">User Profile</h2>
        <img
          src={`http://localhost:5001/${
            user?.profilePicture || "default-avatar.png"
          }`}
          alt="Profile"
          style={{
            width: "100px", // Set a fixed width
            height: "100px", // Set a fixed height
            borderRadius: "50%", // Makes it a circle
            objectFit: "cover", // Ensures the image fills the space properly
            marginTop: "10px", // Adds spacing
          }}
        />

        <h3 className="text-xl font-semibold">{user?.name || "N/A"}</h3>
        <p className="text-gray-600">@{user?.username || "N/A"}</p>
        <p className="text-gray-600">{user?.email || "N/A"}</p>

        <button
          onClick={() => setShowFriends(!showFriends)}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showFriends ? "Hide Friends" : "View Friends"}
        </button>

        {showFriends && (
          <div className="mt-4 text-left">
            <h4 className="text-lg font-semibold mb-2">Friends List:</h4>
            {friends.length === 0 ? (
              <p className="text-gray-500">No friends added yet.</p>
            ) : (
              <ul className="space-y-4">
                {friends.map((friend) => (
                  <li
                    key={friend._id}
                    className="flex items-center space-x-4 cursor-pointer hover:bg-gray-100 p-2 rounded"
                    onClick={() => handleViewFriend(friend._id)}
                  >
                    <img
                      src={`http://localhost:5001/${friend.profilePicture}`}
                      alt={friend.username}
                      style={{
                        width: "100px", // Set a fixed width
                        height: "100px", // Set a fixed height
                        borderRadius: "50%", // Makes it a circle
                        objectFit: "cover", // Ensures the image fills the space properly
                        marginTop: "10px", // Adds spacing
                      }}
                    />
                    <div>
                      <p className="font-bold">{friend.name}</p>
                      <p className="text-gray-500">@{friend.username}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {message && <p className="text-red-500 mt-4">{message}</p>}

      <div className="relative max-w-md mx-auto mt-10">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search users by name or username..."
          className="w-full p-2 border rounded shadow focus:outline-none focus:ring focus:border-blue-300"
        />

        {searchResults.length > 0 ? (
          <ul className="search-dropdown bg-white border rounded shadow-md mt-2">
            {searchResults.map((user) => (
              <li
                key={user._id}
                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handleUserSelect(user._id)}
              >
                <img
                  src={`http://localhost:5001/${user.profilePicture}`}
                  alt={user.username}
                  style={{
                    width: "100px", // Set a fixed width
                    height: "100px", // Set a fixed height
                    borderRadius: "50%", // Makes it a circle
                    objectFit: "cover", // Ensures the image fills the space properly
                    marginTop: "10px", // Adds spacing
                  }}
                />
                <span>{user.username}</span>
              </li>
            ))}
          </ul>
        ) : (
          searchTerm && <p className="mt-2 text-gray-500">No users found.</p>
        )}
      </div>
    </div>
  );
}
