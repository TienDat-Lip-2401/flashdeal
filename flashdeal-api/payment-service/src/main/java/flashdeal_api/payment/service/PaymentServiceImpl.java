package flashdeal_api.payment.service;

import flashdeal_api.payment.config.VNPayConfig;
import flashdeal_api.payment.dto.PaymentCallbackResponse;
import flashdeal_api.payment.dto.VNPayCreatePaymentRequest;
import flashdeal_api.payment.dto.VNPayPaymentResponse;
import flashdeal_api.payment.entity.Payment;
import flashdeal_api.payment.entity.PaymentStatus;
import flashdeal_api.payment.model.event.PaymentSuccessfulEvent;
import flashdeal_api.payment.producer.PaymentEventProducer;
import flashdeal_api.payment.repository.PaymentRepository;
import flashdeal_api.payment.util.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final PaymentEventProducer paymentEventProducer;
    private final PaymentIdempotencyService paymentIdempotencyService;

    private static final DateTimeFormatter VNP_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Override
    @Transactional
    public VNPayPaymentResponse createVNPayPaymentUrl(VNPayCreatePaymentRequest request, HttpServletRequest servletRequest) {
        log.info("[VNPay] Khởi tạo yêu cầu thanh toán cho đơn hàng: [{}], số tiền: [{} đ]",
                request.getOrderCode(), request.getAmount());

        // 1. Tạo hoặc lấy bản ghi Payment trong DB
        Payment payment = paymentRepository.findByOrderCode(request.getOrderCode())
                .orElseGet(() -> {
                    String code = "PAY-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                    return Payment.builder()
                            .paymentCode(code)
                            .orderCode(request.getOrderCode())
                            .userId(request.getUserId() != null ? request.getUserId() : 1L)
                            .userEmail(request.getEmail())
                            .amount(request.getAmount())
                            .paymentMethod("VNPAY")
                            .status(PaymentStatus.PENDING)
                            .createdAt(LocalDateTime.now())
                            .build();
                });

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            payment.setUserEmail(request.getEmail());
        }
        paymentRepository.save(payment);

        // 2. Chuẩn bị các tham số cho VNPAY theo chuẩn 2.1.0
        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", vnpayConfig.getVersion());
        vnpParams.put("vnp_Command", vnpayConfig.getCommand());
        vnpParams.put("vnp_TmnCode", vnpayConfig.getTmnCode());

        // Số tiền nhân 100 theo quy định của VNPAY (Ví dụ 10,000 VND -> 1,000,000)
        long amountInCents = request.getAmount().multiply(BigDecimal.valueOf(100)).longValue();
        vnpParams.put("vnp_Amount", String.valueOf(amountInCents));
        vnpParams.put("vnp_CurrCode", "VND");

        // Gắn orderCode vào vnp_TxnRef để nhận diện khi VNPay redirect về
        vnpParams.put("vnp_TxnRef", request.getOrderCode());

        String orderInfo = (request.getOrderInfo() != null && !request.getOrderInfo().isBlank())
                ? request.getOrderInfo()
                : "Thanh toan don hang FlashSale " + request.getOrderCode();
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

        // Lớp 1 (DB Guard): Kiểm tra trong DB nếu đơn đã thanh toán thành công trước đó (chống F5 Reload trang)
        Optional<Payment> existingPaymentOpt = paymentRepository.findByOrderCode(orderCode);
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
            // 2. Tìm hoặc tạo bản ghi Payment
            Payment payment = existingPaymentOpt.orElseGet(() -> {
                String code = "PAY-" + System.currentTimeMillis();
                return Payment.builder()
                        .paymentCode(code)
                        .orderCode(orderCode)
                        .userId(1L)
                        .amount(BigDecimal.ZERO)
                        .createdAt(LocalDateTime.now())
                        .build();
            });

            // 3. Kiểm tra mã phản hồi (00 = Giao dịch thành công)
            if ("00".equals(responseCode)) {
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setVnpTransactionNo(transactionNo);
                payment.setBankCode(bankCode);
                payment.setPaidAt(LocalDateTime.now());
                if (amount.compareTo(BigDecimal.ZERO) > 0) {
                    payment.setAmount(amount);
                }
                paymentRepository.save(payment);

                log.info("[VNPay Callback] Giao dịch thành công cho đơn hàng: [{}]. Bắn sự kiện sang Kafka...", orderCode);

                // 4. Bắn sự kiện sang Apache Kafka để order-service và notification-service cùng tiêu thụ
                PaymentSuccessfulEvent event = PaymentSuccessfulEvent.builder()
                        .paymentCode(payment.getPaymentCode())
                        .orderCode(payment.getOrderCode())
                        .userId(payment.getUserId())
                        .userEmail(payment.getUserEmail())
                        .amount(payment.getAmount())
                        .paymentMethod("VNPAY")
                        .vnpTransactionNo(transactionNo)
                        .bankCode(bankCode)
                        .paidAt(payment.getPaidAt())
                        .build();

                paymentEventProducer.publishPaymentSuccessfulEvent(event);

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
                log.warn("[VNPay Callback] Giao dịch thất bại với mã lỗi: {}", responseCode);

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
    public PaymentCallbackResponse simulateSuccessPayment(String orderCode, String email) {
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
                    .amount(p != null ? p.getAmount() : BigDecimal.valueOf(100000))
                    .success(true)
                    .build();
        }

        try {
            Payment payment = existingOpt.orElseGet(() -> {
                String code = "PAY-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                return Payment.builder()
                        .paymentCode(code)
                        .orderCode(orderCode)
                        .userId(1L)
                        .userEmail(email)
                        .amount(BigDecimal.valueOf(100000))
                        .paymentMethod("VNPAY")
                        .status(PaymentStatus.PENDING)
                        .createdAt(LocalDateTime.now())
                        .build();
            });

            if (email != null && !email.isBlank()) {
                payment.setUserEmail(email);
            }

            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setVnpTransactionNo("SIM-" + System.currentTimeMillis());
            payment.setBankCode("NCB");
            payment.setPaidAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Bắn sự kiện sang Kafka
            PaymentSuccessfulEvent event = PaymentSuccessfulEvent.builder()
                    .paymentCode(payment.getPaymentCode())
                    .orderCode(payment.getOrderCode())
                    .userId(payment.getUserId())
                    .userEmail(payment.getUserEmail())
                    .amount(payment.getAmount())
                    .paymentMethod("VNPAY")
                    .vnpTransactionNo(payment.getVnpTransactionNo())
                    .bankCode("NCB")
                    .paidAt(payment.getPaidAt())
                    .build();

            paymentEventProducer.publishPaymentSuccessfulEvent(event);

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
}
