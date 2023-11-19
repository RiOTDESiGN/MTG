import React from "react";
import ReactDOM from "react-dom/client";
import { CardsContextProvider } from "./CardsContext.jsx";
import App from "./App.jsx";
import "./main.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <CardsContextProvider>
    <App />
  </CardsContextProvider>
  // </React.StrictMode>
);
