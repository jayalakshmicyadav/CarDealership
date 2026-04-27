import axios from "axios";
import { getAccessToken, getRefreshToken, getUserType } from "./Token";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

axiosInstance.interceptors.request.use(
  (config) => {
    config.headers["Authorization"] = `Bearer ${getAccessToken()}`;
    config.headers["Refresh-Token"] = getRefreshToken();
    config.headers["User-Type"] = getUserType();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
