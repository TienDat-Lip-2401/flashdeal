package flashdeal_api.payment.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentCallbackResponse {
    private String responseCode;
    private String message;
    private String orderCode;
    private String transactionNo;
    private String bankCode;
    private BigDecimal amount;
    private boolean success;
}
