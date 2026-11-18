import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export const adminApi = {
  orders: (status) => api.get('/flash-sales/orders/admin/all', { params: status ? { status } : {} }).then((r) => r.data ?? []),
  setOrderStatus: (code, status) => api.put(`/flash-sales/orders/admin/${code}/status`, null, { params: { status } }),
  createProduct: (body) => api.post('/products', body),
  updateProduct: (id, body) => api.put(`/products/${id}`, body),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  createCategory: (body) => api.post('/categories', body),
  updateCategory: (id, body) => api.put(`/categories/${id}`, body),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  createCampaign: (body) => api.post('/flash-sales/campaigns', body),
  deleteCampaign: (id) => api.delete(`/flash-sales/campaigns/${id}`),
  addCampaignProduct: (id, body) => api.post(`/flash-sales/campaigns/${id}/products`, body),
};

export const useAdminOrders = () => useQuery({ queryKey: ['orders', 'admin'], queryFn: () => adminApi.orders(), refetchInterval: 30e3 });
