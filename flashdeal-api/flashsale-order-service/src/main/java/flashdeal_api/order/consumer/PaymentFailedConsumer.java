package flashdeal_api.order.consumer;

import flashdeal_api.order.config.KafkaTopicConfig;
import flashdeal_api.order.model.event.PaymentFailedEvent;
import flashdeal_api.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumer lắng nghe sự kiện thanh toán thất bại từ Kafka để thực thi
 * Giao dịch bù trừ (Compensating Transaction) trong Saga: Hủy đơn và Hoàn kho.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentFailedConsumer {

    private final OrderService orderService;

    @KafkaListener(
            topics = KafkaTopicConfig.TOPIC_PAYMENT_FAILED,
            groupId = "order-payment-failed-group",
            concurrency = "2",
            containerFactory = "paymentFailedKafkaListenerContainerFactory"
    )
    public void consumePaymentFailed(PaymentFailedEvent event) {
        log.warn("[Kafka Consumer - Saga Compensation] Tiếp nhận sự kiện thanh toán thất bại: orderCode=[{}], amount=[{} đ], reason=[{}]",
                event.getOrderCode(), event.getAmount(), event.getFailureReason());

        try {
            orderService.cancelAndRestockOrderByPaymentFailure(event.getOrderCode(), event.getFailureReason());
        } catch (Exception e) {
            log.error("[Kafka Consumer - Saga Compensation] Lỗi khi thực hiện giao dịch bù trừ cho đơn hàng [{}]: {}",
                    event.getOrderCode(), e.getMessage(), e);
            throw e; // Ném exception để DefaultErrorHandler kích hoạt retry / DLT
        }
    }
}
