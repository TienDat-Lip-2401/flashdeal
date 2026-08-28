package flashdeal_api.notification.service.impl;

import flashdeal_api.notification.model.event.OrderCreatedEvent;
import flashdeal_api.notification.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username:datnguyentien2401@gmail.com}")
    private String senderEmail;

    @Override
    public void sendOrderCreatedEmail(String recipientEmail, OrderCreatedEvent event) {
        try {
            log.info("Preparing order created email for orderCode: {}, recipient: {}", event.getOrderCode(), recipientEmail);

            // 1. Dinh dang gia tien va thoi gian
            NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
            String formattedPrice = event.getTotalAmount() != null
                    ? currencyFormat.format(event.getTotalAmount())
                    : "0 đ";

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");
            String formattedExpiresAt = event.getExpiresAt() != null
                    ? event.getExpiresAt().format(dtf)
                    : "Trong vong 15 phut";

            // 2. Nap du lieu vao Thymeleaf Context
            Context context = new Context();
            context.setVariable("orderCode", event.getOrderCode());
            context.setVariable("productName", event.getProductName() != null ? event.getProductName() : "San pham Flash Sale");
            context.setVariable("quantity", event.getQuantity() != null ? event.getQuantity() : 1);
            context.setVariable("formattedPrice", formattedPrice);
            context.setVariable("expiresAt", formattedExpiresAt);
            context.setVariable("shippingAddress", event.getShippingAddress() != null ? event.getShippingAddress() : "Ha Noi, Viet Nam");
            context.setVariable("phone", event.getPhone() != null ? event.getPhone() : "0988668899");
            context.setVariable("paymentUrl", "http://localhost:5174/flash-sale");

            // 3. Render HTML tu template
            String htmlContent = templateEngine.process("order-created-email", context);

            // 4. Gui Email qua JavaMailSender
            String subject = "[FlashDeal] Xac Nhan Don Hang #" + event.getOrderCode() + " - Han Thanh Toan 15 Phut";
            sendSimpleHtmlEmail(recipientEmail, subject, htmlContent);

            log.info("Successfully sent order created email for orderCode: {} to: {}", event.getOrderCode(), recipientEmail);
        } catch (Exception e) {
            log.error("Failed to process order created email for orderCode: {}", event.getOrderCode(), e);
        }
    }

    @Override
    public void sendSimpleHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(senderEmail, "FlashDeal Enterprise");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("HTML email successfully dispatched to: [{}] with subject: [{}]", to, subject);
        } catch (Exception e) {
            log.error("Failed to dispatch HTML email to: [{}]", to, e);
        }
    }
}
