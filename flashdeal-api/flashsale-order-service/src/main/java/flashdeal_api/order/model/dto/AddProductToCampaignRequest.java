package flashdeal_api.order.model.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddProductToCampaignRequest {

    @NotNull(message = "ID sản phẩm không được để trống")
    private Long productId;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String productName;

    @NotNull(message = "Giá gốc không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá gốc phải lớn hơn 0")
    private BigDecimal originalPrice;

    @NotNull(message = "Giá Flash Sale không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá Flash Sale phải lớn hơn 0")
    private BigDecimal flashSalePrice;

    @NotNull(message = "Số lượng mở bán sale không được để trống")
    @Min(value = 1, message = "Số lượng mở bán phải ít nhất là 1")
    private Integer flashSaleStock;
}
