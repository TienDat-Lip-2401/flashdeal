package flashdeal_api.order.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Service quản lý tính lũy đẳng (Idempotency) dựa trên Redis RAM.
 * Đảm bảo các yêu cầu trùng lặp bị chặn đứng ngay từ tầng ngoài cùng (< 1.5ms).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final StringRedisTemplate stringRedisTemplate;

    public static final String STATUS_PROCESSING = "PROCESSING";
    public static final String STATUS_COMPLETED = "COMPLETED";

    /**
     * Thử chiếm quyền thực hiện request bằng lệnh nguyên tử SETNX (Set if Not Exists).
     *
     * @param key            Redis key (vd: idempotency:order:xxx)
     * @param lockTtlSeconds Thời gian khóa tạm thời cho trạng thái PROCESSING (mặc định 30s)
     * @return true nếu lấy khóa thành công (request đầu tiên), false nếu đã tồn tại (trùng lặp)
     */
    public boolean tryAcquire(String key, long lockTtlSeconds) {
        try {
            long ttl = lockTtlSeconds > 0 ? lockTtlSeconds : 30L;
            Boolean success = stringRedisTemplate.opsForValue()
                    .setIfAbsent(key, STATUS_PROCESSING, Duration.ofSeconds(ttl));
            boolean acquired = Boolean.TRUE.equals(success);
            if (acquired) {
                log.info("[Idempotency] Successfully acquired lock for key: {}, ttl: {}s", key, ttl);
            } else {
                log.warn("[Idempotency] Duplicate request detected for key: {}", key);
            }
            return acquired;
        } catch (Exception e) {
            log.error("[Idempotency] Error acquiring lock for key {}: {}", key, e.getMessage());
            // Fail-open: Nếu Redis tạm thời gặp lỗi mạng, cho phép request đi tiếp để không chặn nhầm khách hàng
            return true;
        }
    }

    /**
     * Cập nhật trạng thái yêu cầu sang COMPLETED sau khi nghiệp vụ hoàn tất thành công.
     *
     * @param key                 Redis key
     * @param completedTtlSeconds Thời gian giữ khóa COMPLETED tính từ lúc hoàn tất (mặc định 120s)
     */
    public void markCompleted(String key, long completedTtlSeconds) {
        try {
            long ttl = completedTtlSeconds > 0 ? completedTtlSeconds : 120L;
            stringRedisTemplate.opsForValue().set(key, STATUS_COMPLETED, Duration.ofSeconds(ttl));
            log.info("[Idempotency] Marked key as COMPLETED: {}, ttl: {}s", key, ttl);
        } catch (Exception e) {
            log.error("[Idempotency] Error marking COMPLETED for key {}: {}", key, e.getMessage());
        }
    }

    /**
     * Giải phóng khóa (xóa key) khi nghiệp vụ gặp lỗi (hết hàng, dữ liệu không hợp lệ...)
     * để người dùng có thể thực hiện lại ngay mà không bị chặn oan.
     *
     * @param key Redis key
     */
    public void release(String key) {
        try {
            Boolean deleted = stringRedisTemplate.delete(key);
            log.info("[Idempotency] Released lock for key: {}, result: {}", key, deleted);
        } catch (Exception e) {
            log.error("[Idempotency] Error releasing lock for key {}: {}", key, e.getMessage());
        }
    }

    /**
     * Lấy trạng thái hiện tại của key trong Redis (PROCESSING, COMPLETED hoặc null).
     *
     * @param key Redis key
     * @return Chuỗi trạng thái hoặc null nếu key không tồn tại / hết hạn
     */
    public String getStatus(String key) {
        try {
            return stringRedisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.error("[Idempotency] Error reading status for key {}: {}", key, e.getMessage());
            return null;
        }
    }
}
