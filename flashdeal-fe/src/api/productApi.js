import axiosClient from './axiosClient';

export const productApi = {
  filter: (params) => {
    return axiosClient.get('/products', { params });
  },
  getById: (id) => axiosClient.get(`/products/${id}`),
  getBySlug: (slug) => axiosClient.get(`/products/slug/${slug}`),
  create: (data) => axiosClient.post('/products', data),
  update: (id, data) => axiosClient.put(`/products/${id}`, data),
  delete: (id) => axiosClient.delete(`/products/${id}`),
  // Redis Search Autocomplete (< 2ms)
  getSuggestions: (query, limit = 10) =>
    axiosClient.get('/products/search/suggestions', { params: { q: query, limit } }),
  autocomplete: (query, limit = 10) =>
    axiosClient.get('/products/search/suggestions', { params: { q: query, limit } }),

  // Redis Trending Keywords (ZSET ZREVRANGE)
  getTrending: (limit = 10) =>
    axiosClient.get('/products/search/trending', { params: { limit } }),
  getTrendingKeywords: (limit = 10) =>
    axiosClient.get('/products/search/trending', { params: { limit } }),
};
