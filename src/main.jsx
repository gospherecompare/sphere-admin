import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "tailwindcss/index.css";
import "./adminLoading.css";
import App from "./App.jsx";
import { installFetchActivityTracker } from "./utils/installFetchActivityTracker";

installFetchActivityTracker();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
