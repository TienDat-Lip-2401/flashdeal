package flashdeal_api.payment.controller;

import flashdeal_api.payment.client.OrderClient;
import flashdeal_api.payment.client.OrderClient.OrderInfo;
import flashdeal_api.payment.dto.PaymentCallbackResponse;
import flashdeal_api.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Thanh toán giả lập cho môi trường demo/kiểm thử.
 * Chỉ tồn tại khi payment.simulate.enabled=true (mặc định tắt); khi tắt, các đường dẫn này trả 404.
 * Kể cả khi bật, chỉ chủ đơn mới giả lập được cho đơn đang chờ thanh toán của chính mình.
 */
@RestController
@RequestMapping("/payments/vnpay")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "payment.simulate.enabled", havingValue = "true")
@Tag(name = "Payment Simulation", description = "Giả lập kết quả VNPAY (chỉ bật ở môi trường demo)")
public class PaymentSimulateController {

    private final PaymentService paymentService;
    private final OrderClient orderClient;

    @PostMapping("/simulate-pay")
    @Operation(summary = "Giả lập thanh toán VNPAY thành công cho đơn của chính mình")
    public ResponseEntity<PaymentCallbackResponse> simulatePayment(
            @RequestParam String orderCode,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            Authentication authentication) {
        OrderInfo order = orderClient.getOrder(orderCode, authorization)
                .requirePayableBy((Long) authentication.getPrincipal());
        return ResponseEntity.ok(paymentService.simulateSuccessPayment(order, PaymentController.callerEmail(authentication)));
    }

    @PostMapping("/simulate-fail")
    @Operation(summary = "Giả lập thanh toán VNPAY thất bại (kiểm thử luồng bù trừ Saga) cho đơn của chính mình")
    public ResponseEntity<PaymentCallbackResponse> simulateFailPayment(
            @RequestParam String orderCode,
            @RequestParam(required = false, defaultValue = "Khách hàng hủy thanh toán hoặc tài khoản không đủ số dư") String reason,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            Authentication authentication) {
        OrderInfo order = orderClient.getOrder(orderCode, authorization)
                .requirePayableBy((Long) authentication.getPrincipal());
        return ResponseEntity.ok(paymentService.simulateFailPayment(order, PaymentController.callerEmail(authentication), reason));
    }
}
