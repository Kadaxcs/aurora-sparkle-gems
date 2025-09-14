import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./hooks/usePerformance";

// Register service worker for aggressive caching
registerServiceWorker();

// Preload critical CSS
const link = document.createElement('link');
link.rel = 'preload';
link.as = 'style';
link.href = '/index.css';
document.head.appendChild(link);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);