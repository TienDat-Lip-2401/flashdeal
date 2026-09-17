package flashdeal_api.payment.model.event;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Sự kiện phát sinh khi giao dịch thanh toán thất bại, bị hủy hoặc quá hạn.
 * Được lưu vào Outbox và chuyển tiếp qua Kafka để kích hoạt Giao dịch Bù trừ (Compensating Transaction) trong Saga.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class PaymentFailedEvent implements Serializable {

    private String paymentCode;
    private String orderCode;
    private Long userId;
    private String userEmail;
    private BigDecimal amount;
    private String paymentMethod;
    private String failureReason;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime failedAt;
}
