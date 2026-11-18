import axios from 'axios';
import { tokenStore } from './tokens';

export const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/*
  Silent refresh: when a request fails with 401 and a refresh token exists, the first failing
  request refreshes the pair once; requests that fail meanwhile wait for that same refresh and
  are replayed with the new access token. When the refresh fails the session is cleared.
*/
let refreshPromise = null;

function refreshTokens() {
  if (!refreshPromise) {
    const refreshToken = tokenStore.getRefresh();
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken })
      .then((res) => {
        const data = res.data?.data;
        tokenStore.set(data.accessToken, data.refreshToken);
        return data.accessToken;
      })
      .catch((err) => {
        tokenStore.clear();
        window.dispatchEvent(new Event('auth:expired'));
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const isAuthCall = /\/auth\/(login|register|refresh-token)/.test(original.url || '');

    if (status === 401 && !original._retry && !isAuthCall && tokenStore.getRefresh()) {
      original._retry = true;
      try {
        const newToken = await refreshTokens();
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return api(original);
      } catch {
        // fall through to the normalised error below
      }
    }

    return Promise.reject(toApiError(error));
  },
);

export function toApiError(error) {
  const body = error.response?.data;
  return {
    status: error.response?.status ?? 0,
    code: body?.code ?? (error.response ? error.response.status : 0),
    message: body?.message || (error.response ? error.message : 'Không kết nối được máy chủ'),
    data: body ?? null,
  };
}

export default api;
