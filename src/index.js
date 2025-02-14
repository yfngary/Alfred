import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Make sure App.js exists
import { UserProvider } from "./context/UserContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
);
