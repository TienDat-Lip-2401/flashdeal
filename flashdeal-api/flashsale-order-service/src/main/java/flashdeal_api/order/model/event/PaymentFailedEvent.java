package flashdeal_api.order.model.event;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Sự kiện nhận được từ Kafka khi thanh toán đơn hàng thất bại, bị hủy hoặc quá hạn.
 * Dùng để kích hoạt giao dịch bù trừ (Compensating Transaction): Hủy đơn và Hoàn kho.
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
