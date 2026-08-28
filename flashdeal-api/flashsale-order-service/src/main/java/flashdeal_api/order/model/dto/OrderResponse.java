package flashdeal_api.order.model.dto;

import flashdeal_api.order.entity.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {

    private Long id;
    private String orderCode;
    private Long userId;
    private Long campaignId;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private String shippingAddress;
    private String phone;
    private List<OrderItemResponse> items;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
