package flashdeal_api.order.consumer;

import flashdeal_api.order.config.KafkaTopicConfig;
import flashdeal_api.order.entity.Order;
import flashdeal_api.order.entity.OrderStatus;
import flashdeal_api.order.model.event.PaymentSuccessfulEvent;
import flashdeal_api.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentSuccessConsumer {

    private final OrderRepository orderRepository;

    @Transactional
    @KafkaListener(
            topics = KafkaTopicConfig.TOPIC_PAYMENT_SUCCESSFUL,
            groupId = "order-payment-group",
            concurrency = "2",
            containerFactory = "paymentSuccessfulKafkaListenerContainerFactory"
    )
    public void consumePaymentSuccess(PaymentSuccessfulEvent event) {
        log.info("[Kafka Consumer - Order Service] Tiếp nhận sự kiện thanh toán thành công: orderCode=[{}], amount=[{} đ], method=[{}]",
                event.getOrderCode(), event.getAmount(), event.getPaymentMethod());

        try {
            Order order = orderRepository.findByOrderCode(event.getOrderCode())
                    .orElse(null);

            if (order == null) {
                log.warn("[Kafka Consumer - Order Service] Không tìm thấy đơn hàng với mã: [{}]", event.getOrderCode());
                return;
            }

            if (order.getStatus() == OrderStatus.PAID) {
                log.info("[Kafka Consumer - Order Service] Đơn hàng [{}] đã ở trạng thái PAID trước đó (Idempotent skipped).", event.getOrderCode());
                return;
            }

            // Chuyển trạng thái đơn sang PAID
            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);

            log.info("[Kafka Consumer - Order Service] Cập nhật thành công đơn hàng [{}] sang trạng thái PAID!", event.getOrderCode());
        } catch (Exception e) {
            log.error("[Kafka Consumer - Order Service] Lỗi khi xử lý sự kiện thanh toán cho đơn hàng [{}]: {}",
                    event.getOrderCode(), e.getMessage(), e);
            throw e;
        }
    }
}
