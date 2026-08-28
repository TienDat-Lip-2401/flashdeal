package flashdeal_api.notification.service;

import flashdeal_api.notification.model.event.OrderCreatedEvent;

public interface EmailService {

    void sendOrderCreatedEmail(String recipientEmail, OrderCreatedEvent event);

    void sendSimpleHtmlEmail(String to, String subject, String htmlContent);
}
