import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "tailwindcss/index.css";
import "./adminLoading.css";
import "./styles/adminTheme.css";
import App from "./App.jsx";
import { ToastProvider } from "./components/Ui/ToastProvider.jsx";
import { installFetchActivityTracker } from "./utils/installFetchActivityTracker";
import { installApiResponseEncryption } from "./api/responseEncryption";

installFetchActivityTracker();
installApiResponseEncryption();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);
