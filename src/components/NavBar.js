import React from "react";
import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <nav className="bg-blue-500 text-white p-4 flex justify-between">
      <h1 className="text-xl font-bold">Trip Planner</h1>
      <div className="space-x-4">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/createTrip" >Create Trip</Link>
        <Link to="/profilePage">Profile</Link>
        <Link to="/notifications/" >Notifications</Link>

      </div>
    </nav>
  );
}
