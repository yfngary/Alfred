import React, { useEffect, useState } from "react";

export default function FriendsList() {
  const [friends, setFriends] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/userApi/friends", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (response.ok) {
        setFriends(result.friends);
      } else {
        setMessage(result.error || "Failed to fetch friends list.");
      }
    } catch (error) {
      setMessage("Error fetching friends list.");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Your Friends</h2>

      {message && <p className="text-red-500">{message}</p>}

      {friends.length === 0 ? (
        <p>You have no friends yet.</p>
      ) : (
        <ul className="space-y-4">
          {friends.map((friend) => (
            <li key={friend._id} className="flex items-center space-x-4">
              <img
                src={`http://localhost:5001/${friend.profilePicture}`}
                alt={friend.username}
                className="w-12 h-12 rounded-full object-cover"
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
  );
}
