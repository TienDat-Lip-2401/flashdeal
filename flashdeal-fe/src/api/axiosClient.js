import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor
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
