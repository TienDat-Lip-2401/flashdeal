package flashdeal_api.notification.consumer;

import flashdeal_api.notification.model.event.OrderCreatedEvent;
import flashdeal_api.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderCreatedNotificationConsumer {

    private final EmailService emailService;

    @Value("${spring.mail.username:datnguyentien2401@gmail.com}")
    private String defaultNotificationEmail;

    /**
     * Lang nghe su kien dat hang Flash Sale thanh cong tu Apache Kafka
     * Tu dong gui email xac nhan don hang kem thoi han 15 phut den hop thu khach hang
     */
    @KafkaListener(
            topics = "${spring.kafka.topic.order-created:flashsale.order.created}",
            groupId = "${spring.kafka.consumer.group-id:notification-service-group}",
            containerFactory = "orderCreatedKafkaListenerContainerFactory"
    )
    public void consumeOrderCreatedEvent(OrderCreatedEvent event) {
        log.info("OrderCreatedNotificationConsumer: Received event for orderCode: {}, productId: {}, userId: {}",
                event.getOrderCode(), event.getProductId(), event.getUserId());

        try {
            // Gui email toi dia chi nguoi nhan (uu tien email nguoi dat hang, neu trong thi fallback ve default email)
            String recipient = (event.getEmail() != null && !event.getEmail().trim().isEmpty())
                    ? event.getEmail().trim()
                    : defaultNotificationEmail;

            emailService.sendOrderCreatedEmail(recipient, event);
            log.info("OrderCreatedNotificationConsumer: Processed email successfully for orderCode: {} to: {}", event.getOrderCode(), recipient);
        } catch (Exception e) {
            log.error("OrderCreatedNotificationConsumer: Error processing notification for orderCode: {}", event.getOrderCode(), e);
        }
    }
}
