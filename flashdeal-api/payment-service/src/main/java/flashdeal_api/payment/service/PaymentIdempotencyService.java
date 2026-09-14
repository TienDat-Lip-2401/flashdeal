package flashdeal_api.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Service quản lý tính lũy đẳng (Idempotency) cho các giao dịch thanh toán trên Redis RAM.
 * Đảm bảo các callback từ VNPay và giả lập thanh toán không bị nhân đôi sự kiện.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentIdempotencyService {

    private final StringRedisTemplate stringRedisTemplate;

    public static final String STATUS_PROCESSING = "PROCESSING";
    public static final String STATUS_COMPLETED = "COMPLETED";

    /**
     * Thử chiếm quyền xử lý giao dịch bằng lệnh nguyên tử SETNX.
     *
     * @param key            Redis key (vd: idempotency:payment:FS-xxx)
     * @param lockTtlSeconds Thời gian khóa tạm thời khi giao dịch đang xử lý (mặc định 30s)
     * @return true nếu lấy khóa thành công (request đầu tiên), false nếu đã tồn tại (trùng lặp)
     */
    public boolean tryAcquire(String key, long lockTtlSeconds) {
        try {
            long ttl = lockTtlSeconds > 0 ? lockTtlSeconds : 30L;
            Boolean success = stringRedisTemplate.opsForValue()
                    .setIfAbsent(key, STATUS_PROCESSING, Duration.ofSeconds(ttl));
            boolean acquired = Boolean.TRUE.equals(success);
            if (acquired) {
                log.info("[PaymentIdempotency] Successfully acquired lock for key: {}, ttl: {}s", key, ttl);
            } else {
                log.warn("[PaymentIdempotency] Duplicate payment request detected for key: {}", key);
            }
            return acquired;
        } catch (Exception e) {
            log.error("[PaymentIdempotency] Error acquiring lock for key {}: {}", key, e.getMessage());
            // Fail-open: Nếu Redis tạm thời gặp sự cố mạng, cho phép request đi tiếp để không chặn giao dịch thanh toán
            return true;
        }
    }

    /**
     * Cập nhật trạng thái giao dịch sang COMPLETED sau khi đã lưu DB và bắn Kafka thành công.
     *
     * @param key                 Redis key
     * @param completedTtlSeconds Thời gian giữ khóa COMPLETED tính từ lúc hoàn tất (mặc định 120s)
     */
    public void markCompleted(String key, long completedTtlSeconds) {
        try {
            long ttl = completedTtlSeconds > 0 ? completedTtlSeconds : 120L;
            stringRedisTemplate.opsForValue().set(key, STATUS_COMPLETED, Duration.ofSeconds(ttl));
            log.info("[PaymentIdempotency] Marked key as COMPLETED: {}, ttl: {}s", key, ttl);
        } catch (Exception e) {
            log.error("[PaymentIdempotency] Error marking COMPLETED for key {}: {}", key, e.getMessage());
        }
    }

    /**
     * Kiểm tra nhanh xem giao dịch cho key này đã hoàn tất chưa.
     */
    public boolean isCompleted(String key) {
        try {
            String val = stringRedisTemplate.opsForValue().get(key);
            return STATUS_COMPLETED.equalsIgnoreCase(val);
        } catch (Exception e) {
            log.error("[PaymentIdempotency] Error checking isCompleted for key {}: {}", key, e.getMessage());
            return false;
        }
    }

    /**
     * Giải phóng khóa (xóa key) khi xử lý gặp lỗi để có thể thử lại.
     *
     * @param key Redis key
     */
    public void release(String key) {
        try {
            Boolean deleted = stringRedisTemplate.delete(key);
            log.info("[PaymentIdempotency] Released lock for key: {}, result: {}", key, deleted);
        } catch (Exception e) {
            log.error("[PaymentIdempotency] Error releasing lock for key {}: {}", key, e.getMessage());
        }
    }
}
