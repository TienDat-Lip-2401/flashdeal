package flashdeal_api.order.service;

import flashdeal_api.order.model.dto.FlashSaleOrderRequest;
import flashdeal_api.order.model.dto.OrderResponse;

import java.util.List;

public interface OrderService {

    OrderResponse createFlashSaleOrder(Long userId, FlashSaleOrderRequest request);

    List<OrderResponse> getUserOrders(Long userId);

    OrderResponse getOrderByCode(String orderCode);

    OrderResponse cancelOrder(String orderCode, Long userId);

    OrderResponse payOrder(String orderCode, Long userId);

    int cancelExpiredOrders();
}
