package flashdeal_api.payment.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import flashdeal_api.payment.client.OrderClient.OrderInfo;
import flashdeal_api.payment.config.VNPayConfig;
import flashdeal_api.payment.dto.PaymentCallbackResponse;
import flashdeal_api.payment.dto.VNPayCreatePaymentRequest;
import flashdeal_api.payment.dto.VNPayPaymentResponse;
import flashdeal_api.payment.entity.OutboxEvent;
import flashdeal_api.payment.entity.OutboxStatus;
import flashdeal_api.payment.entity.Payment;
import flashdeal_api.payment.entity.PaymentStatus;
import flashdeal_api.payment.model.event.PaymentFailedEvent;
import flashdeal_api.payment.model.event.PaymentSuccessfulEvent;
import flashdeal_api.payment.repository.OutboxRepository;
import flashdeal_api.payment.repository.PaymentRepository;
import flashdeal_api.payment.util.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final VNPayConfig vnpayConfig;
    private final PaymentRepository paymentRepository;
    private final OutboxRepository outboxRepository;
    private final PaymentIdempotencyService paymentIdempotencyService;
    private final ObjectMapper objectMapper;

    @Value("${spring.kafka.topic.payment-successful:payment.successful.event}")
    private String paymentSuccessfulTopic;

    @Value("${spring.kafka.topic.payment-failed:payment.failed.event}")
    private String paymentFailedTopic;

    private static final DateTimeFormatter VNP_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Override
    @Transactional
    public VNPayPaymentResponse createVNPayPaymentUrl(VNPayCreatePaymentRequest request, OrderInfo order, String email,
                                                     HttpServletRequest servletRequest) {
        log.info("[VNPay] Khởi tạo yêu cầu thanh toán cho đơn hàng: [{}], số tiền: [{} đ]",
                order.orderCode(), order.totalAmount());

        // 1. Tạo hoặc lấy bản ghi Payment. Số tiền và chủ đơn lấy từ order-service, không tin dữ liệu client gửi lên
        Payment payment = findOrCreatePayment(order, email);
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Đơn hàng này đã được thanh toán.");
        }
        payment.setAmount(order.totalAmount());
        payment.setStatus(PaymentStatus.PENDING);
        paymentRepository.save(payment);

        // 2. Chuẩn bị các tham số cho VNPAY theo chuẩn 2.1.0
        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", vnpayConfig.getVersion());
        vnpParams.put("vnp_Command", vnpayConfig.getCommand());
        vnpParams.put("vnp_TmnCode", vnpayConfig.getTmnCode());

        // Số tiền nhân 100 theo quy định của VNPAY (Ví dụ 10,000 VND -> 1,000,000)
        long amountInCents = payment.getAmount().multiply(BigDecimal.valueOf(100)).longValue();
        vnpParams.put("vnp_Amount", String.valueOf(amountInCents));
        vnpParams.put("vnp_CurrCode", "VND");

        // Gắn orderCode vào vnp_TxnRef để nhận diện khi VNPay redirect về
        vnpParams.put("vnp_TxnRef", order.orderCode());

        String orderInfo = (request.getOrderInfo() != null && !request.getOrderInfo().isBlank())
                ? request.getOrderInfo()
                : "Thanh toan don hang FlashSale " + order.orderCode();
        vnpParams.put("vnp_OrderInfo", orderInfo);
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnpayConfig.getReturnUrl());
        vnpParams.put("vnp_IpAddr", VNPayUtil.getIpAddress(servletRequest));

        LocalDateTime now = LocalDateTime.now(VN_ZONE);
        vnpParams.put("vnp_CreateDate", now.format(VNP_DATE_FORMATTER));
        // Hạn thanh toán 15 phút
        vnpParams.put("vnp_ExpireDate", now.plusMinutes(15).format(VNP_DATE_FORMATTER));

        if (request.getBankCode() != null && !request.getBankCode().isBlank()) {
            vnpParams.put("vnp_BankCode", request.getBankCode());
        }

        // 3. Sắp xếp danh sách tham số theo bảng chữ cái và tạo chuỗi hash
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();

        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                // Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                // Build query string
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        // 4. Tính toán mã băm HMAC-SHA512
        String queryUrl = query.toString();
        String vnpSecureHash = VNPayUtil.hmacSHA512(vnpayConfig.getHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnpSecureHash;

        String paymentUrl = vnpayConfig.getPayUrl() + "?" + queryUrl;
        log.info("[VNPay] Tạo link thanh toán thành công: {}", paymentUrl);

        return VNPayPaymentResponse.builder()
                .paymentUrl(paymentUrl)
                .paymentCode(payment.getPaymentCode())
                .orderCode(payment.getOrderCode())
                .amount(payment.getAmount())
                .build();
    }

    @Override
    @Transactional
    public PaymentCallbackResponse processVNPayCallback(Map<String, String> allParams) {
        log.info("[VNPay Callback] Tiếp nhận phản hồi giao dịch từ VNPAY: {}", allParams);

        String vnpSecureHash = allParams.get("vnp_SecureHash");
        Map<String, String> fields = new HashMap<>(allParams);
        fields.remove("vnp_SecureHashType");
        fields.remove("vnp_SecureHash");

        // 1. Kiểm tra chữ ký bảo mật HMAC-SHA512
        String signValue = VNPayUtil.hashAllFields(fields, vnpayConfig.getHashSecret());
        boolean isValidSignature = signValue.equalsIgnoreCase(vnpSecureHash);

        if (!isValidSignature) {
            log.error("[VNPay Callback] Chữ ký không hợp lệ! Kỳ vọng: {}, Nhận được: {}", signValue, vnpSecureHash);
            return PaymentCallbackResponse.builder()
                    .responseCode("97")
                    .message("Chữ ký bảo mật không hợp lệ")
                    .success(false)
                    .build();
        }

        String orderCode = allParams.get("vnp_TxnRef");
        String responseCode = allParams.get("vnp_ResponseCode");
        String transactionNo = allParams.get("vnp_TransactionNo");
        String bankCode = allParams.get("vnp_BankCode");
        String amountStr = allParams.get("vnp_Amount");

        BigDecimal amount = BigDecimal.ZERO;
        if (amountStr != null) {
            amount = new BigDecimal(amountStr).divide(BigDecimal.valueOf(100));
        }

        // Chỉ chấp nhận giao dịch cho Payment đã tạo qua create-payment-url (số tiền lấy từ order-service)
        Optional<Payment> existingPaymentOpt = paymentRepository.findByOrderCode(orderCode);
        if (existingPaymentOpt.isEmpty()) {
            log.error("[VNPay Callback] Không có yêu cầu thanh toán nào cho đơn hàng [{}]", orderCode);
            return PaymentCallbackResponse.builder()
                    .responseCode("01")
                    .message("Không tìm thấy yêu cầu thanh toán cho đơn hàng")
                    .orderCode(orderCode)
                    .success(false)
                    .build();
        }
        // Số tiền khách thực trả phải khớp tổng tiền đơn, chống sửa số tiền trước khi sang VNPay
        if (amount.compareTo(existingPaymentOpt.get().getAmount()) != 0) {
            log.error("[VNPay Callback] Số tiền không khớp cho đơn [{}]: VNPay {} đ, đơn hàng {} đ",
                    orderCode, amount, existingPaymentOpt.get().getAmount());
            return PaymentCallbackResponse.builder()
                    .responseCode("04")
                    .message("Số tiền thanh toán không khớp với đơn hàng")
                    .orderCode(orderCode)
                    .success(false)
                    .build();
        }

        // Lớp 1 (DB Guard): Kiểm tra trong DB nếu đơn đã thanh toán thành công trước đó (chống F5 Reload trang)
        if (existingPaymentOpt.isPresent() && existingPaymentOpt.get().getStatus() == PaymentStatus.SUCCESS) {
            Payment p = existingPaymentOpt.get();
            log.info("[VNPay Callback] Đơn hàng [{}] đã thanh toán thành công trước đó (Idempotent DB skipped, không bắn lại Kafka).", orderCode);
            return PaymentCallbackResponse.builder()
                    .responseCode("00")
                    .message("Thanh toán đơn hàng VNPAY thành công (đã xử lý trước đó)!")
                    .orderCode(orderCode)
                    .transactionNo(p.getVnpTransactionNo())
                    .bankCode(p.getBankCode())
                    .amount(p.getAmount())
                    .success(true)
                    .build();
        }

        // Lớp 2 (Redis Guard): Khóa nguyên tử SETNX 30s phòng ngừa Race Condition giữa Return URL & IPN Webhook
        String redisKey = "idempotency:payment:" + orderCode;
        boolean acquired = paymentIdempotencyService.tryAcquire(redisKey, 30L);
        if (!acquired) {
            log.warn("[VNPay Callback] Đang có tiến trình khác xử lý thanh toán cho đơn hàng [{}] (Redis lock active).", orderCode);
            Payment p = paymentRepository.findByOrderCode(orderCode).orElse(null);
            return PaymentCallbackResponse.builder()
                    .responseCode("00")
                    .message("Giao dịch thanh toán đang được xử lý hoặc đã hoàn tất!")
                    .orderCode(orderCode)
                    .transactionNo(p != null ? p.getVnpTransactionNo() : transactionNo)
                    .bankCode(p != null ? p.getBankCode() : bankCode)
                    .amount(p != null ? p.getAmount() : amount)
                    .success(true)
                    .build();
        }

        try {
            // 2. Bản ghi Payment đã được tạo ở create-payment-url
            Payment payment = existingPaymentOpt.get();

            // 3. Kiểm tra mã phản hồi (00 = Giao dịch thành công)
            if ("00".equals(responseCode)) {
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setVnpTransactionNo(transactionNo);
                payment.setBankCode(bankCode);
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);

                log.info("[VNPay Callback] Giao dịch thành công cho đơn hàng: [{}]. Ghi nhận sự kiện vào Outbox...", orderCode);

                // 4. Lưu sự kiện vào bảng outbox_events trong cùng DB Transaction
                saveOutboxEvent(payment, transactionNo, bankCode);

                // 5. Ghi nhận trạng thái COMPLETED trong Redis (lưu 120s chống spam/reload)
                paymentIdempotencyService.markCompleted(redisKey, 120L);

                return PaymentCallbackResponse.builder()
                        .responseCode("00")
                        .message("Thanh toán đơn hàng VNPAY thành công!")
                        .orderCode(orderCode)
                        .transactionNo(transactionNo)
                        .bankCode(bankCode)
                        .amount(payment.getAmount())
                        .success(true)
                        .build();
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                paymentIdempotencyService.release(redisKey);
                log.warn("[VNPay Callback] Giao dịch thất bại với mã lỗi: {}. Ghi nhận sự kiện thất bại vào Outbox...", responseCode);

                // Lưu sự kiện thất bại vào bảng outbox_events để kích hoạt chuỗi Saga Bù trừ
                savePaymentFailedOutboxEvent(payment, "Giao dịch VNPAY thất bại hoặc bị hủy (Mã lỗi: " + responseCode + ")");

                return PaymentCallbackResponse.builder()
                        .responseCode(responseCode)
                        .message("Giao dịch VNPAY thất bại hoặc bị hủy (Mã lỗi: " + responseCode + ")")
                        .orderCode(orderCode)
                        .transactionNo(transactionNo)
                        .bankCode(bankCode)
                        .amount(amount)
                        .success(false)
                        .build();
            }
        } catch (Exception ex) {
            paymentIdempotencyService.release(redisKey);
            log.error("[VNPay Callback] Lỗi ngoại lệ khi xử lý thanh toán cho đơn [{}]: {}", orderCode, ex.getMessage(), ex);
            throw ex;
        }
    }

    @Override
    @Transactional
    public PaymentCallbackResponse simulateSuccessPayment(OrderInfo order, String email) {
        String orderCode = order.orderCode();
        log.info("[VNPay Sandbox] Giả lập thanh toán thành công cho đơn hàng: [{}]", orderCode);

        // Lớp 1 (DB Guard): Đơn đã thanh toán trước đó thì bỏ qua, không bắn lại Kafka
        Optional<Payment> existingOpt = paymentRepository.findByOrderCode(orderCode);
        if (existingOpt.isPresent() && existingOpt.get().getStatus() == PaymentStatus.SUCCESS) {
            Payment p = existingOpt.get();
            log.info("[VNPay Sandbox] Đơn hàng [{}] đã thanh toán giả lập thành công trước đó (Idempotent DB skipped, không phát lại Kafka).", orderCode);
            return PaymentCallbackResponse.builder()
                    .responseCode("00")
                    .message("Giả lập thanh toán VNPAY thành công (đã xử lý trước đó)!")
                    .orderCode(orderCode)
                    .transactionNo(p.getVnpTransactionNo())
                    .bankCode(p.getBankCode())
                    .amount(p.getAmount())
                    .success(true)
                    .build();
        }

        // Lớp 2 (Redis Guard): Khóa nguyên tử 30s phòng click đúp
        String redisKey = "idempotency:payment:" + orderCode;
        boolean acquired = paymentIdempotencyService.tryAcquire(redisKey, 30L);
        if (!acquired) {
            log.warn("[VNPay Sandbox] Giao dịch giả lập cho đơn hàng [{}] đang được xử lý song song (Redis lock active).", orderCode);
            Payment p = paymentRepository.findByOrderCode(orderCode).orElse(null);
            return PaymentCallbackResponse.builder()
                    .responseCode("00")
                    .message("Giao dịch đang được xử lý hoặc đã hoàn tất!")
                    .orderCode(orderCode)
                    .transactionNo(p != null ? p.getVnpTransactionNo() : "")
                    .bankCode("NCB")
                    .amount(p != null ? p.getAmount() : order.totalAmount())
                    .success(true)
                    .build();
        }

        try {
            Payment payment = findOrCreatePayment(order, email);
            payment.setAmount(order.totalAmount());
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setVnpTransactionNo("SIM-" + System.currentTimeMillis());
            payment.setBankCode("NCB");
            payment.setPaidAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Ghi nhận sự kiện vào Outbox trong cùng DB Transaction
            saveOutboxEvent(payment, payment.getVnpTransactionNo(), "NCB");

            // Đánh dấu hoàn tất trên Redis (120s)
            paymentIdempotencyService.markCompleted(redisKey, 120L);

            return PaymentCallbackResponse.builder()
                    .responseCode("00")
                    .message("Giả lập thanh toán VNPAY thành công!")
                    .orderCode(orderCode)
                    .transactionNo(payment.getVnpTransactionNo())
                    .bankCode("NCB")
                    .amount(payment.getAmount())
                    .success(true)
                    .build();
        } catch (Exception ex) {
            paymentIdempotencyService.release(redisKey);
            log.error("[VNPay Sandbox] Lỗi khi giả lập thanh toán cho đơn [{}]: {}", orderCode, ex.getMessage(), ex);
            throw ex;
        }
    }

    @Override
    @Transactional
    public PaymentCallbackResponse simulateFailPayment(OrderInfo order, String email, String reason) {
        String orderCode = order.orderCode();
        log.warn("[VNPay Sandbox] Giả lập thanh toán THẤT BẠI cho đơn hàng: [{}], lý do: [{}]", orderCode, reason);

        Optional<Payment> existingOpt = paymentRepository.findByOrderCode(orderCode);

        if (existingOpt.isPresent() && existingOpt.get().getStatus() == PaymentStatus.SUCCESS) {
            log.warn("[VNPay Sandbox] Đơn hàng [{}] đã thanh toán thành công trước đó, không thể giả lập thất bại!", orderCode);
            return PaymentCallbackResponse.builder()
                    .responseCode("99")
                    .message("Đơn hàng đã thanh toán thành công trước đó, không thể hủy!")
                    .orderCode(orderCode)
                    .success(false)
                    .build();
        }

        Payment payment = findOrCreatePayment(order, email);
        payment.setStatus(PaymentStatus.FAILED);
        paymentRepository.save(payment);

        String failureReason = (reason != null && !reason.isBlank()) ? reason : "Khách hàng hủy thanh toán hoặc giao dịch bị lỗi (Sandbox simulated)";

        // Lưu sự kiện thất bại vào bảng outbox_events để kích hoạt Saga Bù trừ
        savePaymentFailedOutboxEvent(payment, failureReason);

        // Giải phóng Redis lock (nếu có)
        String redisKey = "idempotency:payment:" + orderCode;
        paymentIdempotencyService.release(redisKey);

        return PaymentCallbackResponse.builder()
                .responseCode("24")
                .message("Giả lập thanh toán VNPAY thất bại: " + failureReason)
                .orderCode(orderCode)
                .transactionNo(payment.getPaymentCode())
                .bankCode("NCB")
                .amount(payment.getAmount())
                .success(false)
                .build();
    }

    /** Lấy Payment của đơn, hoặc tạo mới với chủ đơn và số tiền thật lấy từ order-service. */
    private Payment findOrCreatePayment(OrderInfo order, String email) {
        Payment payment = paymentRepository.findByOrderCode(order.orderCode())
                .orElseGet(() -> Payment.builder()
                        .paymentCode("PAY-" + System.currentTimeMillis() + "-"
                                + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                        .orderCode(order.orderCode())
                        .amount(order.totalAmount())
                        .paymentMethod("VNPAY")
                        .status(PaymentStatus.PENDING)
                        .createdAt(LocalDateTime.now())
                        .build());
        payment.setUserId(order.userId());
        if (email != null && !email.isBlank()) {
            payment.setUserEmail(email);
        }
        return payment;
    }

    /**
     * Ghi nhận sự kiện thanh toán thành công vào bảng outbox_events trong cùng DB Transaction.
     */
    private void saveOutboxEvent(Payment payment, String transactionNo, String bankCode) {
        try {
            PaymentSuccessfulEvent event = PaymentSuccessfulEvent.builder()
                    .paymentCode(payment.getPaymentCode())
                    .orderCode(payment.getOrderCode())
                    .userId(payment.getUserId())
                    .userEmail(payment.getUserEmail())
                    .amount(payment.getAmount())
                    .paymentMethod(payment.getPaymentMethod() != null ? payment.getPaymentMethod() : "VNPAY")
                    .vnpTransactionNo(transactionNo)
                    .bankCode(bankCode)
                    .paidAt(payment.getPaidAt())
                    .build();

            String payload = objectMapper.writeValueAsString(event);

            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .aggregateType("PAYMENT")
                    .aggregateId(payment.getOrderCode())
                    .eventType("PaymentSuccessfulEvent")
                    .payload(payload)
                    .topic(paymentSuccessfulTopic)
                    .status(OutboxStatus.PENDING)
                    .build();

            outboxRepository.save(outboxEvent);
            log.info("[Outbox] Đã lưu sự kiện thanh toán thành công cho đơn hàng: [{}] vào outbox_events (PENDING)",
                    payment.getOrderCode());
        } catch (JsonProcessingException e) {
            log.error("[Outbox] Lỗi serialize payload sự kiện cho đơn hàng [{}]: {}", payment.getOrderCode(), e.getMessage(), e);
            throw new RuntimeException("Lỗi lưu sự kiện Outbox", e);
        }
    }

    /**
     * Ghi nhận sự kiện thanh toán thất bại vào bảng outbox_events trong cùng DB Transaction
     * để kích hoạt chuỗi giao dịch bù trừ (Compensating Transaction) của Saga.
     */
    private void savePaymentFailedOutboxEvent(Payment payment, String failureReason) {
        try {
            PaymentFailedEvent event = PaymentFailedEvent.builder()
                    .paymentCode(payment.getPaymentCode())
                    .orderCode(payment.getOrderCode())
                    .userId(payment.getUserId())
                    .userEmail(payment.getUserEmail())
                    .amount(payment.getAmount())
                    .paymentMethod(payment.getPaymentMethod() != null ? payment.getPaymentMethod() : "VNPAY")
                    .failureReason(failureReason)
                    .failedAt(LocalDateTime.now())
                    .build();

            String payload = objectMapper.writeValueAsString(event);

            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .aggregateType("PAYMENT")
                    .aggregateId(payment.getOrderCode())
                    .eventType("PaymentFailedEvent")
                    .payload(payload)
                    .topic(paymentFailedTopic)
                    .status(OutboxStatus.PENDING)
                    .build();

            outboxRepository.save(outboxEvent);
            log.info("[Outbox] Đã lưu sự kiện thanh toán THẤT BẠI cho đơn hàng: [{}] vào outbox_events (PENDING)",
                    payment.getOrderCode());
        } catch (JsonProcessingException e) {
            log.error("[Outbox] Lỗi serialize payload sự kiện thất bại cho đơn hàng [{}]: {}", payment.getOrderCode(), e.getMessage(), e);
            throw new RuntimeException("Lỗi lưu sự kiện Outbox", e);
        }
    }
}
