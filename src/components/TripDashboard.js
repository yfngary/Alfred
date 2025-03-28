import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Chip,
  Avatar,
  AvatarGroup,
  Divider,
  CircularProgress,
  Button,
  Paper,
  Stack,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondary,
  Tooltip,
  Badge,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
} from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Hotel as HotelIcon,
  Attractions as ActivityIcon,
  Checklist as ChecklistIcon,
  AccountBalance as BudgetIcon,
  ArrowForward as ArrowIcon,
  Notes as NotesIcon,
  Add as AddIcon,
  Restaurant as RestaurantIcon,
  Hiking as HikingIcon,
  LocalActivity as EventIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sailing as OtherIcon,
  Backpack as BackpackIcon,
  AccessTime as TimeIcon,
  Place as PlaceIcon,
  Group as GroupIcon,
  Refresh as RefreshIcon,
  CloudOff as CloudOffIcon,
  Cloud as CloudIcon,
  Cached as CachedIcon,
  Storage as StorageIcon,
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  RestartAlt as RestartAltIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  ChildCare as ChildIcon,
  ExpandMore as ExpandMoreIcon,
  CategoryOutlined as CategoryOutlinedIcon,
  DirectionsRun as DirectionsRunIcon,
  LocalDining as LocalDiningIcon,
  Save as SaveIcon,
  House as HouseIcon,
  HomeWork as HomeWorkIcon,
  LocationCity as ResortIcon,
  SmartToy as SmartToyIcon,
} from "@mui/icons-material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useTrips } from "../context/TripContext";
import { debounce } from "lodash";
import axios from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { getCachedTrip, getAllCachedTripIds } from "../utils/cacheUtils";
import { format } from "date-fns";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

// Calendar navigation hook - defined at the very top of the file
// to ensure it's available before any component uses it
const useCalendarNavigation = (tripId) => {
  const navigate = useNavigate();

  const navigateToCalendarView = () => {
    navigate(`/trips/${tripId}/calendar`);
  };

  return { navigateToCalendarView };
};

// Experience icon helper function
const getExperienceIcon = (type) => {
  switch (type?.toLowerCase()) {
    case "meal":
      return <RestaurantIcon />;
    case "activity":
      return <HikingIcon />;
    case "event":
      return <EventIcon />;
    default:
      return <OtherIcon />;
  }
};

// Helper function to generate avatar colors from strings
function stringToColor(string) {
  if (!string) return "#2196f3";

  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }

  return color;
}

// Helper function to get color based on experience type
function getExperienceTypeColor(type) {
  switch (type?.toLowerCase()) {
    case "meal":
      return "#FF9800"; // Orange
    case "activity":
      return "#4CAF50"; // Green
    case "event":
      return "#9c27b0"; // Purple
    default:
      return "#2196f3"; // Blue
  }
}

// Function to get color based on lodging type
function getLodgingTypeColor(type) {
  switch (type) {
    case "hotel":
      return "#4776E6"; // Blue gradient start
    case "airbnb":
      return "#FF385C"; // Airbnb red
    case "resort":
      return "#00BFA5"; // Resort teal
    default:
      return "#8E54E9"; // Purple gradient end
  }
}

// Format date helper function
function formatDate(dateString) {
  if (!dateString) return "Not set";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Error";
  }
}

// Format time helper function
function formatTime(timeString) {
  if (!timeString) return "";

  try {
    // Handle date-time format
    if (timeString.includes("T")) {
      const date = new Date(timeString);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    // Handle time-only format (HH:MM or HH:MM:SS)
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    console.error("Error formatting time:", e);
    return timeString; // Return original if error
  }
}

// Calculate days remaining until trip
function getDaysRemaining(startDateString) {
  if (!startDateString) return "";

  const startDate = new Date(startDateString);
  const today = new Date();

  // Reset hours to compare dates only
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  // Ensure we have valid dates
  if (isNaN(startDate.getTime())) return "";

  const diffTime = startDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "In progress";
  } else if (diffDays === 0) {
    return "Today!";
  } else if (diffDays === 1) {
    return "1 day";
  } else {
    return `${diffDays} days`;
  }
}

// Calculate trip duration helper
function getTripDuration(startDate, endDate) {
  if (!startDate || !endDate) return "Not set";

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return "Invalid dates";
    }

    // Calculate difference in days
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "Invalid date range";
    } else if (diffDays === 0) {
      return "1 day (Same day)";
    } else if (diffDays === 1) {
      return "2 days (1 night)";
    } else {
      return `${diffDays + 1} days (${diffDays} nights)`;
    }
  } catch (e) {
    console.error("Error calculating trip duration:", e);
    return "Error";
  }
}

// TripHeader component - completely separate from the main component
const TripHeader = ({
  trip,
  formatDate,
  getDaysRemaining,
  navigateToCalendarView,
  onDeleteClick,
  userRole,
}) => {
  const navigate = useNavigate();

  // Dark theme colors matching the NavBar
  const darkTheme = {
    primary: "#1A1A1A", // Almost black background
    secondary: "#2D2D2D", // Slightly lighter for hover states
    highlight: "#3366FF", // Blue highlight color
    text: "#FFFFFF", // White text
    divider: "rgba(255, 255, 255, 0.1)", // Subtle divider
  };

  const statusText =
    trip.status === "upcoming" ? "Upcoming" : getDaysRemaining(trip.startDate);
  trip.status === "completed" ? "Completed" : "In Progress";
  const statusColor =
    getDaysRemaining(trip.startDate) === "In progress" ||
    getDaysRemaining(trip.startDate) === "Today!"
      ? "success"
      : "primary";
  // Check if user has permission to delete trip (only owner or admin can delete)
  const canDelete = userRole === "owner" || userRole === "admin";

  return (
    <Paper
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: 2,
        borderRadius: 2,
        backgroundColor: darkTheme.primary, // Changed from gradient to solid color
        color: darkTheme.text,
        width: "100%",
        position: "relative",
        flexShrink: 0,
        overflow: "visible",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)", // Added shadow to match NavBar
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
              mb: 2,
              wordBreak: "break-word",
              color: darkTheme.text, // Explicitly setting text color
            }}
          >
            {trip.tripName || "Unnamed Trip"}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CalendarIcon
                sx={{
                  mr: 0.5,
                  fontSize: "0.875rem",
                  color: darkTheme.highlight,
                }}
              />
              <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </Typography>
            </Box>
            <Chip
              label={statusText}
              color={statusColor}
              size="small"
              sx={{ fontWeight: "bold", height: "28px" }}
            />
            <Typography
              variant="body2"
              sx={{
                display: "flex",
                alignItems: "center",
                fontWeight: "medium",
                fontSize: "0.875rem",
              }}
            >
              {getDaysRemaining(trip.startDate) !== "In progress" &&
                getDaysRemaining(trip.startDate) !== "Today!" && (
                  <span style={{ marginLeft: "4px" }}>until trip</span>
                )}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexShrink: 0,
            alignSelf: "flex-start",
          }}
        >
          <Button
            variant="contained"
            startIcon={<CalendarMonthIcon />}
            onClick={navigateToCalendarView}
            size="small"
            sx={{
              bgcolor: darkTheme.highlight, // Changed to use theme highlight color
              "&:hover": {
                bgcolor: "#2855E6", // Slightly darker blue on hover, matching NavBar
              },
              fontWeight: "bold",
              borderRadius: 2,
              textTransform: "none",
              whiteSpace: "nowrap",
              py: 0.5,
            }}
          >
            Calendar View
          </Button>

          {/* Delete Trip button */}
          {canDelete && (
            <Button
              variant="contained"
              startIcon={<DeleteIcon />}
              onClick={onDeleteClick}
              size="small"
              sx={{
                bgcolor: "rgba(211, 47, 47, 0.8)", // Red with some transparency
                "&:hover": {
                  bgcolor: "#d32f2f", // Solid red on hover
                },
                fontWeight: "bold",
                borderRadius: 2,
                textTransform: "none",
                whiteSpace: "nowrap",
                py: 0.5,
              }}
            >
              Delete
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

// Define Trip Dashboard component
export default function TripDashboard({ id }) {
  const params = useParams();
  const tripId = id || params.id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    fetchTripById,
    offlineMode,
    refreshTrips,
    resetProblematicEndpoints,
    isEndpointProblematic,
  } = useTrips();

  // Get calendar navigation
  const { navigateToCalendarView } = useCalendarNavigation(tripId);

  // State variables
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [experienceTab, setExperienceTab] = useState(0);
  const [lodgingTab, setLodgingTab] = useState(0); // Add lodging tab state
  const [openExperienceDialog, setOpenExperienceDialog] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openGroupsDialog, setOpenGroupsDialog] = useState(false);
  const [editedTrip, setEditedTrip] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [openGuestsDialog, setOpenGuestsDialog] = useState(false);
  const [editedGuests, setEditedGuests] = useState([]);
  const [guestEditLoading, setGuestEditLoading] = useState(false);
  const [newGuestName, setNewGuestName] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [openRelationshipsDialog, setOpenRelationshipsDialog] = useState(false);
  const [guests, setGuests] = useState([{ email: "", phone: "", name: "" }]);
  const [sending, setSending] = useState(false);
  const [searchResults, setSearchResults] = useState({});
  const [loadingAttempts, setLoadingAttempts] = useState(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [fetchSource, setFetchSource] = useState(null);
  const [serverStatus, setServerStatus] = useState("checking"); // 'online', 'offline', 'checking'
  const [forceOfflineMode, setForceOfflineMode] = useState(false);
  const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);
  const [cachedTripsAvailable, setCachedTripsAvailable] = useState([]);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [openEditExperienceDialog, setOpenEditExperienceDialog] =
    useState(false);
  const [editingExperience, setEditingExperience] = useState(null);
  const [editExperienceLoading, setEditExperienceLoading] = useState(false);
  const [openLodgingDialog, setOpenLodgingDialog] = useState(false);
  const [selectedLodging, setSelectedLodging] = useState(null);

  // Refs
  const loadingTimerRef = useRef(null);
  const serverCheckRef = useRef(null);
  // Move this useRef to the top level of the component
  const attemptedCancellations = useRef({});
  const maxAttempts = 3;

  // Define loadTripData function at the top before it's used anywhere else
  const loadTripData = useCallback(
    async (forceRefresh = false) => {
      try {
        if (!tripId) {
          throw new Error("Trip ID is missing or undefined");
        }
        // Check if we're using axios or fetch
        if (axios) {
          // Use axios if available (with better error handling)
          try {
            const response = await axios.get(`/api/trips/${tripId}`, {
              timeout: 10000, // 10 second timeout
              headers: {
                Accept: "application/json",
              },
            });
            setTrip(response.data);
            setLoading(false);
            setError(null);
          } catch (axiosError) {
            console.error("Axios error loading trip:", axiosError);

            // Get detailed error information
            const status = axiosError.response?.status;
            const responseType =
              axiosError.response?.headers?.["content-type"] || "";

            // Handle 404 specifically
            if (status === 404) {
              console.log("Trip not found with ID:", tripId);

              // Try alternative API format as fallback
              try {
                const altResponse = await axios.get(
                  `/api/trips/trip/${tripId}`,
                  {
                    timeout: 5000,
                    headers: { Accept: "application/json" },
                  }
                );

                if (altResponse.status === 200 && altResponse.data) {
                  console.log("Alternative API endpoint successful");
                  setTrip(altResponse.data);
                  setLoading(false);
                  setError(null);
                  return;
                }
              } catch (altError) {
                console.log(
                  "Alternative endpoint also failed:",
                  altError.message
                );
              }

              // If no alternatives worked, throw 404 error
              throw new Error(
                `Trip with ID ${tripId} was not found. The trip may have been deleted or you may not have permission to view it.`
              );
            }

            // Check if we got HTML instead of JSON
            if (responseType.includes("text/html")) {
              throw new Error(
                `Server returned HTML instead of JSON (status ${status}). The API endpoint may be misconfigured or the server might be returning an error page.`
              );
            }

            // Otherwise throw with status code
            throw new Error(
              `Failed to fetch trip data: ${axiosError.message} (status ${status})`
            );
          }
        } else {
          // Fallback to fetch API with improved error handling
          console.log(`Making fetch API request to: /api/trips/${tripId}`);
          const response = await fetch(`/api/trips/${tripId}`);

          // Check if response is OK
          if (!response.ok) {
            const contentType = response.headers.get("content-type") || "";

            // If it's a 404, try an alternative endpoint format
            if (response.status === 404) {
              console.log("Trip not found with ID:", tripId);
              console.log("Trying alternative API endpoint format...");

              try {
                const altResponse = await fetch(`/api/trips/trip/${tripId}`);

                if (altResponse.ok) {
                  const altData = await altResponse.json();
                  console.log("Alternative API endpoint successful");
                  setTrip(altData);
                  setLoading(false);
                  setError(null);
                  return;
                } else {
                  console.log(
                    "Alternative endpoint also failed with status:",
                    altResponse.status
                  );
                }
              } catch (altError) {
                console.log("Alternative endpoint failed:", altError.message);
              }

              throw new Error(
                `Trip with ID ${tripId} was not found. The trip may have been deleted or you may not have permission to view it.`
              );
            }

            // If response is HTML, throw specific error
            if (contentType.includes("text/html")) {
              throw new Error(
                `Server returned HTML instead of JSON (status ${response.status}). The API endpoint may be misconfigured or the server might be returning an error page.`
              );
            }

            throw new Error(
              `Failed to fetch trip data: ${response.statusText} (${response.status})`
            );
          }

          // Try to parse the JSON
          const text = await response.text();
          let data;

          try {
            // Check if response begins with HTML
            if (
              text.trim().startsWith("<!DOCTYPE") ||
              text.trim().startsWith("<html")
            ) {
              throw new Error(
                "Response contains HTML instead of JSON. The API endpoint may be misconfigured."
              );
            }

            data = JSON.parse(text);
          } catch (parseError) {
            console.error("JSON parse error:", parseError);
            console.error("Raw response:", text.substring(0, 100) + "...");
            throw new Error(
              `Invalid JSON response: ${
                parseError.message
              }. Got: ${text.substring(0, 50)}...`
            );
          }

          setTrip(data);
          setLoading(false);
          setError(null);
        }
      } catch (error) {
        console.error("Error loading trip data:", error);
        setError(error.message);
        setLoading(false);

        // Specific error handling for common issues
        if (error.message.includes("HTML")) {
          console.warn(
            "Got HTML instead of JSON, this usually indicates a server-side routing issue or authentication problem"
          );
        } else if (error.message.includes("not found")) {
          console.warn(
            "Trip not found error - this might be a data issue or permissions problem"
          );
        }
      }
    },
    [tripId, user, serverStatus]
  );

  // Handle forcing reset of problematic endpoint tracking
  const handleResetEndpointTracking = useCallback(() => {
    resetProblematicEndpoints();
    setError(null);
    setLoading(true);
    loadTripData(true);
  }, [resetProblematicEndpoints, loadTripData]);

  // Check if the current trips endpoint is problematic
  const isTripsEndpointProblematic = useMemo(() => {
    return isEndpointProblematic("/api/trips/userTrips");
  }, [isEndpointProblematic]);

  // Check cached trips on mount
  useEffect(() => {
    const checkCachedTrips = () => {
      const cachedIds = getAllCachedTripIds();
      setCachedTripsAvailable(cachedIds);
    };

    checkCachedTrips();
  }, []);

  useEffect(() => {
    const userString = localStorage.getItem("user");

    try {
      if (userString && trip) {
        const userData = JSON.parse(userString);
        const userId = userData.id || userData._id;
        const tripUserId = trip.userId;

        if (
          userId &&
          tripUserId &&
          (userId === tripUserId || userId.toString() === tripUserId.toString())
        ) {
          setUserRole("owner");
        } else {
          // Check if user is a collaborator
          if (trip.collaborators && Array.isArray(trip.collaborators)) {
            const collaborator = trip.collaborators.find((collab) => {
              const collabUser = collab.user || {};
              const collabUserId =
                collabUser.id ||
                collabUser._id ||
                (typeof collabUser === "string" ? collabUser : null);
              return (
                collabUserId &&
                (collabUserId === userId ||
                  collabUserId.toString() === userId.toString())
              );
            });

            if (collaborator) {
              setUserRole(collaborator.role || "viewer");
              console.log(`User role set to ${collaborator.role || "viewer"}`);
            } else {
              setUserRole("viewer");
              console.log("User role set to viewer (non-collaborator)");
            }
          } else {
            setUserRole("viewer");
            console.log("User role set to viewer (no collaborators)");
          }
        }
      }
    } catch (error) {
      console.error("Error setting user role:", error);
      // Default to viewer if there's an error
      setUserRole("viewer");
    }
  }, [trip]);

  // Add a timeout effect to prevent indefinite loading
  useEffect(() => {
    // Clear any existing timer first
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }

    // If we're loading, set a timeout to stop after 15 seconds
    if (loading) {
      const loadingTimeoutMs = 15000; // 15 seconds

      loadingTimerRef.current = setTimeout(() => {
        // Log active requests to help debug
        console.log("Currently active requests:", window.activeRequests || {});
        if (window.debugAxiosRequests) {
          console.log(
            "Debugging active requests at timeout:",
            window.debugAxiosRequests()
          );
        }

        // Specific check for trip-related requests
        const activeRequests = window.activeRequests || {};

        // Look for requests containing this trip's ID or trips endpoint
        const tripRequests = Object.keys(activeRequests).filter(
          (reqId) =>
            reqId.includes(tripId) ||
            activeRequests[reqId].url?.includes(tripId) ||
            activeRequests[reqId].url?.includes("/api/trips/")
        );

        // If no active trip requests but we're still loading, it might be a stale state
        if (tripRequests.length === 0) {
          console.log(
            "No active trip requests found but component is still loading"
          );
          console.log("User authentication state:", !!user, user?.id);
          console.log("Token present:", !!localStorage.getItem("token"));

          // Force a new attempt if we haven't exceeded max attempts
          if (loadingAttempts < maxAttempts) {
            console.log(
              "Forcing a new loading attempt due to no active requests"
            );
            loadTripData(true); // Force refresh
            return; // Skip setting timeout flags
          }
        } else {
          // If we have active requests, try to cancel them first
          console.log("Attempting to cancel hanging requests...");
          if (window.cancelAllRequests) {
            const cancelled = window.cancelAllRequests();
            console.log(`Cancelled ${cancelled} requests`);

            if (cancelled > 0 && loadingAttempts < maxAttempts) {
              // If we successfully cancelled something, try one more time
              console.log("Trying one more time after cancelling requests");
              setTimeout(() => loadTripData(true), 500);
              return; // Skip setting timeout flags
            }
          }
        }

        setLoadingTimeout(true);
        setLoading(false);
        setShowRecoveryOptions(true);

        // Provide a more specific error message based on diagnostics
        if (tripRequests.length === 0) {
          setError(
            "Loading timed out. No active request was found - there may be an issue with request initiation."
          );
        } else {
          setError(
            `Loading timed out after ${
              loadingTimeoutMs / 1000
            } seconds. The server may be experiencing issues. Found ${
              tripRequests.length
            } hanging requests.`
          );
        }
      }, loadingTimeoutMs); // 15 second timeout
    }

    // Clean up the timer when loading state changes or component unmounts
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [loading, loadingAttempts, maxAttempts, tripId, loadTripData, user]);

  // Loading trip data when component mounts or tripId changes
  useEffect(() => {
    let isMounted = true;

    // Check if we have the auth token first
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.error("No authentication token available in TripDashboard");
      setError("Authentication required. Please sign in again.");
      setLoading(false);
      setShowRecoveryOptions(true);
      return;
    } else {
    }

    // Just call the loadTripData function, don't redefine it
    loadTripData();

    return () => {
      isMounted = false;
      // Clean up the timer on unmount
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [tripId, loadTripData, user]);

  // Handle refresh attempt
  const handleRefresh = () => {
    console.log("Refreshing trip data");

    // Clear any existing loading timer
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }

    // Cancel any hanging requests
    if (window.cancelAllRequests) {
      console.log("Cancelling any pending requests before refresh");
      window.cancelAllRequests();
    }

    // Reset all loading-related states
    setLoadingAttempts(0); // Start from 0 instead of 1 for a complete fresh start
    setLoadingTimeout(false);
    setLoading(true);
    setError(null);
    setShowRecoveryOptions(false);

    // Force a refresh of trips context
    console.log("Calling refreshTrips() to force data refresh");
    refreshTrips();

    // Adding a small delay before triggering the loadTripData effect
    // This gives time for any in-progress requests to be cancelled
    setTimeout(() => {
      setLoadingAttempts(1); // Now set to 1 to trigger the effect
    }, 500);
  };

  // Handle navigation back to dashboard
  const handleBackToDashboard = () => {
    console.log("Navigating back to dashboard");
    navigate("/dashboard");
  };

  // Add a function to completely reload the page as a last resort
  const handleForceReload = () => {
    console.log("Force reloading the page");
    window.location.reload();
  };

  // Add a function to handle creating a new experience
  const handleCreateExperience = () => {
    console.log("Navigating to create experience page for trip:", tripId);
    // Navigate to the create experience page with the trip ID
    navigate(`/trips/${tripId}/create-experience`);
  };

  // Handle viewing an experience's details
  const handleViewExperience = (experience) => {
    console.log("Viewing experience details:", experience);
    setSelectedExperience(experience);
    setOpenExperienceDialog(true);
  };

  // Handle viewing a lodging's details
  const handleViewLodging = (lodging) => {
    console.log("Viewing lodging details:", lodging);
    setSelectedLodging(lodging);
    setOpenLodgingDialog(true);
  };

  // Handle changing the experience tab
  const handleExperienceTabChange = (event, newValue) => {
    setExperienceTab(newValue);
  };

  // Handle lodging tab change
  const handleLodgingTabChange = (event, newValue) => {
    setLodgingTab(newValue);
  };

  // Handle deleting an experience
  const handleDeleteExperience = async (experienceId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this experience? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await axios.delete(
        `/api/trips/${tripId}/experiences/${experienceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        // Update the trip in state by removing the deleted experience
        setTrip((prev) => ({
          ...prev,
          experiences: prev.experiences.filter(
            (exp) => exp._id !== experienceId
          ),
        }));

        // Close the experience dialog if it's open
        setOpenExperienceDialog(false);

        // Show success message
        setSnackbarMessage("Experience deleted successfully");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error deleting experience:", error);
      setError("Failed to delete experience. Please try again.");
    }
  };

  // Handle deleting a lodging
  const handleDeleteLodging = async (lodgingId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this lodging? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await axios.delete(
        `/api/trips/${tripId}/lodgings/${lodgingId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        // Update the trip in state by removing the deleted lodging
        setTrip((prev) => ({
          ...prev,
          lodgings: prev.lodgings.filter(
            (lodging) => lodging._id !== lodgingId
          ),
        }));

        // Close the lodging dialog if it's open
        setOpenLodgingDialog(false);

        // Show success message
        setSnackbarMessage("Lodging deleted successfully");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error deleting lodging:", error);
      setError("Failed to delete lodging. Please try again.");
    }
  };

  // Handle loading trip data from cache
  const handleUseCache = () => {
    console.log("Attempting to load trip from cache:", tripId);
    const cachedTrip = getCachedTrip(tripId);

    if (cachedTrip) {
      console.log("Found cached trip data:", cachedTrip);
      setTrip(cachedTrip);
      setLoading(false);
      setError(null);
      setFetchSource("offline-cache");
      setShowRecoveryOptions(false);
    } else {
      console.log("No cached data found for trip:", tripId);
      setError(
        "No cached data available for this trip. Please try again when your connection improves."
      );
    }
  };

  // Handle editing trip details
  const handleEditTrip = async () => {
    if (!editedTrip) return;

    setEditLoading(true);
    try {
      const token = localStorage.getItem("token");

      const response = await axios.put(`/api/trips/${tripId}`, editedTrip, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        // Update the trip in state
        setTrip((prev) => ({ ...prev, ...editedTrip }));
        setOpenEditDialog(false);
      }
    } catch (error) {
      console.error("Error updating trip:", error);
      setError("Failed to update trip details. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle deleting a trip
  const handleDeleteTrip = async () => {
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("token");

      const response = await axios.delete(`/api/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        // Navigate back to dashboard after successful deletion
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error deleting trip:", error);
      setError("Failed to delete trip. Please try again.");
      setOpenDeleteDialog(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle creating or updating trip guests and sending invitations
  const handleCreateTripWithInvitations = async () => {
    setSending(true);

    try {
      // Validate that we have guest data to update
      if (!guests || guests.length === 0) {
        throw new Error("No guest data available to update");
      }

      // Filter out empty guest entries
      const validGuests = guests.filter((guest) => guest.name.trim());

      if (validGuests.length === 0) {
        throw new Error("Please add at least one guest with a name");
      }

      // Prepare guest data for the API
      const guestData = validGuests.map((guest) => ({
        name: guest.name.trim(),
        email: guest.email.trim(),
        phone: guest.phone ? guest.phone.trim() : "",
        type: guest.type || "adult",
      }));

      console.log("Updating trip with guests:", guestData);

      // First, update the trip with new guests
      const updateResponse = await axios.put(
        `/api/trips/${tripId}/guests`,
        {
          guests: guestData,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (updateResponse.status !== 200) {
        throw new Error("Failed to update trip guests");
      }

      // Get updated trip data
      const updatedTripData = updateResponse.data;
      console.log("Trip updated with guests:", updatedTripData);

      // If we have guest relationships (groups), update those as well
      if (groups && groups.length > 0) {
        console.log("Updating guest relationships:", groups);

        // Convert groups to the format expected by the API
        const relationshipsData = groups.map((group) => ({
          id: group.id,
          name: group.name,
          level1: group.level1,
          level2: group.level2,
        }));

        // Update guest relationships
        const relationshipsResponse = await axios.put(
          `/api/trips/${tripId}/guest-relationships`,
          {
            relationships: relationshipsData,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (relationshipsResponse.status !== 200) {
          console.warn("Failed to update guest relationships");
        } else {
          console.log("Guest relationships updated successfully");
        }
      }

      // Get or generate an invite code for sharing
      let inviteCode = "";
      try {
        const inviteCodeResponse = await axios.post(
          `/api/trips/${tripId}/invite-code`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        inviteCode = inviteCodeResponse.data.inviteCode;
        console.log("Got invite code:", inviteCode);
        setInviteCode(inviteCode);
      } catch (inviteCodeError) {
        console.error("Failed to get invite code:", inviteCodeError);
        // Continue without invite code, but mark as warning
      }

      // Filter guests that have email addresses for invitations
      const guestsToInvite = validGuests.filter((guest) => guest.email.trim());

      if (guestsToInvite.length > 0 && inviteCode) {
        // Create the invitation message
        const tripName = trip.tripName || "our trip";
        const startDate = trip.startDate ? formatDate(trip.startDate) : "";
        const endDate = trip.endDate ? formatDate(trip.endDate) : "";

        const inviteMessage = `You're invited to join ${tripName}${
          startDate ? ` from ${startDate}` : ""
        }${
          endDate ? ` to ${endDate}` : ""
        }. Please join and let me know if you can make it!`;

        // Create the join link
        const joinLink = `${window.location.origin}/join-trip/${inviteCode}`;

        // Send invitations
        console.log("Sending invitations to:", guestsToInvite);

        const invitationData = {
          guests: guestsToInvite,
          inviteMethod: "email", // Default to email method
          customMessage: inviteMessage,
          inviteCode: inviteCode,
          joinLink: joinLink,
        };

        const inviteResponse = await axios.post(
          `/api/trips/${tripId}/send-invitations`,
          invitationData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (inviteResponse.status === 200) {
          console.log("Invitations sent successfully:", inviteResponse.data);
        } else {
          console.warn(
            "Invitation API call succeeded but with unexpected status:",
            inviteResponse.status
          );
        }
      } else if (guestsToInvite.length === 0) {
        console.log("No guests with email addresses to invite");
      }

      // Close the dialog and refresh the trip data
      setOpenGuestsDialog(false);

      // Refresh the trip data to show updated guests
      setLoading(true);
      loadTripData(true);

      // Show success message (would need a snackbar component to implement)
      console.log("Trip guests updated and invitations sent successfully");
    } catch (error) {
      console.error("Error updating guests and sending invitations:", error);
      setError(`Failed to update guests: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  // Helper function to generate a unique ID for groups or guests
  const generateId = () => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

  // Handle email change (validates email format)
  const handleEmailChange = (index, value) => {
    const updatedGuests = [...guests];
    updatedGuests[index] = {
      ...updatedGuests[index],
      email: value,
    };
    setGuests(updatedGuests);
  };

  // Handle updating guest information for any field
  const handleUpdateGuestInfo = (index, field, value) => {
    const updatedGuests = [...guests];
    updatedGuests[index] = {
      ...updatedGuests[index],
      [field]: value,
    };
    setGuests(updatedGuests);
  };

  // Handle adding a new guest
  const handleAddGuest = (type = "adult") => {
    if (!newGuestName.trim()) return;

    const newGuest = {
      _id: generateId(), // Temporary ID for UI purposes
      name: newGuestName.trim(),
      email: "",
      phone: "",
      type: type,
    };

    setGuests([...guests, newGuest]);
    setNewGuestName(""); // Reset the input field
  };

  // Handle removing a guest
  const handleRemoveGuest = (index) => {
    const guestToRemove = guests[index];
    const updatedGuests = guests.filter((_, i) => i !== index);
    setGuests(updatedGuests);

    // Also remove this guest from any groups they might be in
    if (guestToRemove && guestToRemove._id) {
      const updatedGroups = groups.map((group) => {
        return {
          ...group,
          level1: group.level1.filter((id) => id !== guestToRemove._id),
          level2: group.level2.filter((id) => id !== guestToRemove._id),
        };
      });
      setGroups(updatedGroups);
    }
  };

  // Handle adding a guest to a group
  const handleAddToGroup = (guestId, groupId) => {
    // Find the group in the state
    const groupIndex = groups.findIndex((g) => g.id === groupId);
    if (groupIndex === -1) return;

    // Find the guest to determine if they are adult or child
    const guest = guests.find((g) => g._id === guestId);
    if (!guest) return;

    // Create a copy of the groups
    const updatedGroups = [...groups];
    const group = { ...updatedGroups[groupIndex] };

    // Remove the guest from all other groups first
    updatedGroups.forEach((g, i) => {
      if (i !== groupIndex) {
        g.level1 = g.level1.filter((id) => id !== guestId);
        g.level2 = g.level2.filter((id) => id !== guestId);
      }
    });

    // Add to the appropriate level based on guest type
    if (guest.type === "adult") {
      // Remove from level2 if present
      group.level2 = group.level2.filter((id) => id !== guestId);
      // Add to level1 if not already there
      if (!group.level1.includes(guestId)) {
        group.level1 = [...group.level1, guestId];
      }
    } else {
      // Remove from level1 if present
      group.level1 = group.level1.filter((id) => id !== guestId);
      // Add to level2 if not already there
      if (!group.level2.includes(guestId)) {
        group.level2 = [...group.level2, guestId];
      }
    }

    // Update the group in the state
    updatedGroups[groupIndex] = group;
    setGroups(updatedGroups);
  };

  // Handle removing a guest from a group
  const handleRemoveFromGroup = (guestId, groupId) => {
    // Find the group in the state
    const groupIndex = groups.findIndex((g) => g.id === groupId);
    if (groupIndex === -1) return;

    // Create a copy of the groups
    const updatedGroups = [...groups];
    const group = { ...updatedGroups[groupIndex] };

    // Remove the guest from both levels
    group.level1 = group.level1.filter((id) => id !== guestId);
    group.level2 = group.level2.filter((id) => id !== guestId);

    // Update the group in the state
    updatedGroups[groupIndex] = group;
    setGroups(updatedGroups);
  };

  // Handle creating a new guest group
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup = {
      id: generateId(),
      name: newGroupName.trim(),
      level1: [], // adults
      level2: [], // children
    };

    setGroups([...groups, newGroup]);
    setNewGroupName("");
    setSelectedGroup(newGroup.id);
  };

  // Add a function to force offline mode and load from cache
  const handleBypassAPI = () => {
    console.log("Bypassing API calls and forcing local data");

    // Cancel any hanging requests
    if (window.cancelAllRequests) {
      console.log("Cancelling any pending requests");
      window.cancelAllRequests();
    }

    // Force offline mode
    if (toggleOfflineMode) {
      console.log("Forcing offline mode");
      toggleOfflineMode(true);
    }

    // Try to load from cache
    handleUseCache();

    // If no cache exists, just continue in offline mode with minimal data
    if (!cachedTripsAvailable.includes(tripId)) {
      console.log(
        "No cached data available, continuing with minimal trip data"
      );
      const minimalTrip = {
        id: tripId,
        tripName: "Trip Details Unavailable",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        description:
          "Unable to load full trip details. Please try again when connectivity improves.",
        experiences: [],
        userId: user?.id,
        _offline: true,
      };
      setTrip(minimalTrip);
      setFetchSource("offline-fallback");
      setLoading(false);
      setError(null);
      setShowRecoveryOptions(false);
    }
  };

  // Add a troubleshooting function to diagnose API issues
  const handleTroubleshootAPI = async () => {
    console.log("Troubleshooting API connection issues...");
    setLoading(true);
    setError("Diagnosing connection issues...");

    // Store diagnostic results
    const diagnostics = {
      serverHealth: false,
      tripsEndpoint: false,
      specificTripEndpoint: false,
      authValid: false,
      htmlResponse: false,
      rawResponse: null,
      errorDetails: [],
    };

    try {
      // 1. Check server health endpoint
      try {
        console.log("Checking server health endpoint...");
        const healthResponse = await fetch("/api/health", { timeout: 5000 });
        diagnostics.serverHealth = healthResponse.ok;
        console.log(`Health endpoint status: ${healthResponse.status}`);
        diagnostics.errorDetails.push(
          `Health endpoint: ${healthResponse.status}`
        );
      } catch (healthError) {
        console.error("Health endpoint check failed:", healthError);
        diagnostics.errorDetails.push(
          `Health endpoint error: ${healthError.message}`
        );
      }

      // 2. Check auth token
      const token = localStorage.getItem("token");
      diagnostics.authValid = !!token && token.length > 20;
      diagnostics.errorDetails.push(
        `Auth token valid: ${diagnostics.authValid}`
      );

      // 3. Try to access the trips endpoint with detailed diagnostics
      try {
        console.log("Testing trips endpoint...");
        const response = await fetch("/api/trips");
        diagnostics.tripsEndpoint = response.ok;
        const contentType = response.headers.get("content-type") || "";
        diagnostics.htmlResponse = contentType.includes("text/html");

        // Get raw response to examine
        const rawResponse = await response.text();
        if (rawResponse.length > 200) {
          diagnostics.rawResponse = rawResponse.substring(0, 200) + "...";
        } else {
          diagnostics.rawResponse = rawResponse;
        }

        diagnostics.errorDetails.push(
          `Trips endpoint: ${response.status}, Content-Type: ${contentType}`
        );

        if (diagnostics.htmlResponse) {
          console.warn("Received HTML instead of JSON from trips endpoint");
          diagnostics.errorDetails.push(
            `Received HTML instead of JSON. This usually indicates a server issue or authentication problem.`
          );
        }

        // Try to check if this trip exists in the list of all trips
        if (response.ok && !diagnostics.htmlResponse && tripId) {
          try {
            const tripsData = JSON.parse(rawResponse);
            console.log("Retrieved trips list:", tripsData);

            if (Array.isArray(tripsData)) {
              // Look for the trip in the response
              const foundTrip = tripsData.find(
                (trip) =>
                  trip.id === tripId ||
                  trip._id === tripId ||
                  trip.id === tripId.toString() ||
                  trip._id === tripId.toString()
              );

              if (foundTrip) {
                diagnostics.errorDetails.push(
                  `Trip with ID ${tripId} was found in your trips list. This suggests a possible API endpoint issue rather than data access problem.`
                );

                // Add details about the found trip
                diagnostics.errorDetails.push(
                  `Found trip info: Name=${
                    foundTrip.tripName || foundTrip.name
                  }, Created=${foundTrip.createdAt}`
                );
              } else {
                diagnostics.errorDetails.push(
                  `Trip with ID ${tripId} was NOT found in your trips list. This could mean you don't have access to this trip or it doesn't exist.`
                );
              }
            } else {
              diagnostics.errorDetails.push(
                `Trips list endpoint did not return an array as expected.`
              );
            }
          } catch (parseError) {
            console.error("Error parsing trips list:", parseError);
            diagnostics.errorDetails.push(
              `Error checking trip existence: ${parseError.message}`
            );
          }
        }
      } catch (tripsError) {
        console.error("Trips endpoint check failed:", tripsError);
        diagnostics.errorDetails.push(
          `Trips endpoint error: ${tripsError.message}`
        );
      }

      // Generate diagnostic report
      let diagnosticReport = "API Connection Diagnostics:\n\n";
      diagnosticReport += `- Server health endpoint: ${
        diagnostics.serverHealth ? "OK" : "FAILED"
      }\n`;
      diagnosticReport += `- Authentication token: ${
        diagnostics.authValid ? "VALID" : "INVALID/MISSING"
      }\n`;
      diagnosticReport += `- Trips endpoint: ${
        diagnostics.tripsEndpoint ? "OK" : "FAILED"
      }\n`;

      if (diagnostics.htmlResponse) {
        diagnosticReport +=
          "\nISSUE DETECTED: Server returned HTML instead of JSON.\n";
        diagnosticReport += "This typically indicates one of:\n";
        diagnosticReport += "- Authentication issue (invalid/expired token)\n";
        diagnosticReport += "- Server is returning an error page\n";
        diagnosticReport += "- API endpoint is misconfigured\n\n";
      }

      diagnosticReport += "Detailed Results:\n";
      diagnostics.errorDetails.forEach((detail, index) => {
        diagnosticReport += `${index + 1}. ${detail}\n`;
      });

      if (diagnostics.rawResponse) {
        diagnosticReport += "\nSample of raw response:\n";
        diagnosticReport += `${diagnostics.rawResponse}\n`;
      }

      // Determine most likely issue
      let likelyIssue = "";

      if (!diagnostics.serverHealth) {
        likelyIssue = "Server appears to be down or unreachable.";
      } else if (diagnostics.htmlResponse) {
        if (!diagnostics.authValid) {
          likelyIssue = "Authentication issue. Your session may have expired.";
        } else {
          likelyIssue =
            "Server is returning HTML instead of JSON. This may be a server-side error or misconfiguration.";
        }
      } else if (!diagnostics.tripsEndpoint) {
        likelyIssue =
          "API endpoints are not responding correctly. This may be a permission issue or API route problem.";
      }

      // Set the diagnostic error
      setError(`${likelyIssue}\n\n${diagnosticReport}`);
    } catch (troubleshootError) {
      console.error("Error during troubleshooting:", troubleshootError);
      setError(`Error during API diagnostics: ${troubleshootError.message}`);
    } finally {
      setLoading(false);
      setShowRecoveryOptions(true);
    }
  };

  // If there's an error, show error message with recovery options
  if (error) {
    let errorMessage = error;
    let showBypassButton = loadingAttempts > 2;
    let showResetEndpointButton = isTripsEndpointProblematic;
    let isTripNotFoundError =
      error.includes("not found") || error.includes("404");

    return (
      <Container>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minHeight: "70vh",
            textAlign: "center",
            pt: 4,
          }}
        >
          <ErrorIcon color="error" sx={{ fontSize: 60 }} />
          <Typography variant="h5" color="error" sx={{ mt: 2 }}>
            {loadingTimeout
              ? "Loading Timeout"
              : isTripNotFoundError
              ? "Trip Not Found"
              : "Error Loading Trip"}
          </Typography>

          {isTripNotFoundError ? (
            <Paper
              elevation={3}
              sx={{ p: 3, mt: 2, maxWidth: "600px", width: "100%" }}
            >
              <Typography variant="body1" sx={{ mb: 2 }}>
                We couldn't find the requested trip. This could be because:
              </Typography>
              <Box sx={{ textAlign: "left", mb: 2 }}>
                <ul>
                  <li>The trip has been deleted</li>
                  <li>You don't have permission to view this trip</li>
                  <li>The trip ID is incorrect</li>
                  <li>There's an issue with the API endpoint</li>
                </ul>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Trip ID: {tripId || "Not available"}
              </Typography>
            </Paper>
          ) : (
            <Typography variant="body1" sx={{ mt: 2, maxWidth: "600px" }}>
              {errorMessage}
            </Typography>
          )}

          <Box sx={{ mt: 3, mb: 2 }}>
            <Chip
              label={
                serverStatus === "online"
                  ? "Server Online"
                  : serverStatus === "offline"
                  ? "Server Offline"
                  : "Checking Server..."
              }
              color={
                serverStatus === "online"
                  ? "success"
                  : serverStatus === "offline"
                  ? "error"
                  : "default"
              }
              icon={
                serverStatus === "online" ? <CloudIcon /> : <CloudOffIcon />
              }
              sx={{ mr: 1 }}
            />
          </Box>

          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mt: 3, flexWrap: "wrap", gap: 1 }}
          >
            {isTripNotFoundError ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBackToDashboard}
                >
                  Back to Dashboard
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => navigate("/create-trip")}
                  startIcon={<AddIcon />}
                >
                  Create New Trip
                </Button>

                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<InfoIcon />}
                  onClick={handleTroubleshootAPI}
                >
                  Diagnose API Issue
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                >
                  Try Again
                </Button>

                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<InfoIcon />}
                  onClick={handleTroubleshootAPI}
                >
                  Diagnose API Issue
                </Button>

                {showResetEndpointButton && (
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={handleResetEndpointTracking}
                    startIcon={<WarningIcon />}
                  >
                    Reset API Tracking
                  </Button>
                )}

                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBackToDashboard}
                >
                  Back to Dashboard
                </Button>

                {showBypassButton && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleBypassAPI}
                    startIcon={<CloudOffIcon />}
                  >
                    Bypass API
                  </Button>
                )}

                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleForceReload}
                  startIcon={<RestartAltIcon />}
                >
                  Force Page Reload
                </Button>
              </>
            )}
          </Stack>

          {/* Show cached data option if available */}
          {serverStatus === "online" &&
            cachedTripsAvailable &&
            cachedTripsAvailable.includes(tripId) && (
              <Button
                variant="text"
                color="secondary"
                startIcon={<StorageIcon />}
                onClick={handleUseCache}
                sx={{ mt: 2 }}
              >
                Try Cached Version
              </Button>
            )}
        </Box>
      </Container>
    );
  }

  // If loading is true, show a loading indicator
  if (loading) {
    return (
      <Container>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "70vh",
            textAlign: "center",
          }}
        >
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Trip Details
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Attempt {loadingAttempts}/{maxAttempts}
          </Typography>

          <Box sx={{ mt: 4, mb: 2 }}>
            <Chip
              label={
                serverStatus === "online"
                  ? "Server Online"
                  : serverStatus === "offline"
                  ? "Server Offline"
                  : "Checking Server..."
              }
              color={
                serverStatus === "online"
                  ? "success"
                  : serverStatus === "offline"
                  ? "error"
                  : "default"
              }
              icon={
                serverStatus === "online" ? <CloudIcon /> : <CloudOffIcon />
              }
            />
          </Box>

          {/* Show offline option if server appears offline or loading has taken a while */}
          {(serverStatus === "offline" || loadingAttempts > 1) && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<StorageIcon />}
                onClick={() => {
                  toggleOfflineMode(true);
                  // Also try to use cache
                  handleUseCache();
                }}
              >
                Switch to Offline Mode
              </Button>
            </Box>
          )}

          {loadingAttempts > 1 && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="text"
                color="primary"
                onClick={handleBackToDashboard}
                startIcon={<ArrowBackIcon />}
              >
                Return to Dashboard
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    );
  }

  if (loadingTimeout || error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Alert
            severity="error"
            sx={{
              width: "100%",
              mb: 3,
              "& .MuiAlert-message": { width: "100%" },
            }}
          >
            <Typography variant="h6" component="div" sx={{ mb: 1 }}>
              {loadingTimeout ? "Loading Timeout" : "Error Loading Trip"}
            </Typography>
            <Typography variant="body1">
              {error ||
                "The request took too long to complete. This could be due to server load or connectivity issues."}
            </Typography>

            {/* Show server status in error UI */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mt: 2,
                gap: 1,
              }}
            >
              <Typography variant="body2">Server status:</Typography>
              <Chip
                size="small"
                label={
                  serverStatus === "online"
                    ? "Online"
                    : serverStatus === "offline"
                    ? "Offline"
                    : "Unknown"
                }
                color={
                  serverStatus === "online"
                    ? "success"
                    : serverStatus === "offline"
                    ? "error"
                    : "default"
                }
              />
            </Box>

            {(serverStatus === "offline" || loadingTimeout) && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {serverStatus === "offline"
                  ? "The server appears to be offline. Try using offline mode if you've visited this trip before."
                  : "The server might still be processing your request in the background. You can try refreshing the page or loading from cached data."}
              </Typography>
            )}
          </Alert>

          <Box
            sx={{
              mt: 3,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <Button variant="contained" onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </Button>

            {serverStatus !== "offline" && (
              <Button
                variant="outlined"
                onClick={() => {
                  // Force refresh the trips in context
                  refreshTrips();
                  // Then refresh this component
                  setLoadingAttempts(1);
                  setLoadingTimeout(false);
                  setLoading(true);
                  setError(null);

                  // Wait a moment for context to refresh
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                }}
              >
                Refresh & Retry
              </Button>
            )}

            {/* Only show the offline mode button if the server is offline or we're in a loading timeout */}
            {(serverStatus === "offline" || loadingTimeout) &&
              !forceOfflineMode &&
              trips &&
              trips.length > 0 && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setForceOfflineMode(true);
                    setLoadingAttempts(1);
                    setLoadingTimeout(false);
                    setLoading(true);
                    setError(null);
                  }}
                >
                  Try Offline Mode
                </Button>
              )}

            {trips && trips.length > 0 && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  // Try to find the trip in the already loaded trips
                  const cachedTrip = trips.find((t) => t._id === tripId);

                  if (cachedTrip) {
                    // If we find it, use it directly
                    console.log("Using cached trip data:", cachedTrip);
                    setTrip(cachedTrip);

                    // Set user role
                    const userStr = localStorage.getItem("user");
                    let userId = null;
                    if (userStr) {
                      try {
                        const userData = JSON.parse(userStr);
                        userId = userData._id || userData.id;
                      } catch (e) {
                        userId = userStr;
                      }
                    }

                    if (
                      userId &&
                      cachedTrip.userId &&
                      (userId === cachedTrip.userId ||
                        userId === cachedTrip.userId.toString())
                    ) {
                      setUserRole("owner");
                    } else {
                      const collaborators = cachedTrip.collaborators || [];
                      const collaborator = collaborators.find(
                        (c) =>
                          c &&
                          c.user &&
                          (c.user._id === userId ||
                            c.user._id === userId?.toString() ||
                            c.user === userId ||
                            c.user === userId?.toString())
                      );
                      setUserRole(collaborator?.role || "viewer");
                    }

                    setCollaborators(cachedTrip.collaborators || []);
                    setFetchSource("manual-cache");
                    setLoadingTimeout(false);
                    setError(null);
                  } else {
                    // If not found, show an error
                    setError(
                      "Trip not found in cached data. Please return to dashboard and try again."
                    );
                  }
                }}
              >
                Use Cached Data
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    );
  }

  if (!trip) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" component="div" sx={{ mb: 2 }}>
            Trip Not Found
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            The trip you're looking for was not found or you may not have
            permission to view it.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  // Trip status logic
  const today = new Date();
  const tripStart = new Date(trip.startDate);
  const tripEnd = new Date(trip.endDate);

  let statusColor = "default";
  let statusText = "Planning";

  if (today >= tripStart && today <= tripEnd) {
    statusColor = "success";
    statusText = "In Progress";
  } else if (today > tripEnd) {
    statusColor = "secondary";
    statusText = "Completed";
  } else if (tripStart.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000) {
    statusColor = "warning";
    statusText = "Upcoming";
  }

  // Data source label
  const getSourceLabel = () => {
    switch (fetchSource) {
      case "context":
        return "from cached data";
      case "direct":
        return "from server";
      case "direct-alt":
        return "from server (alt)";
      case "userTrips":
        return "from user trips";
      case "offline-cache":
        return "offline mode";
      case "manual-cache":
        return "manually loaded cache";
      default:
        return "";
    }
  };

  // Filter experiences by type for tabs
  const experiences = trip.experiences || [];
  const upcomingExperiences = experiences.filter(
    (exp) => new Date(exp.date) >= today
  );
  const mealExperiences = experiences.filter((exp) => exp.type === "meal");
  const activityExperiences = experiences.filter(
    (exp) => exp.type === "activity"
  );
  const otherExperiences = experiences.filter(
    (exp) => exp.type !== "meal" && exp.type !== "activity"
  );

  // Helper function to generate themed avatar colors (purple, green, blue)
  const getThemedAvatarColor = (name) => {
    if (!name) return "#673ab7"; // Default purple

    // Base theme colors
    const themeColors = [
      "#673ab7", // Purple
      "#4caf50", // Green
      "#2196f3", // Blue
      "#9c27b0", // Deep Purple
      "#00bcd4", // Cyan
      "#3f51b5", // Indigo
    ];

    // Use the first character of the name to determine the color
    const charCode = name.charCodeAt(0);
    return themeColors[charCode % themeColors.length];
  };

  // Handle opening the edit experience dialog
  const handleOpenEditExperience = (experience) => {
    // Format the dates for the form
    let startDate = null;
    if (experience.date) {
      startDate = new Date(experience.date);
    }

    let endDate = null;
    if (experience.endDate) {
      endDate = new Date(experience.endDate);
    }

    // Create the edited experience object with all the required fields
    setEditingExperience({
      _id: experience._id,
      title: experience.title || "",
      date: startDate,
      startTime: experience.startTime || "",
      endTime: experience.endTime || "",
      isMultiDay: experience.isMultiDay || false,
      endDate: endDate,
      type: experience.type || "activity",
      location: experience.location || "",
      details: experience.details || "",
      guests: experience.guests || [],
      mealType: experience.mealType || "restaurant",
    });

    setOpenEditExperienceDialog(true);
  };

  // Handle changes to the editing experience form fields
  const handleEditExperienceChange = (e) => {
    const { name, value } = e.target;
    setEditingExperience((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle checkbox changes
  const handleEditExperienceCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setEditingExperience((prev) => ({
      ...prev,
      [name]: checked,
      // Reset end time if switching to multi-day
      endTime: name === "isMultiDay" && checked ? "" : prev.endTime,
      // Reset end date if switching to single day
      endDate: name === "isMultiDay" && !checked ? null : prev.endDate,
    }));
  };

  // Handle date changes
  const handleEditExperienceDateChange = (name, date) => {
    setEditingExperience((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  // Handle time changes
  const handleEditExperienceTimeChange = (name, timeValue) => {
    setEditingExperience((prev) => ({
      ...prev,
      [name]: timeValue ? timeValue.format("HH:mm") : "",
    }));
  };

  // Handle guest selection toggle
  const handleEditExperienceGuestToggle = (guestName) => {
    setEditingExperience((prev) => {
      const currentGuests = prev.guests || [];
      const newGuests = currentGuests.includes(guestName)
        ? currentGuests.filter((name) => name !== guestName)
        : [...currentGuests, guestName];

      return {
        ...prev,
        guests: newGuests,
      };
    });
  };

  // Handle save/update of the edited experience
  const handleSaveEditedExperience = async () => {
    setEditExperienceLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Format dates for API
      const formattedDate = editingExperience.date
        ? new Date(editingExperience.date).toISOString()
        : null;

      const formattedEndDate = editingExperience.endDate
        ? new Date(editingExperience.endDate).toISOString()
        : null;

      // Create the data to send
      const experienceData = {
        title: editingExperience.title,
        date: formattedDate,
        startTime: editingExperience.startTime,
        endTime: editingExperience.isMultiDay
          ? null
          : editingExperience.endTime,
        isMultiDay: editingExperience.isMultiDay,
        endDate: formattedEndDate,
        type: editingExperience.type,
        location: editingExperience.location,
        details: editingExperience.details,
        guests: editingExperience.guests,
      };

      // Add meal type if applicable
      if (editingExperience.type === "meal") {
        experienceData.mealType = editingExperience.mealType;
      }

      const response = await axios.put(
        `/api/trips/${tripId}/experiences/${editingExperience._id}`,
        experienceData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        // Update the local state with the edited experience
        setTrip((prev) => ({
          ...prev,
          experiences: prev.experiences.map((exp) =>
            exp._id === editingExperience._id
              ? { ...exp, ...experienceData }
              : exp
          ),
        }));

        // Close the dialog and show success message
        setOpenEditExperienceDialog(false);
        setSnackbarMessage("Experience updated successfully");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error updating experience:", error);
      setError("Failed to update experience. Please try again.");
    } finally {
      setEditExperienceLoading(false);
    }
  };

  // Filter lodgings by type
  const hotelLodgings =
    trip?.lodgings?.filter((lodging) => lodging.lodgingType === "hotel") || [];

  const airbnbLodgings =
    trip?.lodgings?.filter((lodging) => lodging.lodgingType === "airbnb") || [];

  const resortLodgings =
    trip?.lodgings?.filter((lodging) => lodging.lodgingType === "resort") || [];

  const otherLodgings =
    trip?.lodgings?.filter(
      (lodging) => lodging.lodgingType === "other" || !lodging.lodgingType
    ) || [];

  // Function to get icon based on lodging type
  function getLodgingIcon(type) {
    switch (type) {
      case "hotel":
        return <HotelIcon />;
      case "airbnb":
        return <HouseIcon />;
      case "resort":
        return <ResortIcon />;
      default:
        return <HomeWorkIcon />;
    }
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "100%",
        overflow: "auto",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          py: 3,
          height: "100%",
          overflow: "auto",
        }}
      >
        <TripHeader
          trip={trip}
          formatDate={formatDate}
          getDaysRemaining={getDaysRemaining}
          navigateToCalendarView={navigateToCalendarView}
          onDeleteClick={() => setOpenDeleteDialog(true)}
          userRole={userRole}
        />

        <Grid container spacing={3} sx={{ height: "100%", mt: -4.6 }}>
          {/* Trip Overview Card */}
          <Grid item xs={12} md={8} sx={{ height: "100%" }}>
            <Card elevation={2} sx={{ borderRadius: 2, height: "100%" }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <CalendarIcon sx={{ mr: 1 }} />
                    Trip Overview
                  </Typography>
                  {userRole === "owner" && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => {
                        setEditedTrip({
                          tripName: trip.tripName,
                          startDate: trip.startDate,
                          endDate: trip.endDate,
                          location: trip.location || trip.destination,
                        });
                        setOpenEditDialog(true);
                      }}
                      startIcon={<EditIcon />}
                      sx={{
                        minWidth: "32px",
                        padding: "1px 1px 1px 11px",
                        fontSize: "0.75rem",
                        height: "28px",
                      }}
                    ></Button>
                  )}
                </Box>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Trip Duration
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {getTripDuration(trip.startDate, trip.endDate)}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formatDate(trip.startDate)}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      End Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(trip.endDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Guests
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {trip.guests?.length || 0} guests
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {trip.location || trip.destination || "Not specified"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Experiences
                    </Typography>
                    <Typography variant="body1">
                      {experiences.length > 0
                        ? `${experiences.length} planned`
                        : "No experiences added"}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Guests Preview Card */}
          <Grid item xs={12} md={4} sx={{ height: "100%" }}>
            <Card elevation={2} sx={{ borderRadius: 2, height: "100%" }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <PeopleIcon sx={{ mr: 1 }} />
                    Guests
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => setOpenGroupsDialog(true)}
                      endIcon={<GroupIcon />}
                      sx={{
                        minWidth: "32px",
                        padding: "1px 10px 1px 11px",
                        fontSize: "0.75rem",
                        height: "28px",
                      }}
                    >
                      Groups
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate(`/trips/${tripId}/guests`)}
                      startIcon={<EditIcon />}
                      sx={{
                        minWidth: "32px",
                        padding: "1px 1px 1px 11px",
                        fontSize: "0.75rem",
                        height: "28px",
                      }}
                    ></Button>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {trip.guests && trip.guests.length > 0 ? (
                  <>
                    <AvatarGroup
                      max={5}
                      sx={{ mb: 2, justifyContent: "center" }}
                    >
                      {trip.guests.map((guest) => (
                        <Avatar
                          key={guest._id}
                          alt={guest.name}
                          sx={{ bgcolor: stringToColor(guest.name) }}
                        >
                          {guest.name.charAt(0)}
                        </Avatar>
                      ))}
                    </AvatarGroup>

                    <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                      <Grid container spacing={1}>
                        {trip.guests.slice(0, 6).map((guest) => (
                          <Grid item xs={6} key={guest._id}>
                            <Chip
                              avatar={
                                <Avatar
                                  sx={{ bgcolor: stringToColor(guest.name) }}
                                >
                                  {guest.name.charAt(0)}
                                </Avatar>
                              }
                              label={guest.name}
                              variant="outlined"
                              sx={{ width: "100%" }}
                            />
                          </Grid>
                        ))}
                      </Grid>

                      {trip.guests.length > 6 && (
                        <Typography
                          variant="body2"
                          align="center"
                          sx={{
                            mt: 1,
                            color: "text.secondary",
                            fontStyle: "italic",
                          }}
                        >
                          +{trip.guests.length - 6} more guests
                        </Typography>
                      )}
                    </Box>
                  </>
                ) : (
                  <Box sx={{ textAlign: "center", py: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontStyle: "italic", mb: 2 }}
                    >
                      No guests added yet
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/trips/${tripId}/guests`)}
                      startIcon={<AddIcon />}
                    >
                      Add Guests
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid
          container
          spacing={1.4}
          sx={{
            display: "flex",
            width: "100%",
            flexDirection: "column",
            columnGap: 1.5,
            height: "55%",
          }}
        >
          {/* Experiences Section */}
          <Grid item xs={12} sx={{ width: "50%", height: "100%" }}>
            <Card
              elevation={2}
              sx={{
                borderRadius: 2,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                width: "100%",
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      color: "var(--text-primary)",
                      textShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    <ActivityIcon sx={{ mr: 1, color: "#4776E6" }} />
                    Experiences
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateExperience}
                    size="small"
                    sx={{
                      backgroundImage:
                        "linear-gradient(90deg, #4776E6 0%, #8E54E9 100%)",
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                      "&:hover": {
                        backgroundImage:
                          "linear-gradient(90deg, #8E54E9 0%, #4776E6 100%)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)",
                      },
                    }}
                  >
                    Create Experience
                  </Button>
                </Box>

                <Tabs
                  value={experienceTab}
                  onChange={handleExperienceTabChange}
                  sx={{
                    borderBottom: 1,
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    mb: 2,
                  }}
                  TabIndicatorProps={{
                    style: {
                      background:
                        "linear-gradient(90deg, #4776E6 0%, #8E54E9 100%)",
                    },
                  }}
                  textColor="inherit"
                >
                  <Tab label={`Upcoming (${upcomingExperiences.length})`} />
                  <Tab label={`Meals (${mealExperiences.length})`} />
                  <Tab label={`Activities (${activityExperiences.length})`} />
                  <Tab label={`Other (${otherExperiences.length})`} />
                  <Tab label={`All (${experiences.length})`} />
                </Tabs>

                <Box sx={{ minHeight: 200, maxHeight: 250, overflow: "auto" }}>
                  {experiences.length === 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 4,
                      }}
                    >
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        No experiences added yet
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleCreateExperience}
                        sx={{
                          borderColor: "rgba(255, 255, 255, 0.2)",
                          color: "var(--text-primary)",
                          "&:hover": {
                            borderColor: "rgba(255, 255, 255, 0.5)",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                          },
                        }}
                      >
                        Add your first experience
                      </Button>
                    </Box>
                  ) : (
                    <List sx={{ px: 1 }}>
                      {(experienceTab === 0
                        ? upcomingExperiences
                        : experienceTab === 1
                        ? mealExperiences
                        : experienceTab === 2
                        ? activityExperiences
                        : experienceTab === 3
                        ? otherExperiences
                        : experiences
                      )
                        .slice(0, 5)
                        .map((exp, index) => (
                          <ListItem
                            key={exp._id || index}
                            secondaryAction={
                              <Box sx={{ display: "flex", gap: 1 }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleViewExperience(exp)}
                                  sx={{
                                    borderColor: "rgba(255, 255, 255, 0.2)",
                                    color: "var(--text-primary)",
                                    "&:hover": {
                                      borderColor: "rgba(255, 255, 255, 0.5)",
                                      backgroundColor:
                                        "rgba(255, 255, 255, 0.05)",
                                    },
                                  }}
                                >
                                  Details
                                </Button>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteExperience(exp._id);
                                  }}
                                  sx={{
                                    color: "#ef473a",
                                    "&:hover": {
                                      backgroundColor: "rgba(239, 71, 58, 0.1)",
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            }
                            sx={{
                              mb: 1.5,
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: 2,
                              backgroundColor: "rgba(0, 0, 0, 0.4)",
                              backdropFilter: "blur(5px)",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.6)",
                                transform: "translateY(-2px)",
                                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                              },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  background: `linear-gradient(135deg, ${getExperienceTypeColor(
                                    exp.type
                                  )} 0%, rgba(0, 0, 0, 0.5) 100%)`,
                                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                                }}
                              >
                                {getExperienceIcon(exp.type)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="medium"
                                  sx={{ color: "var(--text-primary)" }}
                                >
                                  {exp.title || exp.type}
                                </Typography>
                              }
                              secondary={
                                <React.Fragment>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    sx={{
                                      color: "var(--text-secondary)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      mt: 0.5,
                                    }}
                                  >
                                    <CalendarTodayIcon fontSize="small" />
                                    {formatDate(exp.date)} •{" "}
                                    {formatTime(exp.startTime)}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: "var(--text-muted)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      mt: 0.5,
                                    }}
                                  >
                                    <LocationOnIcon fontSize="small" />
                                    {exp.location || "Location not specified"}
                                  </Typography>
                                </React.Fragment>
                              }
                            />
                          </ListItem>
                        ))}

                      {experienceTab === 4 && experiences.length > 5 && (
                        <Box sx={{ textAlign: "center", mt: 2 }}>
                          <Button
                            variant="text"
                            onClick={() =>
                              navigate(`/trips/${tripId}/experiences`)
                            }
                            sx={{
                              color: "#4776E6",
                              "&:hover": {
                                color: "#8E54E9",
                                backgroundColor: "rgba(71, 118, 230, 0.1)",
                              },
                            }}
                          >
                            View all {experiences.length} experiences
                          </Button>
                        </Box>
                      )}
                    </List>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Lodging Section */}
          <Grid item xs={12} sx={{ width: "50%", height: "100%" }}>
            <Card
              elevation={2}
              sx={{
                borderRadius: 2,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                width: "100%",
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      color: "var(--text-primary)",
                      textShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    <Box sx={{ mr: 1, color: "#4776E6" }}>
                      {lodgingTab === 0 && <HotelIcon />}
                      {lodgingTab === 1 && <HotelIcon />}
                      {lodgingTab === 2 && <HouseIcon />}
                      {lodgingTab === 3 && <ResortIcon />}
                      {lodgingTab === 4 && <HomeWorkIcon />}
                    </Box>
                    Lodging
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/trips/${tripId}/lodging`)}
                    size="small"
                    sx={{
                      backgroundImage:
                        lodgingTab === 0
                          ? "linear-gradient(90deg, #4776E6 0%, #8E54E9 100%)"
                          : lodgingTab === 1
                          ? "linear-gradient(90deg, #4776E6 0%, #1E4EC0 100%)"
                          : lodgingTab === 2
                          ? "linear-gradient(90deg, #FF385C 0%, #B82642 100%)"
                          : lodgingTab === 3
                          ? "linear-gradient(90deg, #00BFA5 0%, #018786 100%)"
                          : "linear-gradient(90deg, #8E54E9 0%, #5E35B1 100%)",
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                      "&:hover": {
                        backgroundImage:
                          lodgingTab === 0
                            ? "linear-gradient(90deg, #8E54E9 0%, #4776E6 100%)"
                            : lodgingTab === 1
                            ? "linear-gradient(90deg, #1E4EC0 0%, #4776E6 100%)"
                            : lodgingTab === 2
                            ? "linear-gradient(90deg, #B82642 0%, #FF385C 100%)"
                            : lodgingTab === 3
                            ? "linear-gradient(90deg, #018786 0%, #00BFA5 100%)"
                            : "linear-gradient(90deg, #5E35B1 0%, #8E54E9 100%)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)",
                      },
                    }}
                  >
                    Add Lodging
                  </Button>
                </Box>

                <Tabs
                  value={lodgingTab}
                  onChange={handleLodgingTabChange}
                  sx={{
                    borderBottom: 1,
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    mb: 2,
                  }}
                  TabIndicatorProps={{
                    style: {
                      background:
                        lodgingTab === 0
                          ? "linear-gradient(90deg, #4776E6 0%, #8E54E9 100%)"
                          : lodgingTab === 1
                          ? "#4776E6"
                          : lodgingTab === 2
                          ? "#FF385C"
                          : lodgingTab === 3
                          ? "#00BFA5"
                          : "#8E54E9",
                    },
                  }}
                  textColor="inherit"
                >
                  <Tab label={`All (${trip.lodgings?.length || 0})`} />
                  <Tab label={`Hotels (${hotelLodgings.length})`} />
                  <Tab label={`Airbnb (${airbnbLodgings.length})`} />
                  <Tab label={`Resorts (${resortLodgings.length})`} />
                  <Tab label={`Other (${otherLodgings.length})`} />
                </Tabs>

                <Box sx={{ minHeight: 200, maxHeight: 250, overflow: "auto" }}>
                  {trip.lodgings && trip.lodgings.length > 0 ? (
                    <List sx={{ px: 1 }}>
                      {(lodgingTab === 0
                        ? trip.lodgings
                        : lodgingTab === 1
                        ? hotelLodgings
                        : lodgingTab === 2
                        ? airbnbLodgings
                        : lodgingTab === 3
                        ? resortLodgings
                        : otherLodgings
                      )
                        .slice(0, 3)
                        .map((lodging) => (
                          console.log(lodging),
                          <ListItem
                            key={lodging._id}
                            secondaryAction={
                              <Box sx={{ display: "flex", gap: 1 }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleViewLodging(lodging)}
                                  sx={{
                                    borderColor: "rgba(255, 255, 255, 0.2)",
                                    color: "var(--text-primary)",
                                    "&:hover": {
                                      borderColor: "rgba(255, 255, 255, 0.5)",
                                      backgroundColor:
                                        "rgba(255, 255, 255, 0.05)",
                                    },
                                  }}
                                >
                                  Details
                                </Button>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLodging(lodging._id);
                                  }}
                                  sx={{
                                    color: "#ef473a",
                                    "&:hover": {
                                      backgroundColor: "rgba(239, 71, 58, 0.1)",
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            }
                            sx={{
                              mb: 1.5,
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: 2,
                              backgroundColor: "rgba(0, 0, 0, 0.4)",
                              backdropFilter: "blur(5px)",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.6)",
                                transform: "translateY(-2px)",
                                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                              },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  background: `linear-gradient(135deg, ${getLodgingTypeColor(
                                    lodging.lodgingType || "other"
                                  )} 0%, rgba(0, 0, 0, 0.5) 100%)`,
                                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                                }}
                              >
                                {getLodgingIcon(lodging.lodgingType)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="medium"
                                  sx={{ color: "var(--text-primary)" }}
                                >
                                  {lodging.name}
                                  <Chip
                                    label={lodging.lodgingType || "other"}
                                    size="small"
                                    sx={{ ml: 1 }}
                                    color="primary"
                                  />
                                </Typography>
                              }
                              secondary={
                                <React.Fragment>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    sx={{
                                      color: "var(--text-secondary)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      mt: 0.5,
                                    }}
                                  >
                                    <LocationIcon fontSize="small" />
                                    {lodging.location}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: "var(--text-muted)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      mt: 0.5,
                                    }}
                                  >
                                    <CalendarIcon fontSize="small" />
                                    {formatDate(lodging.checkIn)} -{" "}
                                    {formatDate(lodging.checkOut)}
                                  </Typography>
                                </React.Fragment>
                              }
                            />
                          </ListItem>
                        ))}

                      {((lodgingTab === 0 && trip.lodgings.length > 3) ||
                        (lodgingTab === 1 && hotelLodgings.length > 3) ||
                        (lodgingTab === 2 && airbnbLodgings.length > 3) ||
                        (lodgingTab === 3 && resortLodgings.length > 3) ||
                        (lodgingTab === 4 && otherLodgings.length > 3)) && (
                        <Box sx={{ textAlign: "center", mt: 2 }}>
                          <Button
                            variant="text"
                            onClick={() => navigate(`/trips/${tripId}/lodging`)}
                            sx={{
                              color: "#4776E6",
                              "&:hover": {
                                color: "#8E54E9",
                                backgroundColor: "rgba(71, 118, 230, 0.1)",
                              },
                            }}
                          >
                            View all{" "}
                            {lodgingTab === 0
                              ? trip.lodgings.length
                              : lodgingTab === 1
                              ? hotelLodgings.length
                              : lodgingTab === 2
                              ? airbnbLodgings.length
                              : lodgingTab === 3
                              ? resortLodgings.length
                              : otherLodgings.length}{" "}
                            lodgings
                          </Button>
                        </Box>
                      )}
                    </List>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 4,
                      }}
                    >
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        No lodging added yet
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => navigate(`/trips/${tripId}/lodging`)}
                        sx={{
                          borderColor: "rgba(255, 255, 255, 0.2)",
                          color: "var(--text-primary)",
                          "&:hover": {
                            borderColor: "rgba(255, 255, 255, 0.5)",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                          },
                        }}
                      >
                        Add your first lodging
                      </Button>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Access Links */}
        <Grid
          container
          sx={{
            mt: 1, // Reduced from 6 to 2 to decrease the large gap
            mb: 4, // Add margin bottom for spacing at the bottom
            width: "100%",
          }}
        >
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                gap: 2, // Add gap between items
                flexWrap: "wrap", // Allow wrapping on smaller screens
                px: 2, 
              }}
            >
              {[
                {
                  icon: <ChecklistIcon />,
                  title: "Packing List",
                  color: "#9c27b0",
                  path: `/trips/${tripId}/packing`,
                  count: 0,
                },
                {
                  icon: <BudgetIcon />,
                  title: "Budget",
                  color: "#f44336",
                  path: `/trips/${tripId}/budget`,
                  count: 0,
                },
                {
                  icon: <SmartToyIcon />,
                  title: "Alfred Planner",
                  color: "#ff9800",
                  path: `/trips/${tripId}/planner`,
                  count: 0,
                },
                {
                  icon: <NotesIcon />,
                  title: "Notes",
                  color: "#2196f3",
                  path: `/trips/${tripId}/notes`,
                  count: 0,
                },
                {
                  icon: <CalendarIcon />,
                  title: "Calendar",
                  color: "#4caf50",
                  path: `/trips/${tripId}/calendar`,
                  count: 0,
                },
              ].map((item, index) => (
                <Card
                  key={index}
                  elevation={2}
                  sx={{
                    borderRadius: 10,
                    cursor: "pointer",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-5px)" },
                    width: { xs: "210px", sm: "210px" },
                    height: { xs: "210px", sm: "210px" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() => navigate(item.path)}
                >
                  <CardContent sx={{ textAlign: "center", p: 2 }}>
                    <Badge
                      badgeContent={item.count}
                      color="primary"
                      sx={{ display: "inline-block", mb: 1 }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: item.color,
                          width: 70,
                          height: 70,
                          margin: "0 auto 8px",
                        }}
                      >
                        {item.icon}
                      </Avatar>
                    </Badge>
                    <Typography variant="body1" fontWeight="medium" sx={{ fontSize: "1.4rem" }}>
                      {item.title}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* Experience Details Dialog */}
        <Dialog
          open={openExperienceDialog}
          onClose={() => setOpenExperienceDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          {selectedExperience && (
            <>
              <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
                <Avatar
                  sx={{
                    mr: 1,
                    bgcolor: getExperienceTypeColor(selectedExperience.type),
                  }}
                >
                  {getExperienceIcon(selectedExperience.type)}
                </Avatar>
                <Typography variant="h6">
                  {selectedExperience.title || selectedExperience.type}
                </Typography>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      <TimeIcon
                        fontSize="small"
                        sx={{ mr: 0.5, verticalAlign: "middle" }}
                      />
                      Date & Time
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {formatDate(selectedExperience.date)}
                      {selectedExperience.startTime &&
                        ` at ${formatTime(selectedExperience.startTime)}`}
                      {selectedExperience.endTime &&
                        ` - ${formatTime(selectedExperience.endTime)}`}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      <PlaceIcon
                        fontSize="small"
                        sx={{ mr: 0.5, verticalAlign: "middle" }}
                      />
                      Location
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {selectedExperience.location || "Location not specified"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      <GroupIcon
                        fontSize="small"
                        sx={{ mr: 0.5, verticalAlign: "middle" }}
                      />
                      Participating Guests
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {selectedExperience.guests &&
                      selectedExperience.guests.length > 0 ? (
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {selectedExperience.guests.map((guest, idx) => (
                            <Chip
                              key={idx}
                              avatar={
                                <Avatar sx={{ bgcolor: stringToColor(guest) }}>
                                  {guest.charAt(0)}
                                </Avatar>
                              }
                              label={guest}
                              size="small"
                              sx={{ mb: 1 }}
                            />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No guests specified
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {selectedExperience.details && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        <NotesIcon
                          fontSize="small"
                          sx={{ mr: 0.5, verticalAlign: "middle" }}
                        />
                        Details
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {selectedExperience.details}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => {
                    setOpenExperienceDialog(false);
                    handleOpenEditExperience(selectedExperience);
                  }}
                  color="primary"
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>
                <Button
                  color="error"
                  onClick={() => {
                    setOpenExperienceDialog(false);
                    handleDeleteExperience(selectedExperience._id);
                  }}
                  startIcon={<DeleteIcon />}
                >
                  Delete
                </Button>
                <Button
                  onClick={() => setOpenExperienceDialog(false)}
                  color="primary"
                >
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Edit Trip Dialog */}
        <Dialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Trip Details</DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Trip Name"
                    value={editedTrip?.tripName || ""}
                    onChange={(e) =>
                      setEditedTrip({ ...editedTrip, tripName: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Start Date
                    </Typography>
                    <input
                      type="date"
                      id="trip-start-date"
                      value={
                        editedTrip?.startDate
                          ? new Date(editedTrip.startDate)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        // Create a complete date with time components
                        try {
                          const dateValue = e.target.value; // Format: YYYY-MM-DD

                          // Create a new ISO string with the selected date and default time
                          const newDate = new Date(
                            `${dateValue}T12:00:00.000Z`
                          );

                          setEditedTrip({
                            ...editedTrip,
                            startDate: newDate.toISOString(),
                          });
                        } catch (error) {
                          console.error("Error processing date:", error);
                          alert(
                            "There was an error setting the date. Please try again."
                          );
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "16px",
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.currentTarget.showPicker();
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      End Date
                    </Typography>
                    <input
                      type="date"
                      id="trip-end-date"
                      value={
                        editedTrip?.endDate
                          ? new Date(editedTrip.endDate)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        // Create a complete date with time components
                        try {
                          const dateValue = e.target.value; // Format: YYYY-MM-DD

                          // Create a new ISO string with the selected date and default time
                          const newDate = new Date(
                            `${dateValue}T12:00:00.000Z`
                          );

                          setEditedTrip({
                            ...editedTrip,
                            endDate: newDate.toISOString(),
                          });
                        } catch (error) {
                          console.error("Error processing date:", error);
                          alert(
                            "There was an error setting the date. Please try again."
                          );
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "16px",
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.currentTarget.showPicker();
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={editedTrip?.location || ""}
                    onChange={(e) =>
                      setEditedTrip({ ...editedTrip, location: e.target.value })
                    }
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenEditDialog(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditTrip}
              variant="contained"
              disabled={editLoading}
              startIcon={
                editLoading ? <CircularProgress size={20} /> : <EditIcon />
              }
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Trip Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Trip</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this trip? This action cannot be
              undone. All experiences, chats, and associated data will be
              permanently deleted.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenDeleteDialog(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTrip}
              color="error"
              disabled={deleteLoading}
              startIcon={
                deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />
              }
            >
              {deleteLoading ? "Deleting..." : "Delete Trip"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Groups Dialog */}
        <Dialog
          open={openGroupsDialog}
          onClose={() => setOpenGroupsDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              maxHeight: "90vh",
            },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: "1px solid",
              borderColor: "divider",
              px: 3,
              py: 2,
              bgcolor: "primary.lighter",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "bold",
                }}
              >
                <GroupIcon
                  sx={{ mr: 1.5, color: "primary.main", fontSize: 28 }}
                />
                Guest Groups
              </Typography>
              <IconButton
                onClick={() => setOpenGroupsDialog(false)}
                size="small"
                sx={{
                  bgcolor: "background.paper",
                  "&:hover": { bgcolor: "grey.200" },
                  boxShadow: 1,
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 3, py: 3 }}>
            {trip.guestRelationships && trip.guestRelationships.length > 0 ? (
              <Grid container spacing={3}>
                {trip.guestRelationships.map((relationship, index) => {
                  // Get all guests from both levels
                  const level1Guests = Array.isArray(relationship.level1)
                    ? relationship.level1
                        .map((guest) => {
                          if (typeof guest === "string") {
                            return trip.guests.find((g) => g._id === guest);
                          }
                          return guest;
                        })
                        .filter(Boolean)
                    : [];

                  const level2Guests = Array.isArray(relationship.level2)
                    ? relationship.level2
                        .map((guest) => {
                          if (typeof guest === "string") {
                            return trip.guests.find((g) => g._id === guest);
                          }
                          return guest;
                        })
                        .filter(Boolean)
                    : [];

                  // Skip empty groups
                  if (level1Guests.length === 0 && level2Guests.length === 0) {
                    return null;
                  }

                  return (
                    <Grid item xs={12} md={6} key={relationship._id || index}>
                      <Paper
                        elevation={2}
                        sx={{
                          overflow: "hidden",
                          borderRadius: 2,
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: 4,
                          },
                        }}
                      >
                        {/* Group header */}
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                          }}
                        >
                          <Typography variant="h6" fontWeight="bold">
                            {relationship.name}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mt: 0.5,
                              color: "primary.contrastText",
                              opacity: 0.9,
                            }}
                          >
                            <GroupIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            <Typography variant="body2">
                              {level1Guests.length + level2Guests.length}{" "}
                              members
                            </Typography>
                          </Box>
                        </Box>

                        {/* Group members display */}
                        <Box
                          sx={{
                            p: 2,
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          {/* Adults section */}
                          {level1Guests.length > 0 && (
                            <Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 1.5,
                                  pb: 0.5,
                                  borderBottom: "1px solid",
                                  borderColor: "divider",
                                }}
                              >
                                <PersonIcon
                                  sx={{
                                    mr: 1,
                                    color: "primary.main",
                                    fontSize: 20,
                                  }}
                                />
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="bold"
                                  color="primary.main"
                                  textTransform="uppercase"
                                  letterSpacing="0.5px"
                                >
                                  Adults ({level1Guests.length})
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 1,
                                }}
                              >
                                {level1Guests.map((guest) => (
                                  <Chip
                                    key={guest._id}
                                    avatar={
                                      <Avatar
                                        sx={{
                                          bgcolor: getThemedAvatarColor(
                                            guest.name
                                          ),
                                        }}
                                      >
                                        {guest.name.charAt(0)}
                                      </Avatar>
                                    }
                                    label={guest.name}
                                    variant="filled"
                                    sx={{
                                      fontWeight: "medium",
                                      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                    }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}

                          {/* Children section */}
                          {level2Guests.length > 0 && (
                            <Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 1.5,
                                  pb: 0.5,
                                  borderBottom: "1px solid",
                                  borderColor: "divider",
                                }}
                              >
                                <ChildIcon
                                  sx={{
                                    mr: 1,
                                    color: "secondary.main",
                                    fontSize: 20,
                                  }}
                                />
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="bold"
                                  color="secondary.main"
                                  textTransform="uppercase"
                                  letterSpacing="0.5px"
                                >
                                  Children ({level2Guests.length})
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 1,
                                }}
                              >
                                {level2Guests.map((guest) => (
                                  <Chip
                                    key={guest._id}
                                    avatar={
                                      <Avatar
                                        sx={{
                                          bgcolor: getThemedAvatarColor(
                                            guest.name
                                          ),
                                        }}
                                      >
                                        {guest.name.charAt(0)}
                                      </Avatar>
                                    }
                                    label={guest.name}
                                    color="secondary"
                                    variant="filled"
                                    sx={{
                                      fontWeight: "medium",
                                      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                    }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  py: 6,
                  px: 2,
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  border: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    mb: 3,
                    display: "inline-flex",
                    p: 2,
                    borderRadius: "50%",
                    bgcolor: "primary.lighter",
                  }}
                >
                  <GroupIcon sx={{ fontSize: 60, color: "primary.light" }} />
                </Box>
                <Typography
                  variant="h5"
                  color="text.primary"
                  gutterBottom
                  fontWeight="medium"
                >
                  No Guest Groups Yet
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 4, maxWidth: 450, mx: "auto" }}
                >
                  Groups help you organize your guests for better trip planning.
                  Create family groups, travel parties, or any other arrangement
                  that makes sense for your trip.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setOpenGroupsDialog(false);
                    navigate(`/trips/${tripId}/guests`);
                  }}
                  sx={{ px: 3 }}
                >
                  Create Guest Groups
                </Button>
              </Box>
            )}
          </DialogContent>

          {trip.guestRelationships && trip.guestRelationships.length > 0 && (
            <DialogActions
              sx={{
                px: 3,
                py: 2,
                borderTop: "1px solid",
                borderColor: "divider",
                justifyContent: "center",
              }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => {
                  setOpenGroupsDialog(false);
                  navigate(`/trips/${tripId}/guests`);
                }}
                sx={{ px: 3 }}
              >
                Manage Guest Groups
              </Button>
            </DialogActions>
          )}
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={() => setSnackbarOpen(false)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        />

        {/* Edit Experience Dialog */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Dialog
            open={openEditExperienceDialog}
            onClose={() => setOpenEditExperienceDialog(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
              },
            }}
          >
            <DialogTitle
              sx={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                background:
                  "linear-gradient(90deg, rgba(71, 118, 230, 0.3) 0%, rgba(142, 84, 233, 0.3) 100%)",
              }}
            >
              <Box display="flex" alignItems="center">
                <EditIcon sx={{ mr: 1, color: "#4776E6" }} />
                <Typography
                  variant="h6"
                  sx={{
                    color: "var(--text-primary)",
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  Edit Experience
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {editingExperience && (
                <Box component="form" sx={{ mt: 2 }}>
                  <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                      >
                        Basic Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                    </Grid>

                    {/* Title */}
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="Title"
                        name="title"
                        value={editingExperience.title}
                        onChange={handleEditExperienceChange}
                        required
                      />
                    </Grid>

                    {/* Type */}
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Experience Type</InputLabel>
                        <Select
                          name="type"
                          value={editingExperience.type}
                          onChange={handleEditExperienceChange}
                          label="Experience Type"
                        >
                          <MenuItem value="activity">
                            <DirectionsRunIcon sx={{ mr: 1 }} /> Activity
                          </MenuItem>
                          <MenuItem value="meal">
                            <LocalDiningIcon sx={{ mr: 1 }} /> Meal
                          </MenuItem>
                          <MenuItem value="other">
                            <CategoryOutlinedIcon sx={{ mr: 1 }} /> Other
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Location */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Location"
                        name="location"
                        value={editingExperience.location}
                        onChange={handleEditExperienceChange}
                        required
                        placeholder="Where is this experience happening?"
                      />
                    </Grid>

                    {/* Meal Type - only shown for meal experiences */}
                    {editingExperience.type === "meal" && (
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Meal Type</InputLabel>
                          <Select
                            name="mealType"
                            value={editingExperience.mealType || "restaurant"}
                            onChange={handleEditExperienceChange}
                            label="Meal Type"
                          >
                            <MenuItem value="restaurant">Restaurant</MenuItem>
                            <MenuItem value="home">Home Cooked</MenuItem>
                            <MenuItem value="picnic">Picnic</MenuItem>
                            <MenuItem value="delivery">Delivery</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    )}

                    {/* Date & Time Section */}
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ mt: 2 }}
                      >
                        Date & Time
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                    </Grid>

                    {/* Multi-day toggle */}
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="isMultiDay"
                            checked={editingExperience.isMultiDay}
                            onChange={handleEditExperienceCheckboxChange}
                          />
                        }
                        label="This is a multi-day experience"
                      />
                    </Grid>

                    {/* Start Date */}
                    <Grid
                      item
                      xs={12}
                      sm={editingExperience.isMultiDay ? 6 : 6}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Start Date
                      </Typography>
                      <DatePicker
                        selected={editingExperience.date}
                        onChange={(date) =>
                          handleEditExperienceDateChange("date", date)
                        }
                        customInput={
                          <TextField fullWidth variant="outlined" required />
                        }
                      />
                    </Grid>

                    {/* End Date - only for multi-day */}
                    {editingExperience.isMultiDay && (
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          End Date
                        </Typography>
                        <DatePicker
                          selected={editingExperience.endDate}
                          onChange={(date) =>
                            handleEditExperienceDateChange("endDate", date)
                          }
                          customInput={
                            <TextField fullWidth variant="outlined" required />
                          }
                          minDate={editingExperience.date || new Date()}
                        />
                      </Grid>
                    )}

                    {/* Start Time */}
                    <Grid
                      item
                      xs={12}
                      sm={editingExperience.isMultiDay ? 12 : 6}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Start Time
                      </Typography>
                      <TimePicker
                        value={
                          editingExperience.startTime
                            ? dayjs(editingExperience.startTime, "HH:mm")
                            : null
                        }
                        onChange={(newValue) =>
                          handleEditExperienceTimeChange("startTime", newValue)
                        }
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                          },
                        }}
                      />
                    </Grid>

                    {/* End Time - only for single day */}
                    {!editingExperience.isMultiDay && (
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          End Time
                        </Typography>
                        <TimePicker
                          value={
                            editingExperience.endTime
                              ? dayjs(editingExperience.endTime, "HH:mm")
                              : null
                          }
                          onChange={(newValue) =>
                            handleEditExperienceTimeChange("endTime", newValue)
                          }
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              required: true,
                            },
                          }}
                        />
                      </Grid>
                    )}

                    {/* Notes/Details */}
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ mt: 2 }}
                      >
                        Details
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Notes and Details"
                        name="details"
                        value={editingExperience.details}
                        onChange={handleEditExperienceChange}
                        placeholder="Add any additional details about this experience..."
                      />
                    </Grid>

                    {/* Guests Section */}
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ mt: 2 }}
                      >
                        Guests
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                    </Grid>

                    {trip?.guests && trip.guests.length > 0 ? (
                      <Grid item xs={12}>
                        <Typography variant="body2" gutterBottom>
                          Select guests who will participate in this experience:
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {trip.guests.map((guest) => (
                            <Grid
                              item
                              xs={6}
                              sm={4}
                              key={guest._id || guest.name}
                            >
                              <Chip
                                avatar={
                                  <Avatar
                                    sx={{ bgcolor: stringToColor(guest.name) }}
                                  >
                                    {guest.name.charAt(0)}
                                  </Avatar>
                                }
                                label={guest.name}
                                variant={
                                  editingExperience.guests.includes(guest.name)
                                    ? "filled"
                                    : "outlined"
                                }
                                onClick={() =>
                                  handleEditExperienceGuestToggle(guest.name)
                                }
                                sx={{
                                  width: "100%",
                                  cursor: "pointer",
                                  bgcolor: editingExperience.guests.includes(
                                    guest.name
                                  )
                                    ? "primary.main"
                                    : "transparent",
                                }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Grid>
                    ) : (
                      <Grid item xs={12}>
                        <Alert severity="info">
                          No guests found for this trip. Add guests to the trip
                          to include them in experiences.
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions
              sx={{
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                p: 2,
              }}
            >
              <Button
                onClick={() => setOpenEditExperienceDialog(false)}
                disabled={editExperienceLoading}
                sx={{
                  color: "var(--text-secondary)",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  "&:hover": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditedExperience}
                variant="contained"
                color="primary"
                disabled={editExperienceLoading}
                startIcon={
                  editExperienceLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <SaveIcon />
                  )
                }
                sx={{
                  backgroundImage:
                    "linear-gradient(90deg, #4776E6 0%, #8E54E9 100%)",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                  "&:hover": {
                    backgroundImage:
                      "linear-gradient(90deg, #8E54E9 0%, #4776E6 100%)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)",
                  },
                }}
              >
                {editExperienceLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogActions>
          </Dialog>
        </LocalizationProvider>

        {/* Lodging Details Dialog */}
        <Dialog
          open={openLodgingDialog}
          onClose={() => setOpenLodgingDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          {selectedLodging && (
            <>
              <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
                <Avatar
                  sx={{
                    mr: 1,
                    background: `linear-gradient(135deg, ${getLodgingTypeColor(
                      selectedLodging.lodgingType || "other"
                    )} 0%, rgba(0, 0, 0, 0.5) 100%)`,
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {getLodgingIcon(selectedLodging.lodgingType)}
                </Avatar>
                <Typography variant="h6">
                  {selectedLodging.name}
                  <Chip
                    label={selectedLodging.lodgingType || "other"}
                    size="small"
                    sx={{ ml: 1 }}
                    color="primary"
                  />
                </Typography>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      <CalendarIcon
                        fontSize="small"
                        sx={{ mr: 0.5, verticalAlign: "middle" }}
                      />
                      Check-in / Check-out
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {formatDate(selectedLodging.checkIn)} -{" "}
                      {formatDate(selectedLodging.checkOut)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      <LocationIcon
                        fontSize="small"
                        sx={{ mr: 0.5, verticalAlign: "middle" }}
                      />
                      Address
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {selectedLodging.address || "Address not specified"}
                    </Typography>
                  </Grid>

                  {selectedLodging.assignedGuests &&
                    selectedLodging.assignedGuests.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          <GroupIcon
                            fontSize="small"
                            sx={{ mr: 0.5, verticalAlign: "middle" }}
                          />
                          Assigned Guests
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                          >
                            {selectedLodging.assignedGuests.map(
                              (guest, idx) => (
                                <Chip
                                  key={idx}
                                  avatar={
                                    <Avatar
                                      sx={{ bgcolor: stringToColor(guest) }}
                                    >
                                      {guest.charAt(0)}
                                    </Avatar>
                                  }
                                  label={guest}
                                  size="small"
                                  sx={{ mb: 1 }}
                                />
                              )
                            )}
                          </Stack>
                        </Box>
                      </Grid>
                    )}

                  {selectedLodging.details && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        <NotesIcon
                          fontSize="small"
                          sx={{ mr: 0.5, verticalAlign: "middle" }}
                        />
                        Details
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {selectedLodging.details}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => {
                    setOpenLodgingDialog(false);
                    navigate(`/trips/${tripId}/lodging`, {
                      state: { editLodging: selectedLodging },
                    });
                  }}
                  color="primary"
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>
                <Button
                  color="error"
                  onClick={() => {
                    setOpenLodgingDialog(false);
                    handleDeleteLodging(selectedLodging._id);
                  }}
                  startIcon={<DeleteIcon />}
                >
                  Delete
                </Button>
                <Button
                  onClick={() => setOpenLodgingDialog(false)}
                  color="primary"
                >
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
}

// Different email templates for existing vs new users
const sendEmailInvitation = async (email, trip, token) => {
  const joinLink = `${process.env.APP_URL}/join-trip/${token}`;

  const emailTemplate = {
    to: email,
    subject: `You're invited to join ${trip.tripName}!`,
    html: `
      <h1>You're invited to join ${trip.tripName}!</h1>
      <p>Trip Details:</p>
      <ul>
        <li>Dates: ${formatDate(trip.startDate)} - ${formatDate(
      trip.endDate
    )}</li>
        <li>Location: ${trip.location}</li>
        <li>Host: ${trip.host.name}</li>
      </ul>
      <a href="${joinLink}">Click here to create your account and join the trip!</a>
    `,
  };

  return await sendGrid.send(emailTemplate);
};

const sendTripAddedEmail = async (email, trip) => {
  const tripLink = `${process.env.APP_URL}/trips/${trip._id}`;

  const emailTemplate = {
    to: email,
    subject: `You've been added to ${trip.tripName}!`,
    html: `
      <h1>You've been added to ${trip.tripName}!</h1>
      <p>Trip Details:</p>
      <ul>
        <li>Dates: ${formatDate(trip.startDate)} - ${formatDate(
      trip.endDate
    )}</li>
        <li>Location: ${trip.location}</li>
        <li>Host: ${trip.host.name}</li>
      </ul>
      <a href="${tripLink}">Click here to view the trip!</a>
    `,
  };

  return await sendGrid.send(emailTemplate);
};
