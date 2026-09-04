package flashdeal_api.payment.controller;

import flashdeal_api.payment.dto.PaymentCallbackResponse;
import flashdeal_api.payment.dto.VNPayCreatePaymentRequest;
import flashdeal_api.payment.dto.VNPayPaymentResponse;
import flashdeal_api.payment.entity.Payment;
import flashdeal_api.payment.repository.PaymentRepository;
import flashdeal_api.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
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

    @PostMapping("/vnpay/create-payment-url")
    @Operation(summary = "Tạo URL chuyển hướng sang Cổng thanh toán VNPAY Sandbox")
    public ResponseEntity<VNPayPaymentResponse> createVNPayPaymentUrl(
            @Valid @RequestBody VNPayCreatePaymentRequest request,
            HttpServletRequest servletRequest) {
        VNPayPaymentResponse response = paymentService.createVNPayPaymentUrl(request, servletRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vnpay/payment-callback")
    @Operation(summary = "Tiếp nhận phản hồi giao dịch trả về từ VNPAY (Kiểm tra chữ ký bảo mật HMAC-SHA512)")
    public ResponseEntity<PaymentCallbackResponse> handleVNPayCallback(
            @RequestParam Map<String, String> allParams) {
        PaymentCallbackResponse response = paymentService.processVNPayCallback(allParams);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/vnpay/simulate-pay")
    @Operation(summary = "Giả lập thanh toán VNPAY thành công (Dành cho Developer kiểm thử nhanh)")
    public ResponseEntity<PaymentCallbackResponse> simulatePayment(
            @RequestParam String orderCode,
            @RequestParam(required = false) String email) {
        PaymentCallbackResponse response = paymentService.simulateSuccessPayment(orderCode, email);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/order/{orderCode}")
    @Operation(summary = "Tra cứu thông tin và trạng thái thanh toán theo mã đơn hàng")
    public ResponseEntity<?> getPaymentByOrderCode(@PathVariable String orderCode) {
        return paymentRepository.findByOrderCode(orderCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
