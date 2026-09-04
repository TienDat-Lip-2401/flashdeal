package flashdeal_api.notification.consumer;

import flashdeal_api.notification.model.event.PaymentSuccessfulEvent;
import flashdeal_api.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentSuccessNotificationConsumer {

    private final EmailService emailService;

    @KafkaListener(
            topics = "payment.successful.event",
            groupId = "notification-payment-group",
            concurrency = "2",
            containerFactory = "paymentSuccessfulKafkaListenerContainerFactory"
    )
    public void consumePaymentSuccess(PaymentSuccessfulEvent event) {
        log.info("[Kafka Consumer - Notification Service] Tiếp nhận sự kiện thanh toán thành công: orderCode=[{}], amount=[{} đ], userEmail=[{}]",
                event.getOrderCode(), event.getAmount(), event.getUserEmail());

        try {
            emailService.sendPaymentSuccessEmail(event);
        } catch (Exception e) {
            log.error("[Kafka Consumer - Notification Service] Thất bại khi gửi email biên lai cho đơn hàng [{}]: {}",
                    event.getOrderCode(), e.getMessage(), e);
        }
    }
}
