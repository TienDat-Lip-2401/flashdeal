package flashdeal_api.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {

    // ==========================================
    // 0. LỖI HỆ THỐNG & DỰ PHÒNG (1111)
    // ==========================================
    UNCATEGORIZED_EXCEPTION(1111, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),

    // ==========================================
    // 1. LỖI CHUNG & BẢO MẬT (1001 - 1009)
    // ==========================================
    INVALID_KEY(1001, "Invalid message key", HttpStatus.BAD_REQUEST),
    RESOURCE_EXISTED(1002, "Resource already exists", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_EXISTED(1003, "Resource does not exist", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1004, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1005, "You do not have permission", HttpStatus.FORBIDDEN),

    // ==========================================
    // 2. DTO VALIDATION - AUTH & USER (1010 - 1019)
    // ==========================================
    EMAIL_BLANK(1010, "Email is required", HttpStatus.BAD_REQUEST),
    EMAIL_INVALID(1011, "Email format is invalid", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1012, "Email already exists", HttpStatus.BAD_REQUEST),
    PASSWORD_BLANK(1013, "Password is required", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1014, "Password must be at least 6 characters", HttpStatus.BAD_REQUEST),
    CONFIRM_PASSWORD_INVALID(1015, "Confirm password does not match", HttpStatus.BAD_REQUEST),
    FULLNAME_BLANK(1016, "Full name is required", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1017, "User not found", HttpStatus.NOT_FOUND),

    // ==========================================
    // 3. DTO VALIDATION - CATEGORY (1020 - 1029)
    // ==========================================
    CATEGORY_NAME_BLANK(1020, "Category name is required", HttpStatus.BAD_REQUEST),
    CATEGORY_DISPLAY_ORDER_INVALID(1021, "Display order must be greater than or equal to 0", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_FOUND(1022, "Category not found", HttpStatus.NOT_FOUND),
    CATEGORY_SLUG_EXISTED(1023, "Category slug already exists", HttpStatus.BAD_REQUEST),
    CANNOT_DELETE_DEFAULT_CATEGORY(1024, "Cannot delete default Uncategorized category", HttpStatus.BAD_REQUEST),

    // ==========================================
    // 4. DTO VALIDATION - PRODUCT (1030 - 1039)
    // ==========================================
    PRODUCT_NAME_BLANK(1030, "Product name is required", HttpStatus.BAD_REQUEST),
    CATEGORY_ID_REQUIRED(1031, "Category ID is required", HttpStatus.BAD_REQUEST),
    PRODUCT_PRICE_REQUIRED(1032, "Product price is required", HttpStatus.BAD_REQUEST),
    PRODUCT_PRICE_INVALID(1033, "Product price must be greater than 0", HttpStatus.BAD_REQUEST),
    PRODUCT_STOCK_REQUIRED(1034, "Product total stock is required", HttpStatus.BAD_REQUEST),
    PRODUCT_STOCK_INVALID(1035, "Product stock must be greater than or equal to 0", HttpStatus.BAD_REQUEST),
    PRODUCT_NOT_FOUND(1036, "Product not found", HttpStatus.NOT_FOUND),
    PRODUCT_SLUG_EXISTED(1037, "Product slug already exists", HttpStatus.BAD_REQUEST),
    PRODUCT_OUT_OF_STOCK(1038, "Product is out of stock", HttpStatus.BAD_REQUEST),

    // ==========================================
    // 5. DTO VALIDATION - FLASH SALE (1040 - 1059)
    // ==========================================
    FLASHSALE_TITLE_BLANK(1040, "Flash sale title is required", HttpStatus.BAD_REQUEST),
    FLASHSALE_START_TIME_REQUIRED(1041, "Start time is required", HttpStatus.BAD_REQUEST),
    FLASHSALE_END_TIME_REQUIRED(1042, "End time is required", HttpStatus.BAD_REQUEST),
    PRODUCT_ID_REQUIRED(1043, "Product ID is required", HttpStatus.BAD_REQUEST),
    FLASHSALE_PRICE_REQUIRED(1044, "Flash sale price is required", HttpStatus.BAD_REQUEST),
    FLASHSALE_PRICE_INVALID(1045, "Flash sale price must be greater than 0", HttpStatus.BAD_REQUEST),
    FLASHSALE_QUANTITY_REQUIRED(1046, "Flash sale quantity is required", HttpStatus.BAD_REQUEST),
    FLASHSALE_QUANTITY_INVALID(1047, "Flash sale quantity must be at least 1", HttpStatus.BAD_REQUEST),
    USER_LIMIT_INVALID(1048, "User purchase limit must be at least 1", HttpStatus.BAD_REQUEST),
    FLASHSALE_NOT_FOUND(1049, "Flash sale campaign not found", HttpStatus.NOT_FOUND),
    FLASHSALE_ITEM_NOT_FOUND(1050, "Flash sale item not found", HttpStatus.NOT_FOUND),
    FLASHSALE_NOT_IN_PROGRESS(1051, "Flash sale is not in progress", HttpStatus.BAD_REQUEST),
    FLASHSALE_OUT_OF_STOCK(1052, "Flash sale item is out of stock", HttpStatus.BAD_REQUEST),
    FLASHSALE_USER_LIMIT_EXCEEDED(1053, "User purchase limit exceeded for this item", HttpStatus.BAD_REQUEST),

    // ==========================================
    // 6. DTO VALIDATION - ORDER & PAYMENT (1060 - 1079)
    // ==========================================
    ORDER_ITEMS_EMPTY(1060, "Order must contain at least one item", HttpStatus.BAD_REQUEST),
    ORDER_ITEM_QUANTITY_INVALID(1061, "Order item quantity must be at least 1", HttpStatus.BAD_REQUEST),
    PAYMENT_METHOD_REQUIRED(1062, "Payment method is required", HttpStatus.BAD_REQUEST),
    ORDER_NOT_FOUND(1063, "Order not found", HttpStatus.NOT_FOUND),
    ORDER_CANNOT_BE_CANCELLED(1064, "Order cannot be cancelled in its current state", HttpStatus.BAD_REQUEST),
    PAYMENT_FAILED(1065, "Payment transaction failed", HttpStatus.BAD_REQUEST),

    // ==========================================
    // 7. RATE LIMIT & BOT (1080 - 1089)
    // ==========================================
    RATE_LIMIT_EXCEEDED(1080, "Too many requests. Please try again later", HttpStatus.TOO_MANY_REQUESTS);

    private final int code;
    private final String message;
    private final HttpStatusCode httpStatusCode;

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }
}