package flashdeal_api.notification.service.impl;

import flashdeal_api.notification.model.event.OrderCreatedEvent;
import flashdeal_api.notification.model.event.UserRegisteredEvent;
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
    public void sendWelcomeEmail(String recipientEmail, UserRegisteredEvent event) {
        try {
            log.info("Preparing welcome email for userId: {}, recipient: {}", event.getUserId(), recipientEmail);

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");
            String formattedRegisteredAt = event.getRegisteredAt() != null
                    ? event.getRegisteredAt().format(dtf)
                    : java.time.LocalDateTime.now().format(dtf);

            Context context = new Context();
            context.setVariable("fullName", (event.getFullName() != null && !event.getFullName().trim().isEmpty())
                    ? event.getFullName() : "Quý khách");
            context.setVariable("email", event.getEmail());
            context.setVariable("phone", (event.getPhone() != null && !event.getPhone().trim().isEmpty())
                    ? event.getPhone() : "Chưa cập nhật");
            context.setVariable("registeredAt", formattedRegisteredAt);
            context.setVariable("shopUrl", "http://localhost:5174/");

            String htmlContent = templateEngine.process("welcome-user-email", context);
            String recipientName = (event.getFullName() != null && !event.getFullName().trim().isEmpty())
                    ? event.getFullName() : "Thành Viên Mới";
            String subject = "[FlashDeal] Chào Mừng " + recipientName + " Gia Nhập Sàn Flash Sale Tốc Độ Cao!";

            sendSimpleHtmlEmail(recipientEmail, subject, htmlContent);
            log.info("Successfully sent welcome email for userId: {} to: {}", event.getUserId(), recipientEmail);
        } catch (Exception e) {
            log.error("Failed to process welcome email for userId: {}", event.getUserId(), e);
        }
    }

    @Override
    public void sendPaymentSuccessEmail(flashdeal_api.notification.model.event.PaymentSuccessfulEvent event) {
        try {
            String recipientEmail = event.getUserEmail();
            if (recipientEmail == null || recipientEmail.isBlank()) {
                recipientEmail = "datnguyentien2401@gmail.com";
            }
            log.info("Chuẩn bị gửi email xác nhận thanh toán VNPAY cho đơn hàng: [{}], người nhận: [{}]",
                    event.getOrderCode(), recipientEmail);

            NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
            String formattedPrice = event.getAmount() != null
                    ? currencyFormat.format(event.getAmount())
                    : "0 đ";

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");
            String formattedPaidAt = event.getPaidAt() != null
                    ? event.getPaidAt().format(dtf)
                    : java.time.LocalDateTime.now().format(dtf);

            Context context = new Context();
            context.setVariable("orderCode", event.getOrderCode());
            context.setVariable("paymentCode", event.getPaymentCode());
            context.setVariable("transactionNo", event.getVnpTransactionNo() != null ? event.getVnpTransactionNo() : "14234567");
            context.setVariable("bankCode", (event.getBankCode() != null && !event.getBankCode().isBlank()) ? event.getBankCode() : "NCB / VNPAY");
            context.setVariable("formattedPrice", formattedPrice);
            context.setVariable("paidAt", formattedPaidAt);
            context.setVariable("ordersUrl", "http://localhost:5173/orders");

            String htmlContent = templateEngine.process("vnpay-payment-success-email", context);
            String subject = "[FlashDeal] Biên lai thanh toán thành công đơn hàng #" + event.getOrderCode() + " qua VNPAY";

            sendSimpleHtmlEmail(recipientEmail, subject, htmlContent);
            log.info("Đã gửi thành công email biên lai thanh toán VNPAY cho đơn hàng: [{}] tới: [{}]",
                    event.getOrderCode(), recipientEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email biên lai thanh toán cho đơn hàng [{}]: {}", event.getOrderCode(), e.getMessage(), e);
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
