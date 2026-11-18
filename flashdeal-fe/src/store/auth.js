import { create } from 'zustand';
import api from '../lib/api';
import { tokenStore } from '../lib/tokens';

export const useAuth = create((set, get) => ({
  user: null,
  // 'idle' until the stored token has been checked once on start-up
  status: tokenStore.getAccess() ? 'loading' : 'guest',

  async bootstrap() {
    if (!tokenStore.getAccess()) {
      set({ status: 'guest', user: null });
      return;
    }
    try {
      const res = await api.get('/auth/profile');
      set({ user: res.data, status: 'authenticated' });
    } catch {
      tokenStore.clear();
      set({ user: null, status: 'guest' });
    }
  },

  async login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = res.data;
    tokenStore.set(accessToken, refreshToken);
    set({ user, status: 'authenticated' });
    return user;
  },

  async register(payload) {
    await api.post('/auth/register', payload);
    return get().login(payload.email, payload.password);
  },

  async logout() {
    try {
      if (tokenStore.getAccess()) await api.post('/auth/logout');
    } catch {
      // the local session is cleared either way
    }
    tokenStore.clear();
    set({ user: null, status: 'guest' });
  },

  clearSession() {
    tokenStore.clear();
    set({ user: null, status: 'guest' });
  },
}));

export const isAdmin = (user) => user?.role === 'ROLE_ADMIN';
