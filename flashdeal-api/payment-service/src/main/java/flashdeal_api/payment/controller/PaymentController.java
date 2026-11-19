package flashdeal_api.payment.controller;

import flashdeal_api.payment.client.OrderClient;
import flashdeal_api.payment.client.OrderClient.OrderInfo;
import flashdeal_api.payment.dto.PaymentCallbackResponse;
import flashdeal_api.payment.dto.VNPayCreatePaymentRequest;
import flashdeal_api.payment.dto.VNPayPaymentResponse;
import flashdeal_api.payment.repository.PaymentRepository;
import flashdeal_api.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment Controller", description = "Quản lý Cổng Thanh Toán VNPAY Sandbox & Bắn Sự Kiện Kafka")
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final OrderClient orderClient;

    @PostMapping("/vnpay/create-payment-url")
    @Operation(summary = "Tạo URL chuyển hướng sang Cổng thanh toán VNPAY Sandbox (chỉ chủ đơn, số tiền lấy từ đơn hàng)")
    public ResponseEntity<VNPayPaymentResponse> createVNPayPaymentUrl(
            @Valid @RequestBody VNPayCreatePaymentRequest request,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            Authentication authentication,
            HttpServletRequest servletRequest) {
        OrderInfo order = orderClient.getOrder(request.getOrderCode(), authorization)
                .requirePayableBy((Long) authentication.getPrincipal());
        VNPayPaymentResponse response = paymentService.createVNPayPaymentUrl(
                request, order, callerEmail(authentication), servletRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vnpay/payment-callback")
    @Operation(summary = "Tiếp nhận phản hồi giao dịch trả về từ VNPAY (Kiểm tra chữ ký bảo mật HMAC-SHA512)")
    public ResponseEntity<PaymentCallbackResponse> handleVNPayCallback(
            @RequestParam Map<String, String> allParams) {
        PaymentCallbackResponse response = paymentService.processVNPayCallback(allParams);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/order/{orderCode}")
    @Operation(summary = "Tra cứu thông tin và trạng thái thanh toán theo mã đơn hàng (chủ đơn hoặc admin)")
    public ResponseEntity<?> getPaymentByOrderCode(
            @PathVariable String orderCode,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        // order-service chỉ trả đơn cho chủ đơn hoặc admin; người khác nhận 404
        orderClient.getOrder(orderCode, authorization);
        return paymentRepository.findByOrderCode(orderCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Email lưu trong details của token (do JwtAuthenticationFilter gắn vào). */
    static String callerEmail(Authentication authentication) {
        return authentication.getDetails() instanceof String email ? email : null;
    }
}
