import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#121212",
            color: "#F5F5F5",
            border: "1px solid #262626",
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
