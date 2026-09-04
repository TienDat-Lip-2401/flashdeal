package flashdeal_api.order.consumer;

import flashdeal_api.order.config.KafkaTopicConfig;
import flashdeal_api.order.entity.Order;
import flashdeal_api.order.entity.OrderItem;
import flashdeal_api.order.entity.OrderStatus;
import flashdeal_api.order.model.event.OrderCreatedEvent;
import flashdeal_api.order.repository.FlashSaleProductRepository;
import flashdeal_api.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderCreatedConsumer {

    private final OrderRepository orderRepository;
    private final FlashSaleProductRepository flashSaleProductRepository;

    @Transactional
    @KafkaListener(
            topics = KafkaTopicConfig.TOPIC_FLASHSALE_ORDER_CREATED,
            groupId = "flashsale-order-group",
            concurrency = "4",
            containerFactory = "orderCreatedKafkaListenerContainerFactory"
    )
    public void consumeOrderCreated(OrderCreatedEvent event) {
        log.info("Consumer received OrderCreatedEvent: orderCode={}, user={}, product={}",
                event.getOrderCode(), event.getUserId(), event.getProductId());

        try {
            // 1. Kiem tra tinh Idempotent: Neu don da ton tai thi bo qua
            if (orderRepository.existsByOrderCode(event.getOrderCode())) {
                log.warn("Order code already processed (idempotent skipped): {}", event.getOrderCode());
                return;
            }

            LocalDateTime expiresAt = event.getExpiresAt() != null
                    ? event.getExpiresAt()
                    : LocalDateTime.now().plusMinutes(15);

            // 2. Tao thong tin Don Hang
            Order order = Order.builder()
                    .orderCode(event.getOrderCode())
                    .userId(event.getUserId())
                    .campaignId(event.getCampaignId())
                    .totalAmount(event.getTotalAmount())
                    .status(OrderStatus.PENDING)
                    .shippingAddress(event.getShippingAddress())
                    .phone(event.getPhone())
                    .expiresAt(expiresAt)
                    .build();

            // 3. Tao Chi Tiet Don Hang
            OrderItem orderItem = OrderItem.builder()
                    .productId(event.getProductId())
                    .productName(event.getProductName())
                    .quantity(event.getQuantity())
                    .price(event.getPrice())
                    .totalPrice(event.getTotalAmount())
                    .build();

            order.addItem(orderItem);
            Order savedOrder = orderRepository.save(order);

            // 4. Tru ton kho kha dung trong Database PostgreSQL
            flashSaleProductRepository.findByCampaignIdAndProductId(event.getCampaignId(), event.getProductId())
                    .ifPresent(product -> {
                        int rows = flashSaleProductRepository.deductStockDb(product.getId(), event.getQuantity());
                        log.info("Deducted DB stock for productId: {}, rows affected: {}", product.getId(), rows);
                    });

            log.info("Successfully persisted order in order_db with ID: {}, code: {}, expiresAt: {}",
                    savedOrder.getId(), savedOrder.getOrderCode(), savedOrder.getExpiresAt());

        } catch (Exception e) {
            log.error("Failed to process OrderCreatedEvent for orderCode: {}", event.getOrderCode(), e);
            throw e;
        }
    }
}
