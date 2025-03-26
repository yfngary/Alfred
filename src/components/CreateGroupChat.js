import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import io from "socket.io-client";
import { Paper, Typography, Box, TextField, Button, CircularProgress, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

// Create the socket outside the component but only initialize it once
let socket;
if (!socket) {
  socket = io("http://localhost:5001"); // WebSocket Connection
}

export default function ChatPage() {
  // Extract tripId from params, this component is rendered at /trips/:id/chat
  const { id: tripId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract experienceId from query params if it exists
  const queryParams = new URLSearchParams(location.search);
  const experienceId = queryParams.get('experienceId');
  
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripInfo, setTripInfo] = useState(null);
  const [experience, setExperience] = useState(null);
  const messagesEndRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user")); // Get user info
  const userId = user?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }; 

  // Fetch trip info based on trip ID
  useEffect(() => {
    if (!tripId) {
      setError("No trip ID provided");
      setLoading(false);
      return;
    }
    
    const fetchTripData = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Fetching trip data for ID:", tripId);
        
        // Get the trip details including its chat ID
        const response = await fetch(`http://localhost:5001/api/trips/${tripId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          const text = await response.text();
          console.error("Error response from server:", text);
          throw new Error(`Failed to load trip information: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Trip API response:", data);
        
        // The API might return the trip directly or nested in a 'trip' property
        const tripData = data.trip || data;
        
        // Check if the trip exists
        if (!tripData || !tripData._id) {
          throw new Error("Trip not found or invalid trip data returned");
        }
        
        setTripInfo(tripData);
        
        // If we have an experienceId, find the matching experience
        if (experienceId) {
          console.log("Looking for experience:", experienceId);
          if (tripData.experiences && Array.isArray(tripData.experiences)) {
            const foundExperience = tripData.experiences.find(exp => exp._id === experienceId);
            
            if (foundExperience && foundExperience.chat) {
              console.log("Found experience:", foundExperience.title);
              setExperience(foundExperience);
              
              // Get the chat ID from the experience
              const expChatId = typeof foundExperience.chat === 'object' ? 
                foundExperience.chat._id : foundExperience.chat;
                
              if (!expChatId) {
                throw new Error("Experience has no valid chat ID");
              }
              
              console.log("Using experience chat ID:", expChatId);
              setChatId(expChatId);
              return;
            } else {
              console.warn("Experience not found or has no chat:", experienceId);
            }
          } else {
            console.warn("Trip has no experiences array");
          }
          
          // If we couldn't find the experience, show an error
          throw new Error(`Experience chat not found: ${experienceId}`);
        }
        
        // Check if the trip has a chat property (for the main trip chat)
        if (!tripData.chat) {
          console.warn("Trip has no chat property:", tripData);
          throw new Error("No chat found for this trip");
        }
        
        // Store the chat ID (it might be an object or just the ID string)
        const chatIdValue = typeof tripData.chat === 'object' ? 
          tripData.chat._id : tripData.chat;
          
        if (!chatIdValue) {
          throw new Error("Invalid chat ID in trip data");
        }
        
        console.log("Using trip chat ID:", chatIdValue);
        setChatId(chatIdValue);
      } catch (error) {
        console.error("Error fetching trip data:", error);
        setError(error.message || "Failed to load trip information");
        setLoading(false);
        // If there's an error, redirect to the trip dashboard
        setTimeout(() => {
          navigate(`/trips/${tripId}`);
        }, 3000);
      }
    };
    
    fetchTripData();
  }, [tripId, experienceId, navigate]);

  const getChatTitle = () => {
    if (!tripInfo) return 'Loading...';
    
    // If we're looking at an experience chat, use the experience title
    if (experience) {
      return `${tripInfo.tripName} - ${experience.title}`;
    }
    
    // Otherwise, it's the main trip chat
    return `${tripInfo.tripName} - Group Chat`;
  };

  const fetchMessages = async () => {
    if (!chatId) {
      console.error("Cannot fetch messages: No chat ID available");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching messages for chat:", chatId);
      
      const response = await fetch(
        `http://localhost:5001/api/chat/${chatId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        console.error("Error response from server:", text);
        throw new Error(`Failed to load messages: ${response.status}`);
      }

      const result = await response.json();
      console.log("Messages received:", result.messages?.length || 0);
      
      if (response.ok) {
        setMessages(result.messages || []);
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("Failed to load messages");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chatId) return;
    
    // Reset states when changing chats
    setMessages([]);
    setError(null);
    setLoading(true);

    // Leave previous chat room if any
    socket.emit("leaveChat", chatId);
    
    // Join new chat room
    socket.emit("joinChat", chatId);
    console.log("Joined chat room:", chatId);
    
    // Fetch messages directly
    fetchMessages();

    // Set up socket listeners
    const handleNewMessage = (message) => {
      console.log("New message received:", message);
      setMessages((prevMessages) => [...prevMessages, message]);
      scrollToBottom();
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.emit("leaveChat", chatId);
      console.log("Left chat room:", chatId);
    };
  }, [chatId]); // Only re-run when chatId changes

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    const messageData = {
      chatId,
      sender: userId,
      content: newMessage.trim(),
    };

    try {
      console.log("Sending message:", messageData);
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
        <Typography variant="body2" sx={{ mt: 2 }}>
          Redirecting back to trip dashboard...
        </Typography>
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
            bgcolor: 'background.paper', // Use theme colors
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
                  justifyContent: msg.sender?._id === userId || msg.sender?.id === userId ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    maxWidth: '70%',
                    bgcolor: msg.sender?._id === userId || msg.sender?.id === userId ? 'primary.main' : 'background.default',
                    color: msg.sender?._id === userId || msg.sender?.id === userId ? '#fff' : 'inherit',
                    borderRadius: 2,
                    p: 1,
                    boxShadow: 1,
                  }}
                >
                  <Typography variant="body2" gutterBottom>
                    {msg.sender?._id === userId || msg.sender?.id === userId ? 'You' : msg.sender?.name || 'Unknown'}
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
            disabled={!newMessage.trim() || !chatId}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
