import React, { useState, useEffect, useRef } from "react";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import useOnclickOutside from "react-cool-onclickoutside";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CreateTrip() {
  const [formData, setFormData] = useState({
    tripName: "",
    destination: "",
    startDate: null,
    endDate: null,
    notes: "",
    lodgings: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [activeLodgingIndex, setActiveLodgingIndex] = useState(null);

  const ref = useRef(null);

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({ debounce: 300 });

  useOnclickOutside(ref, () => {
    clearSuggestions();
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser({ ...JSON.parse(storedUser), token });
    } else {
      setMessage("You must be logged in to create a trip.");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = async (address, index) => {
    setValue(address, false);
    clearSuggestions();
    updateLodging(index, "address", address);  // Update correct lodging
  };

  const handleDateChange = (date, field) => {
    setFormData((prev) => ({ ...prev, [field]: date }));
  };

  const addLodging = () => {
    setFormData((prev) => ({
      ...prev,
      lodgings: [...prev.lodgings, { address: "", checkIn: null, checkOut: null }],
    }));
  };

  const removeLodging = () => {
    setFormData((prev) => ({
      ...prev,
      lodgings: prev.lodgings.slice(0, -1),
    }));
  };

  const updateLodging = (index, field, value) => {
    const updatedLodgings = formData.lodgings.map((lodging, i) =>
      i === index ? { ...lodging, [field]: value } : lodging
    );
    setFormData((prev) => ({ ...prev, lodgings: updatedLodgings }));
  };

  const generateTripName = () => {
    if (!formData.tripName && formData.destination && formData.startDate && formData.endDate) {
      return `${formData.destination} Trip ${formData.startDate.toLocaleDateString()} - ${formData.endDate.toLocaleDateString()}`;
    }
    return formData.tripName;
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.destination) tempErrors.destination = "Destination is required";
    if (!formData.startDate) tempErrors.startDate = "Start date is required";
    if (!formData.endDate) tempErrors.endDate = "End date is required";
    else if (formData.startDate > formData.endDate)
      tempErrors.endDate = "End date must be after start date";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage("You must be logged in to create a trip.");
      return;
    }
    if (validate()) {
      setLoading(true);
      setMessage("");
      
      try {
        const response = await fetch("http://localhost:5000/api/trips", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ ...formData, tripName: generateTripName(), userId: user.id }),
        });
        
        const result = await response.json();
        console.log("Server Response:", result);
        
        if (response.ok) {
          setMessage("Trip created successfully!");
          setFormData({ tripName: "", destination: "", startDate: null, endDate: null, notes: "", lodgings: [] });
        } else {
          setMessage(result.error?.toString() || "Failed to create trip.");
        }
      } catch (error) {
        setMessage("Error connecting to the server.");
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Create a New Trip</h2>
      {message && <p className="text-center text-sm text-red-500">{message}</p>}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="tripName"
            placeholder="Custom Trip Name (Optional)"
            value={formData.tripName}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <input
            type="text"
            name="destination"
            placeholder="Destination"
            value={formData.destination}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
          {errors.destination && <p className="text-red-500 text-sm">{errors.destination}</p>}

          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <DatePicker
              selected={formData.startDate}
              onChange={(date) => handleDateChange(date, "startDate")}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">End Date</label>
            <DatePicker
              selected={formData.endDate}
              onChange={(date) => handleDateChange(date, "endDate")}
              className="w-full p-2 border rounded"
            />
          </div>

          <h3 className="text-lg font-semibold">Lodging Locations</h3>
          <div>
    {formData.lodgings.map((lodging, index) => (
      <div key={index} className="border p-2 rounded">
        <div ref={ref} className="relative">
          <input
            type="text"
            name={`lodgingAddress-${index}`}
            placeholder="Lodging Address"
            value={index === activeLodgingIndex ? value : lodging.address}
            onChange={(e) => {
              setActiveLodgingIndex(index);
              setValue(e.target.value);
            }}
            className="w-full p-2 border rounded"
          />
          {status === "OK" && activeLodgingIndex === index && (
            <ul className="absolute bg-white shadow-md border w-full z-10">
              {data.map(({ place_id, description }) => (
                <li
                  key={place_id}
                  onClick={() => handleSelect(description, index)}
                  className="p-2 hover:bg-gray-200 cursor-pointer"
                >
                  {description}
                </li>
              ))}
            </ul>
          )}
        </div>
        <DatePicker
          selected={lodging.checkIn}
          onChange={(date) => updateLodging(index, "checkIn", date)}
          placeholderText="Check-in Date"
          className="w-full p-2 border rounded"
        />
        <DatePicker
          selected={lodging.checkOut}
          onChange={(date) => updateLodging(index, "checkOut", date)}
          placeholderText="Check-out Date"
          minDate={lodging.checkIn}
          className="w-full p-2 border rounded"
        />
      </div>
    ))}
  </div>

          <button type="button" onClick={addLodging} className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600">
            + Add Lodging
          </button>
          <button type="button" onClick={removeLodging} className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600">
            - Remove Lodging
          </button>

          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600" disabled={loading}>
            {loading ? "Creating Trip..." : "Create Trip"}
          </button>
        </form>
      ) : (
        <p className="text-center text-red-500">You must be logged in to create a trip.</p>
      )}
    </div>
  );
}