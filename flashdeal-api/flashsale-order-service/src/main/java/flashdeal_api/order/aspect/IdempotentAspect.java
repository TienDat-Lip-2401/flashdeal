package flashdeal_api.order.aspect;

import flashdeal_api.order.annotation.Idempotent;
import flashdeal_api.order.exception.AppException;
import flashdeal_api.order.exception.ErrorCode;
import flashdeal_api.order.model.dto.FlashSaleOrderRequest;
import flashdeal_api.order.service.IdempotencyService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.DigestUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * Aspect chặn tự động các request trùng lặp (Idempotency Interceptor).
 * Áp dụng mô hình lai (Hybrid Pattern):
 * 1. Ưu tiên lấy Idempotency-Key từ HTTP Header.
 * 2. Tự động băm MD5(userId + campaignId + productId) làm phao cứu sinh nếu Header trống.
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class IdempotentAspect {

    private final IdempotencyService idempotencyService;

    @Around("@annotation(idempotent)")
    public Object handleIdempotent(ProceedingJoinPoint joinPoint, Idempotent idempotent) throws Throwable {
        String extractedKey = resolveIdempotencyKey(joinPoint, idempotent);
        String redisKey = "idempotency:" + idempotent.prefix() + ":" + extractedKey;

        log.info("[IdempotentAspect] Checking lock for key: {}", redisKey);

        // 1. Thử chiếm khóa nguyên tử trong Redis (SETNX với TTL tạm thời)
        boolean acquired = idempotencyService.tryAcquire(redisKey, idempotent.lockTtlSeconds());
        if (!acquired) {
            log.warn("[IdempotentAspect] Conflict! Duplicate request blocked for key: {}", redisKey);
            throw new AppException(ErrorCode.DUPLICATE_REQUEST);
        }

        try {
            // 2. Cho phép request chạy tiếp vào Controller nghiệp vụ
            Object result = joinPoint.proceed();

            // 3. Nghiệp vụ thành công -> Chuyển trạng thái sang COMPLETED (lưu tiếp trong completedTtlSeconds)
            idempotencyService.markCompleted(redisKey, idempotent.completedTtlSeconds());
            return result;
        } catch (Throwable ex) {
            // 4. Nếu có lỗi nghiệp vụ (hết hàng, dữ liệu không hợp lệ...) -> Xóa khóa để người dùng thao tác lại
            log.error("[IdempotentAspect] Request failed with exception: {}. Releasing lock for key: {}",
                    ex.getMessage(), redisKey);
            idempotencyService.release(redisKey);
            throw ex;
        }
    }

    /**
     * Trích xuất Idempotency Key theo Mô hình Lai (Hybrid Pattern)
     */
    private String resolveIdempotencyKey(ProceedingJoinPoint joinPoint, Idempotent idempotent) {
        // Ưu tiên 1: Đọc từ Header của Client
        HttpServletRequest request = getCurrentHttpRequest();
        if (request != null) {
            String clientKey = request.getHeader(idempotent.headerName());
            if (StringUtils.hasText(clientKey)) {
                log.info("[IdempotentAspect] Extracted key from header [{}]: {}", idempotent.headerName(), clientKey.trim());
                return clientKey.trim();
            }
        }

        // Ưu tiên 2 (Phao cứu sinh): Băm dấu vân tay request (userId + campaignId + productId)
        Object[] args = joinPoint.getArgs();
        Long userId = extractUserId(args);
        FlashSaleOrderRequest orderRequest = extractOrderRequest(args);

        if (userId != null && orderRequest != null && orderRequest.getCampaignId() != null && orderRequest.getProductId() != null) {
            String fingerprint = "user:" + userId + ":campaign:" + orderRequest.getCampaignId() + ":product:" + orderRequest.getProductId();
            String md5Hash = DigestUtils.md5DigestAsHex(fingerprint.getBytes(StandardCharsets.UTF_8));
            log.info("[IdempotentAspect] No header found. Generated fallback MD5 key [{}] from fingerprint [{}]", md5Hash, fingerprint);
            return md5Hash;
        }

        // Fallback mở rộng cho các hàm nghiệp vụ khác (băm danh sách tham số)
        String fallbackString = (userId != null ? "user:" + userId : "guest") + ":" + Arrays.deepToString(args);
        return DigestUtils.md5DigestAsHex(fallbackString.getBytes(StandardCharsets.UTF_8));
    }

    private HttpServletRequest getCurrentHttpRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    private Long extractUserId(Object[] args) {
        for (Object arg : args) {
            if (arg instanceof Long uid) {
                return uid;
            }
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long uid) {
            return uid;
        }
        return null;
    }

    private FlashSaleOrderRequest extractOrderRequest(Object[] args) {
        for (Object arg : args) {
            if (arg instanceof FlashSaleOrderRequest orderReq) {
                return orderReq;
            }
        }
        return null;
    }
}
