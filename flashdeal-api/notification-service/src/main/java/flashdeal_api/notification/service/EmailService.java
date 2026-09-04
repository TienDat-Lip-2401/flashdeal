package flashdeal_api.notification.service;

import flashdeal_api.notification.model.event.OrderCreatedEvent;
import flashdeal_api.notification.model.event.PaymentSuccessfulEvent;
import flashdeal_api.notification.model.event.UserRegisteredEvent;

public interface EmailService {

    void sendOrderCreatedEmail(String recipientEmail, OrderCreatedEvent event);

    void sendWelcomeEmail(String recipientEmail, UserRegisteredEvent event);

    void sendPaymentSuccessEmail(PaymentSuccessfulEvent event);

    void sendSimpleHtmlEmail(String to, String subject, String htmlContent);
}
