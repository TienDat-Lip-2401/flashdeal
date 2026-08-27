package flashdeal_api.entity;

public enum OrderStatus {
    PENDING,    // Đang chờ xử lý / Chờ thanh toán
    PAID,       // Đã thanh toán thành công
    CANCELLED,  // Đã hủy đơn (quá hạn 15 phút)
    FAILED      // Đặt hàng thất bại
}
