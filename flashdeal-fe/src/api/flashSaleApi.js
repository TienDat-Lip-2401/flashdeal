import axiosClient from './axiosClient';

export const flashSaleApi = {
  // Campaign APIs
  getActiveCampaigns: () => axiosClient.get('/flash-sales/campaigns/active'),
  getAllCampaigns: () => axiosClient.get('/flash-sales/campaigns'),
  getCampaignById: (id) => axiosClient.get(`/flash-sales/campaigns/${id}`),
  createCampaign: (data) => axiosClient.post('/flash-sales/campaigns', data),
  addProductToCampaign: (campaignId, data) =>
    axiosClient.post(`/flash-sales/campaigns/${campaignId}/products`, data),
  deleteCampaign: (id) => axiosClient.delete(`/flash-sales/campaigns/${id}`),

  // Order APIs
  createOrder: (data) => axiosClient.post('/flash-sales/orders', data),
  getMyOrders: () => axiosClient.get('/flash-sales/orders/my-orders'),
  getOrderByCode: (orderCode) => axiosClient.get(`/flash-sales/orders/${orderCode}`),
  cancelOrder: (orderCode) => axiosClient.put(`/flash-sales/orders/${orderCode}/cancel`),
  payOrder: (orderCode) => axiosClient.put(`/flash-sales/orders/${orderCode}/pay`),
  triggerCancelExpired: () => axiosClient.post('/flash-sales/orders/cancel-expired'),
};
