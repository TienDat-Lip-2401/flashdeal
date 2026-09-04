package flashdeal_api.order.service.impl;

import flashdeal_api.order.entity.CampaignStatus;
import flashdeal_api.order.entity.FlashSaleCampaign;
import flashdeal_api.order.entity.FlashSaleProduct;
import flashdeal_api.order.entity.Order;
import flashdeal_api.order.entity.OrderStatus;
import flashdeal_api.order.exception.AppException;
import flashdeal_api.order.exception.ErrorCode;
import flashdeal_api.order.model.dto.FlashSaleOrderRequest;
import flashdeal_api.order.model.dto.OrderItemResponse;
import flashdeal_api.order.model.dto.OrderResponse;
import flashdeal_api.order.model.event.OrderCreatedEvent;
import flashdeal_api.order.producer.FlashSaleOrderProducer;
import flashdeal_api.order.redis.StockDeductionLuaScript;
import flashdeal_api.order.repository.FlashSaleCampaignRepository;
import flashdeal_api.order.repository.FlashSaleProductRepository;
import flashdeal_api.order.repository.OrderRepository;
import flashdeal_api.order.service.FlashSalePreHeatService;
import flashdeal_api.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final FlashSaleCampaignRepository campaignRepository;
    private final FlashSaleProductRepository productRepository;
    private final FlashSalePreHeatService preHeatService;
    private final StockDeductionLuaScript stockDeductionLuaScript;
    private final FlashSaleOrderProducer orderProducer;

    @Override
    public OrderResponse createFlashSaleOrder(Long userId, FlashSaleOrderRequest request) {
        log.info("Incoming FlashSale order request: userId={}, campaign={}, product={}",
                userId, request.getCampaignId(), request.getProductId());

        LocalDateTime now = LocalDateTime.now();

        // 1. Kiem tra chien dich Flash Sale co ton tai va hop le khong
        FlashSaleCampaign campaign = campaignRepository.findById(request.getCampaignId())
                .orElseThrow(() -> new AppException(ErrorCode.CAMPAIGN_NOT_FOUND));

        if (campaign.getStatus() == CampaignStatus.ENDED || now.isAfter(campaign.getEndTime())) {
            log.warn("Campaign {} is ENDED or expired (endTime={})", campaign.getId(), campaign.getEndTime());
            throw new AppException(ErrorCode.CAMPAIGN_NOT_ACTIVE);
        }

        if (campaign.getStatus() == CampaignStatus.UPCOMING || now.isBefore(campaign.getStartTime())) {
            log.warn("Campaign {} is UPCOMING (startTime={})", campaign.getId(), campaign.getStartTime());
            throw new AppException(ErrorCode.CAMPAIGN_NOT_ACTIVE);
        }

        // 2. Kiem tra san pham co thuoc chien dich nay khong
        FlashSaleProduct product = productRepository.findByCampaignIdAndProductId(request.getCampaignId(), request.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_IN_CAMPAIGN));

        // 3. Chay Lua Script tru kho nguyen tu tren RAM Redis (< 1.5ms)
        Long deductionResult = stockDeductionLuaScript.executeDeduction(
                request.getCampaignId(),
                request.getProductId(),
                userId,
                1
        );

        if (deductionResult == -2) {
            log.warn("User {} already purchased product {} in campaign {}", userId, request.getProductId(), request.getCampaignId());
            throw new AppException(ErrorCode.USER_ALREADY_PURCHASED);
        }

        if (deductionResult == -1) {
            log.warn("Product {} in campaign {} is OUT OF STOCK", request.getProductId(), request.getCampaignId());
            throw new AppException(ErrorCode.OUT_OF_STOCK);
        }

        // 4. Sinh ma don hang duy nhat va thoi han thanh toan 15 phut
        String orderCode = "FS-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        LocalDateTime expiresAt = now.plusMinutes(15);

        // Lay email nguoi dat tu request hoac tu JWT SecurityContext
        String customerEmail = request.getEmail();
        if (!StringUtils.hasText(customerEmail)) {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getDetails() instanceof String emailStr && StringUtils.hasText(emailStr)) {
                customerEmail = emailStr;
            }
        }

        // 5. Dong goi Event va ban vao Kafka (Partition Key: productId)
        OrderCreatedEvent event = OrderCreatedEvent.builder()
                .orderCode(orderCode)
                .userId(userId)
                .email(customerEmail)
                .campaignId(request.getCampaignId())
                .productId(request.getProductId())
                .productName(product.getProductName())
                .price(product.getFlashSalePrice())
                .quantity(1)
                .totalAmount(product.getFlashSalePrice())
                .shippingAddress(request.getShippingAddress())
                .phone(request.getPhone())
                .expiresAt(expiresAt)
                .timestamp(now)
                .build();

        orderProducer.publishOrderCreatedEvent(event);

        // 6. Tra ve ngay ket qua dat hang cho khach hang trong < 5ms
        OrderItemResponse itemResponse = OrderItemResponse.builder()
                .productId(product.getProductId())
                .productName(product.getProductName())
                .quantity(1)
                .price(product.getFlashSalePrice())
                .totalPrice(product.getFlashSalePrice())
                .build();

        return OrderResponse.builder()
                .orderCode(orderCode)
                .userId(userId)
                .campaignId(request.getCampaignId())
                .totalAmount(product.getFlashSalePrice())
                .status(OrderStatus.PENDING)
                .shippingAddress(request.getShippingAddress())
                .phone(request.getPhone())
                .items(Collections.singletonList(itemResponse))
                .expiresAt(expiresAt)
                .createdAt(now)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getUserOrders(Long userId) {
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return orders.stream().map(this::mapToOrderResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByCode(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(String orderCode, Long userId) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (!order.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new AppException(ErrorCode.ORDER_CANNOT_BE_CANCELLED);
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        // Hoan lai ton kho vao Redis va Database
        order.getItems().forEach(item -> {
            preHeatService.restock(order.getCampaignId(), item.getProductId(), userId, item.getQuantity());
            productRepository.findByCampaignIdAndProductId(order.getCampaignId(), item.getProductId())
                    .ifPresent(p -> productRepository.restockDb(p.getId(), item.getQuantity()));
        });

        log.info("Cancelled order: {} for user: {} and restocked inventory", orderCode, userId);
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse payOrder(String orderCode, Long userId) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (!order.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new AppException(ErrorCode.ORDER_CANNOT_BE_CANCELLED);
        }

        // Kiem tra neu don da qua han
        if (order.getExpiresAt() != null && LocalDateTime.now().isAfter(order.getExpiresAt())) {
            order.setStatus(OrderStatus.CANCELLED);
            orderRepository.save(order);

            // Hoan kho vi don qua han
            order.getItems().forEach(item -> {
                preHeatService.restock(order.getCampaignId(), item.getProductId(), userId, item.getQuantity());
                productRepository.findByCampaignIdAndProductId(order.getCampaignId(), item.getProductId())
                        .ifPresent(p -> productRepository.restockDb(p.getId(), item.getQuantity()));
            });

            throw new AppException(ErrorCode.ORDER_CANNOT_BE_CANCELLED);
        }

        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);
        log.info("Successfully marked order {} as PAID for user {}", orderCode, userId);
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public int cancelExpiredOrders() {
        LocalDateTime now = LocalDateTime.now();
        List<Order> expiredOrders = orderRepository.findByStatusAndExpiresAtBefore(OrderStatus.PENDING, now);

        if (expiredOrders.isEmpty()) {
            return 0;
        }

        log.info("Found {} expired PENDING orders to auto-cancel and restock", expiredOrders.size());

        for (Order order : expiredOrders) {
            try {
                order.setStatus(OrderStatus.CANCELLED);
                orderRepository.save(order);

                // Hoan lai ton kho vao Redis va Database PostgreSQL
                order.getItems().forEach(item -> {
                    preHeatService.restock(order.getCampaignId(), item.getProductId(), order.getUserId(), item.getQuantity());
                    productRepository.findByCampaignIdAndProductId(order.getCampaignId(), item.getProductId())
                            .ifPresent(p -> productRepository.restockDb(p.getId(), item.getQuantity()));
                });

                log.info("Auto-cancelled expired order: {} (expiredAt={}) and restocked inventory",
                        order.getOrderCode(), order.getExpiresAt());
            } catch (Exception e) {
                log.error("Failed to auto-cancel order: {}", order.getOrderCode(), e);
            }
        }

        return expiredOrders.size();
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUserId())
                .campaignId(order.getCampaignId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .shippingAddress(order.getShippingAddress())
                .phone(order.getPhone())
                .items(itemResponses)
                .expiresAt(order.getExpiresAt())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
