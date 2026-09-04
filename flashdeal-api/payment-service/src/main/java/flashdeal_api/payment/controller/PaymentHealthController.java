package flashdeal_api.payment.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payments")
@Tag(name = "Payment Health Controller", description = "Kiểm tra trạng thái hoạt động của Payment Service")
public class PaymentHealthController {

    @GetMapping("/health")
    @Operation(summary = "Kiểm tra tình trạng sống của Payment Service")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "payment-service");
        response.put("port", 8084);
        response.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(response);
    }
}
