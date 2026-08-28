package flashdeal_api.order.model.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashSaleProductResponse {

    private Long id;
    private Long campaignId;
    private Long productId;
    private String productName;
    private BigDecimal originalPrice;
    private BigDecimal flashSalePrice;
    private Integer flashSaleStock;
    private Integer availableStock;
    private Integer redisStock;
    private LocalDateTime createdAt;
}
