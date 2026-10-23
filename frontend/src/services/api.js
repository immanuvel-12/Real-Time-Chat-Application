import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/**
 * Shared axios instance. `withCredentials` sends the httpOnly JWT cookie
 * with every request (the backend CORS config expects this).
 */
const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default api;
