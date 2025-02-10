import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import useOnclickOutside from "react-cool-onclickoutside";

export default function CreateExperience() {
  const { tripId } = useParams(); // Get tripId from URL
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [trip, setTrip] = useState(null);
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [date, setDate] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [endDate, setEndDate] = useState(null);
  const [experienceType, setExperienceType] = useState("activity");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState("");
  const [mealType, setMealType] = useState("restaurant");
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [customDetails, setCustomDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState([]);

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({ debounce: 300 });

  const ref = useOnclickOutside(() => {
    clearSuggestions();
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      const userObj = { ...JSON.parse(storedUser), token };
      setUser(userObj);
      fetchTripData(tripId); // Only call if user exists
    } else {
      setMessage("You must be logged in to create an experience.");
    }
  }, [tripId]);

  const fetchTripData = async (tripId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:5001/api/${tripId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Ensure the token exists
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch trip data.");
      }

      const tripData = await response.json();
      console.log("Trip Data:", tripData);
      setTrip(tripData);
    } catch (error) {
      console.error("Error fetching trip:", error);
      setMessage(error.message);
    }
  };

  const handleGuestSelection = (guestId) => {
    setSelectedGuests((prevGuests) =>
      prevGuests.includes(guestId)
        ? prevGuests.filter((id) => id !== guestId)
        : [...prevGuests, guestId]
    );
  };

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();
    setLocation(address);
  };

  const handleFileUpload = (event) => {
    setAttachments([...attachments, ...event.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !tripId) {
      setMessage(
        "You must be logged in and have a valid trip to create an experience."
      );
      return;
    }

    const newExperience = {
      title: experienceType.charAt(0).toUpperCase() + experienceType.slice(1), // Default title based on type
      date,
      startTime,
      endTime: isMultiDay ? null : endTime,
      isMultiDay,
      endDate: isMultiDay ? endDate : null,
      type: experienceType,
      guests: selectedGuests,
      details: notes,
      attachments,
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/${tripId}/experiences`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newExperience),
        }
      );

      const result = await response.json();
      if (response.ok) {
        setMessage("Experience added successfully!");
        navigate(`/dashboard`);
      } else {
        setMessage(result.error || "Failed to add experience.");
      }
    } catch (error) {
      setMessage("Error connecting to the server.");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Create Experience</h2>
      {message && <p className="text-center text-sm text-red-500">{message}</p>}

      {/* Step 1: Select Guests */}
      {step === 1 && trip?.guests && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Select Guests</h3>
          <ul>
            {trip.guests.map((guest) => (
              <li key={guest._id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedGuests.includes(guest._id)}
                    onChange={() => handleGuestSelection(guest._id)}
                  />
                  {guest.name}
                </label>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setStep(2)}
            className="bg-blue-500 text-white p-2 rounded mt-4"
          >
            Next
          </button>
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Select Date & Time</h3>
          <DatePicker
            selected={date}
            onChange={setDate}
            className="w-full p-2 border rounded"
          />
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full p-2 border rounded mt-2"
          />
          {!isMultiDay && (
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-2 border rounded mt-2"
            />
          )}
          <label className="flex items-center mt-2">
            <input
              type="checkbox"
              checked={isMultiDay}
              onChange={() => setIsMultiDay(!isMultiDay)}
            />
            <span className="ml-2">Multi-Day Experience</span>
          </label>
          {isMultiDay && (
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              className="w-full p-2 border rounded mt-2"
            />
          )}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setStep(1)}
              className="bg-gray-500 text-white p-2 rounded"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-blue-500 text-white p-2 rounded"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Experience Type */}
      {step === 3 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Select Experience Type</h3>
          <select
            value={experienceType}
            onChange={(e) => setExperienceType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="activity">Activity</option>
            <option value="meal">Meal</option>
            <option value="other">Other</option>{" "}
          </select>
          {experienceType === "meal" && (
            <div className="mt-4">
              <h4 className="text-lg font-semibold">Meal Type</h4>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="restaurant">Restaurant</option>
                <option value="home">Home</option>
              </select>
            </div>
          )}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setStep(2)}
              className="bg-gray-500 text-white p-2 rounded"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="bg-blue-500 text-white p-2 rounded"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Experience Notes</h3>
          <label className="block text-sm font-medium mt-4">Add Notes:</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g., Bring water shoes"
            className="w-full p-2 border rounded mt-2"
          />
          <label className="block text-sm font-medium mt-4">
            Upload Attachments:
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="w-full p-2 border rounded mt-2"
          />
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setStep(3)}
              className="bg-gray-500 text-white p-2 rounded"
            >
              Back
            </button>
            <button
              onClick={() => setStep(5)}
              className="bg-blue-500 text-white p-2 rounded"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Select Location</h3>
          {!useCustomLocation ? (
            <div ref={ref} className="relative">
              <input
                type="text"
                placeholder="Search for a location"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full p-2 border rounded"
              />
              {status === "OK" && (
                <ul className="absolute bg-white shadow-md border w-full z-10">
                  {data.map(({ place_id, description }) => (
                    <li
                      key={place_id}
                      onClick={() => handleSelect(description)}
                      className="p-2 hover:bg-gray-200 cursor-pointer"
                    >
                      {description}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <input
              type="text"
              placeholder="Enter custom location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 border rounded"
            />
          )}
          <label className="flex items-center mt-2">
            <input
              type="checkbox"
              checked={useCustomLocation}
              onChange={() => setUseCustomLocation(!useCustomLocation)}
            />
            <span className="ml-2">Use Custom Location</span>
          </label>
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setStep(4)}
              className="bg-gray-500 text-white p-2 rounded"
            >
              Back
            </button>
            <button
              onClick={() => setStep(6)}
              className="bg-green-500 text-white p-2 rounded"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Preview & Confirm</h3>
          <p>
            <strong>Guests:</strong> {selectedGuests.join(", ")}
          </p>
          <p>
            <strong>Date:</strong> {date?.toLocaleDateString()}
          </p>
          <p>
            <strong>Time:</strong> {startTime}
          </p>
          {isMultiDay && (
            <p>
              <strong>End Date:</strong> {endDate?.toLocaleDateString()}
            </p>
          )}
          <p>
            <strong>Type:</strong> {experienceType}
          </p>
          <p>
            <strong>Location:</strong> {useCustomLocation ? location : value}
          </p>
          {experienceType === "meal" && (
            <p>
              <strong>Meal Type:</strong> {mealType}
            </p>
          )}
          <p>
            <strong>Notes:</strong> {notes}
          </p>
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setStep(5)}
              className="bg-gray-500 text-white p-2 rounded"
            >
              Edit
            </button>
            <button
              onClick={handleSubmit}
              className="bg-green-500 text-white p-2 rounded"
            >
              Confirm & Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
