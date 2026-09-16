package flashdeal_api.payment.entity;

/**
 * Các trạng thái vòng đời của một sự kiện trong bảng outbox_events.
 */
public enum OutboxStatus {
    /**
     * Sự kiện vừa được tạo và lưu an toàn vào DB cùng transaction nghiệp vụ, đang chờ Worker nhặt đi gửi.
     */
    PENDING,

    /**
     * Worker đang giữ khóa (khóa dòng bằng FOR UPDATE SKIP LOCKED) và đang tiến hành gửi sang Kafka.
     */
    PROCESSING,

    /**
     * Kafka đã xác nhận nhận tin an toàn (Ack). Sự kiện đã hoàn thành sứ mệnh.
     */
    PUBLISHED,

    /**
     * Thử gửi lại nhiều lần (vượt quá max retries) nhưng Kafka vẫn lỗi. Cần can thiệp/cảnh báo.
     */
    FAILED
}
