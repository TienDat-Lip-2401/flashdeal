package flashdeal_api.notification.consumer;

import flashdeal_api.notification.model.event.UserRegisteredEvent;
import flashdeal_api.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserRegisteredNotificationConsumer {

    private final EmailService emailService;

    @Value("${spring.mail.username:datnguyentien2401@gmail.com}")
    private String defaultNotificationEmail;

    /**
     * Lắng nghe sự kiện đăng ký người dùng mới từ auth-service qua Apache Kafka.
     * Tự động kích hoạt gửi email chào mừng thành viên mới kèm thông tin tài khoản.
     */
    @KafkaListener(
            topics = "${spring.kafka.topic.user-registered:user.registered.event}",
            groupId = "notification-user-group",
            concurrency = "2",
            containerFactory = "userRegisteredKafkaListenerContainerFactory"
    )
    public void consumeUserRegisteredEvent(UserRegisteredEvent event) {
        log.info("UserRegisteredNotificationConsumer: Received registration event for userId: {}, email: {}, name: {}",
                event.getUserId(), event.getEmail(), event.getFullName());

        try {
            String recipient = (StringUtils.hasText(event.getEmail()))
                    ? event.getEmail().trim()
                    : defaultNotificationEmail;

            emailService.sendWelcomeEmail(recipient, event);
            log.info("UserRegisteredNotificationConsumer: Processed welcome email successfully for userId: {} to: {}",
                    event.getUserId(), recipient);
        } catch (Exception e) {
            log.error("UserRegisteredNotificationConsumer: Error processing welcome email for userId: {}",
                    event.getUserId(), e);
        }
    }
}
