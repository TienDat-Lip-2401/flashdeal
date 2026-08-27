import axiosClient from './axiosClient';

export const authApi = {
  register: (data) => axiosClient.post('/auth/register', data),
  login: (data) => axiosClient.post('/auth/login', data),
  getProfile: () => axiosClient.get('/auth/profile'),
  refreshToken: (data) => axiosClient.post('/auth/refresh-token', data),
  logout: () => axiosClient.post('/auth/logout'),
};
