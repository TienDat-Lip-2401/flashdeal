package flashdeal_api.order.model.event;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class PaymentSuccessfulEvent implements Serializable {

    private String paymentCode;
    private String orderCode;
    private Long userId;
    private String userEmail;
    private BigDecimal amount;
    private String paymentMethod;
    private String vnpTransactionNo;
    private String bankCode;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime paidAt;
}
