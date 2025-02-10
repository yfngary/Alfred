import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:5001"); // Connect to backend WebSocket server

export default function ChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Join chat room
    socket.emit("joinChat", chatId);

    // Listen for new messages
    socket.on("newMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      chatId,
      sender: "currentUserId", // Replace with actual logged-in user ID
      content: newMessage,
    };

    // Send message to backend
    socket.emit("sendMessage", messageData);

    // Clear input field
    setNewMessage("");
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Group Chat</h2>
      <div className="h-64 overflow-y-auto border p-2 rounded">
        {messages.map((msg, index) => (
          <div key={index} className="p-2 border-b">
            <strong>{msg.sender?.name}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div className="flex mt-4">
        <input
          type="text"
          className="w-full p-2 border rounded"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="ml-2 bg-blue-500 text-white p-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
