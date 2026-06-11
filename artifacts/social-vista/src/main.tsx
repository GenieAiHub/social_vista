import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyTheme, getStoredTheme } from "@/lib/theme";

// Apply the last-known theme immediately to avoid a flash before data loads.
applyTheme(getStoredTheme());

createRoot(document.getElementById("root")!).render(<App />);
