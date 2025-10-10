import Axios, { AxiosInstance } from "axios";

// Use environment variable for API URL, fallback to localhost for development
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:7273";

// Debug log (will only show in production if needed)
console.log('API Base URL:', baseURL);

const axiosInstance: AxiosInstance = Axios.create({
    baseURL: baseURL,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-API-Key": `${import.meta.env.VITE_API_KEY || ""}`
    },
    withCredentials: true // Enable credentials for CORS
});

export default axiosInstance;
