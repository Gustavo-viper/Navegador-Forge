import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./services/fullscreen";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
