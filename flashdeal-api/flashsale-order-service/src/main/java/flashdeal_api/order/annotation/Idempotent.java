package flashdeal_api.order.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation đánh dấu các API cần đảm bảo tính lũy đẳng (Idempotency).
 * Hỗ trợ mô hình lai: Ưu tiên lấy Idempotency-Key từ Header, 
 * tự động Fallback băm dấu vân tay request nếu Client không truyền.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Idempotent {

    /**
     * Tiền tố định danh nghiệp vụ cho Redis key (vd: "flashsale_order")
     */
    String prefix() default "order";

    /**
     * Tên Header chứa Idempotency-Key từ Client truyền lên
     */
    String headerName() default "Idempotency-Key";

    /**
     * Thời gian khóa tạm thời cho trạng thái PROCESSING (giây), mặc định 30s
     */
    long lockTtlSeconds() default 30;

    /**
     * Thời gian lưu giữ trạng thái COMPLETED sau khi thành công (giây), mặc định 120s
     */
    long completedTtlSeconds() default 120;
}
