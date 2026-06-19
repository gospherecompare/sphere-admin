import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "tailwindcss/index.css";
import "./adminLoading.css";
import App from "./App.jsx";
import { ToastProvider } from "./components/Ui/ToastProvider.jsx";
import { installFetchActivityTracker } from "./utils/installFetchActivityTracker";

installFetchActivityTracker();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);
