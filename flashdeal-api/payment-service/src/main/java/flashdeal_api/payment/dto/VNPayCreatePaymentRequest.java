package flashdeal_api.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VNPayCreatePaymentRequest {

    @NotBlank(message = "Mã đơn hàng không được để trống")
    private String orderCode;

    // Không nhận số tiền / userId / email từ client: lấy từ order-service và token của người gọi

    private String orderInfo;

    private String bankCode;
}
