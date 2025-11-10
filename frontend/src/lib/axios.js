import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" 
    ? "https://chatyy-qi2e.onrender.com/api" 
    : "/api",
  withCredentials: true,
});
