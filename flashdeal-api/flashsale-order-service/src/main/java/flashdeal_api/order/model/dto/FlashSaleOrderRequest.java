package flashdeal_api.order.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashSaleOrderRequest {

    @NotNull(message = "ID chiến dịch không được để trống")
    private Long campaignId;

    @NotNull(message = "ID sản phẩm không được để trống")
    private Long productId;

    @NotBlank(message = "Địa chỉ nhận hàng không được để trống")
    private String shippingAddress;

    @NotBlank(message = "Số điện thoại nhận hàng không được để trống")
    private String phone;

    private String email;
}
