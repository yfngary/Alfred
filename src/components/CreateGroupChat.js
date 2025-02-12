import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:5001"); // Connect to backend WebSocket server

export default function ChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user")); // Get user info
  const userId = user?.id; // Extract user ID

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!chatId) return;

    // Join chat room
    socket.emit("joinChat", chatId);

    // Fetch previous messages from the backend
    fetchMessages();

    // Listen for new messages (Avoid multiple listeners)
    const messageListener = (message) => {
      setMessages((prevMessages) => {
        if (!prevMessages.some((msg) => msg._id === message._id)) {
          return [...prevMessages, message]; // Only add unique messages
        }
        return prevMessages;
      });
      scrollToBottom();
    };

    socket.on("newMessage", messageListener);

    return () => {
      socket.off("newMessage", messageListener);
    };
  }, [chatId]);

  // Fetch chat messages from the backend
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5001/api/${chatId}/messages`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (response.ok) {
        setMessages(result.messages);
        scrollToBottom();
      } else {
        console.error("Failed to fetch messages:", result.error);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const token = localStorage.getItem("token");

    const messageData = {
      content: newMessage,
      sender: userId, // Attach sender ID
    };

    try {
      // Send message to backend
      const response = await fetch(`http://localhost:5001/api/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
      });

      const result = await response.json();
      if (response.ok) {
        // WebSocket emits message, avoiding duplicate state updates
        //socket.emit("sendMessage", result);
        setNewMessage(""); // Clear input
        fetchMessages();
      } else {
        console.error("Error sending message:", result.error);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Group Chat</h2>
      <div className="h-64 overflow-y-auto border p-2 rounded" id="chat-messages">
        {messages.map((msg, index) => (
          <div key={msg._id || index} className={`p-2 border-b ${msg.sender === userId ? "text-right" : ""}`}>
            <strong>{msg.sender === userId ? "You" : msg.sender?.name}:</strong> {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex mt-4">
        <input
          type="text"
          className="w-full p-2 border rounded"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={sendMessage} className="ml-2 bg-blue-500 text-white p-2 rounded">
          Send
        </button>
      </div>
    </div>
  );
}
