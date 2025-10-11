import Axios, { AxiosInstance } from "axios";

const axiosInstance: AxiosInstance = Axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://algespace-production.up.railway.app",
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
    }
});

export default axiosInstance;
