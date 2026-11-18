const ACCESS = 'access_token';
const REFRESH = 'refresh_token';

const safe = (fn, fallback = null) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const tokenStore = {
  getAccess: () => safe(() => localStorage.getItem(ACCESS)),
  getRefresh: () => safe(() => localStorage.getItem(REFRESH)),
  set(access, refresh) {
    safe(() => {
      localStorage.setItem(ACCESS, access);
      if (refresh) localStorage.setItem(REFRESH, refresh);
    });
  },
  clear() {
    safe(() => {
      localStorage.removeItem(ACCESS);
      localStorage.removeItem(REFRESH);
      localStorage.removeItem('accessToken');
    });
  },
};
