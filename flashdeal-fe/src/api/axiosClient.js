import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: Attach JWT token if available
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const customError = {
      code: error.response?.data?.code || 500,
      message: error.response?.data?.message || error.message || 'Network Error',
      data: error.response?.data || null,
      status: error.response?.status,
    };
    return Promise.reject(customError);
  }
);

export default axiosClient;
