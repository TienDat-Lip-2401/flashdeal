package flashdeal_api.order.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    UNCATEGORIZED_EXCEPTION(9999, "Lỗi không xác định từ hệ thống", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Key thông điệp không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST(1002, "Dữ liệu yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(1004, "Vui lòng đăng nhập để thực hiện săn deal", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(1007, "Bạn không có quyền thực hiện hành động này", HttpStatus.FORBIDDEN),

    CAMPAIGN_NOT_FOUND(3001, "Chiến dịch Flash Sale không tồn tại", HttpStatus.NOT_FOUND),
    CAMPAIGN_NOT_ACTIVE(3002, "Chiến dịch Flash Sale hiện không trong thời gian mở bán", HttpStatus.BAD_REQUEST),
    PRODUCT_NOT_IN_CAMPAIGN(3003, "Sản phẩm không thuộc chiến dịch Flash Sale này", HttpStatus.BAD_REQUEST),
    OUT_OF_STOCK(3004, "Sản phẩm Flash Sale đã hết hàng", HttpStatus.CONFLICT),
    USER_ALREADY_PURCHASED(3005, "Bạn đã săn sản phẩm này rồi. Mỗi tài khoản chỉ được mua 1 lần!", HttpStatus.CONFLICT),
    ORDER_NOT_FOUND(3006, "Không tìm thấy đơn hàng", HttpStatus.NOT_FOUND),
    ORDER_CANNOT_BE_CANCELLED(3007, "Đơn hàng này không thể hủy", HttpStatus.BAD_REQUEST),
    CAMPAIGN_TIME_INVALID(3008, "Thời gian bắt đầu phải trước thời gian kết thúc", HttpStatus.BAD_REQUEST),
    PRODUCT_ALREADY_IN_CAMPAIGN(3009, "Sản phẩm đã tồn tại trong chiến dịch này", HttpStatus.BAD_REQUEST),
    REDIS_OPERATION_FAILED(3010, "Lỗi khi xử lý thao tác với Redis", HttpStatus.INTERNAL_SERVER_ERROR),
    ORDER_CANNOT_BE_CONFIRMED(3011, "Chỉ có thể xác nhận khi đơn hàng đang giao hoặc đang chuẩn bị hàng", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
