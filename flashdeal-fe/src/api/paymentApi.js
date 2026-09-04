import axiosClient from './axiosClient';

export const paymentApi = {
  // 1. Tạo link thanh toán chuyển hướng sang Cổng VNPAY Sandbox
  createVNPayPaymentUrl: (data) => {
    return axiosClient.post('/payments/vnpay/create-payment-url', data);
  },

  // 2. Tiếp nhận và xác thực kết quả thanh toán từ VNPAY callback
  handleVNPayCallback: (params) => {
    return axiosClient.get('/payments/vnpay/payment-callback', { params });
  },

  // 3. Giả lập thanh toán VNPAY thành công (Test nhanh)
  simulatePayment: (orderCode, email) => {
    return axiosClient.post('/payments/vnpay/simulate-pay', null, {
      params: { orderCode, email },
    });
  },

  // 4. Tra cứu thông tin thanh toán theo mã đơn hàng
  getPaymentByOrder: (orderCode) => {
    return axiosClient.get(`/payments/order/${orderCode}`);
  },
};
