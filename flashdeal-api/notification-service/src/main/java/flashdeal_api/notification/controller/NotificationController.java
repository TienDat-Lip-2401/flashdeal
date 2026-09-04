package flashdeal_api.notification.controller;

import flashdeal_api.notification.model.event.OrderCreatedEvent;
import flashdeal_api.notification.model.event.UserRegisteredEvent;
import flashdeal_api.notification.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(name = "Notification & Email Controller", description = "APIs Kiem tra trang thai va test gui Email qua Kafka")
public class NotificationController {

    private final EmailService emailService;

    @Value("${spring.mail.username:datnguyentien2401@gmail.com}")
    private String defaultEmail;

    @GetMapping("/health")
    @Operation(summary = "Kiem tra trang thai Notification Service")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "notification-service");
        response.put("port", 8086);
        response.put("mailSender", defaultEmail);
        response.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-email")
    @Operation(summary = "Gui thu mot Email xac nhan don hang Flash Sale mau",
               description = "Kich hoat gui truc tiep mot Email HTML den hop thu cua ban de kiem tra ket noi Gmail SMTP")
    public ResponseEntity<Map<String, Object>> sendTestEmail(@RequestParam(required = false) String targetEmail) {
        String recipient = (targetEmail != null && !targetEmail.trim().isEmpty()) ? targetEmail : defaultEmail;

        OrderCreatedEvent sampleEvent = OrderCreatedEvent.builder()
                .orderCode("FS-" + System.currentTimeMillis() + "-TEST")
                .userId(1L)
                .campaignId(1L)
                .productId(101L)
                .productName("iPhone 16 Pro Max 256GB Titan Tu Nhien (Test Email)")
                .price(java.math.BigDecimal.valueOf(17495000L))
                .quantity(1)
                .totalAmount(java.math.BigDecimal.valueOf(17495000L))
                .shippingAddress("Toa nha VinUni, Vinhomes Ocean Park, Gia Lam, Ha Noi")
                .phone("0988668899")
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .timestamp(LocalDateTime.now())
                .build();

        emailService.sendOrderCreatedEmail(recipient, sampleEvent);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 1000);
        response.put("message", "Da gui email kiem thu thanh cong toi: " + recipient);
        response.put("orderCode", sampleEvent.getOrderCode());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-welcome-email")
    @Operation(summary = "Gui thu mot Email chao mung thanh vien moi mau",
               description = "Kich hoat gui truc tiep mot Email HTML chao mung den hop thu de kiem tra giao dien")
    public ResponseEntity<Map<String, Object>> sendTestWelcomeEmail(@RequestParam(required = false) String targetEmail) {
        String recipient = (targetEmail != null && !targetEmail.trim().isEmpty()) ? targetEmail : defaultEmail;

        UserRegisteredEvent sampleEvent = UserRegisteredEvent.builder()
                .userId(999L)
                .email(recipient)
                .fullName("Nguyễn Tiến Đạt (Test Welcome)")
                .phone("0988668899")
                .role("ROLE_CUSTOMER")
                .registeredAt(LocalDateTime.now())
                .build();

        emailService.sendWelcomeEmail(recipient, sampleEvent);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 1000);
        response.put("message", "Da gui email chao mung kiem thu thanh cong toi: " + recipient);
        response.put("email", recipient);
        return ResponseEntity.ok(response);
    }
}
