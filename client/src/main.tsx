import { createRoot } from "react-dom/client";
import { AuthProvider } from "@/contexts/auth-context";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
