import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import { Paper, Typography, Box, TextField, Button, CircularProgress, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const socket = io("http://localhost:5001"); // WebSocket Connection

export default function ChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripInfo, setTripInfo] = useState(null);
  const messagesEndRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user")); // Get user info
  const userId = user?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }; 

  // Fetch trip info based on chat ID
  const fetchTripInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5001/api/trips/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setTripInfo(data.trip);
        // Log the trip info to debug
        console.log("Trip info received:", data.trip);
        console.log("Current chat ID:", chatId);
        console.log("Experiences:", data.trip.experiences);
      } else {
        setError(data.error || "Failed to load trip information");
      }
    } catch (error) {
      console.error("Error fetching trip info:", error);
      setError("Failed to load trip information");
    }
  };

  const getChatTitle = () => {
    if (!tripInfo) return 'Loading...';
    
    // Check if this is an experience chat
    const experience = tripInfo.experiences?.find(exp => exp.chat?._id === chatId);
    if (experience) {
      return `${tripInfo.tripName} - ${experience.title}`;
    }
    
    // If not an experience chat, it's the main trip chat
    return `${tripInfo.tripName} - Group Chat`;
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/${chatId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();
      if (response.ok) {
        setMessages(result.messages);
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch (error) {
      setError("Failed to load messages");
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset states when changing chats
    setMessages([]);
    setError(null);
    setLoading(true);
    setTripInfo(null);

    if (!chatId) {
      setError("No chat ID provided");
      setLoading(false);
      return;
    }

    // Leave previous chat room if any
    socket.emit("leaveChat", chatId);
    
    // Join new chat room
    socket.emit("joinChat", chatId);
    
    // Fetch initial data
    fetchTripInfo();
    fetchMessages();

    // Set up socket listeners
    const handleNewMessage = (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      scrollToBottom();
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.emit("leaveChat", chatId);
    };
  }, [chatId]); // Only re-run when chatId changes

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      chatId,
      sender: userId,
      content: newMessage.trim(),
    };

    try {
      // Only emit through socket, server will handle saving
      socket.emit("sendMessage", messageData);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ maxWidth: 800, mx: 'auto', mt: 3, height: 'calc(100vh - 100px)' }}>
      <Box p={3} display="flex" flexDirection="column" height="100%">
        <Typography variant="h5" gutterBottom>
          {getChatTitle()}
        </Typography>
        
        <Box 
          flex={1} 
          mb={2} 
          sx={{ 
            overflowY: 'auto',
            bgcolor: '#f5f5f5',
            borderRadius: 1,
            p: 2
          }}
        >
          {messages.length === 0 ? (
            <Typography color="textSecondary" align="center">
              No messages yet. Start the conversation!
            </Typography>
          ) : (
            messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: msg.sender?._id === userId ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    maxWidth: '70%',
                    bgcolor: msg.sender?._id === userId ? '#1976d2' : '#fff',
                    color: msg.sender?._id === userId ? '#fff' : 'inherit',
                    borderRadius: 2,
                    p: 1,
                    boxShadow: 1,
                  }}
                >
                  <Typography variant="body2" gutterBottom>
                    {msg.sender?._id === userId ? 'You' : msg.sender?.name || 'Unknown'}
                  </Typography>
                  <Typography>{msg.content}</Typography>
                </Box>
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Box component="form" onSubmit={sendMessage} display="flex" gap={1}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            size="small"
            error={!!error}
            helperText={error}
          />
          <Button
            type="submit"
            variant="contained"
            endIcon={<SendIcon />}
            disabled={!newMessage.trim()}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
