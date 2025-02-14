import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:5001"); // WebSocket Connection

export default function ChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user")); // Get user info
  const userId = user?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }; 

  useEffect(() => {
    if (!chatId) return;

    socket.emit("joinChat", chatId); // ✅ Join the chat room

    fetchMessages(); // ✅ Fetch old messages from API
    scrollToBottom(); // ✅ Auto-scroll

    socket.on("newMessage", (message) => {
      console.log("Received new message via WebSocket:", message); // ✅ Debugging
      setMessages((prevMessages) => [...prevMessages, message]); // ✅ Add new message
    });

    return () => {
      socket.off("newMessage");
    };
  }, [chatId]);

  useEffect(() => {
    //scrollToBottom(); // ✅ Scroll when messages change
    fetchMessages(); // ✅ Fetch old messages from API
  }, [messages]); 

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/${chatId}/messages`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();
      if (response.ok) {
        setMessages(result.messages);
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
      chatId,
      sender: userId,
      content: newMessage,
    };

    try {
      const response = await fetch(
        `http://localhost:5001/api/${chatId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(messageData),
        }
      );

      if (response.ok) {
        scrollToBottom();
        setNewMessage(""); // ✅ Clear input field
        // ⚠️ Don't manually update state here; WebSocket will handle it
      } else {
        console.error("Error sending message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Group Chat</h2>
      <div className="h-64 overflow-y-auto border p-2 rounded">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 border-b ${
              msg.sender === userId ? "text-right" : ""
            }`}
          >
            <strong>{msg.sender === userId ? "You" : msg.sender?.name}:</strong>{" "}
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* ✅ Keeps chat scrolled to bottom */}
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
