import axios from "axios";

const apiClient = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_BASE_URL
      : "/api",
});

apiClient.interceptors.request.use((config) => {
  // Check BOTH localStorage and sessionStorage for token
  const token = localStorage.getItem("token") || 
                sessionStorage.getItem("token") || 
                localStorage.getItem("authToken") || 
                sessionStorage.getItem("authToken");
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;