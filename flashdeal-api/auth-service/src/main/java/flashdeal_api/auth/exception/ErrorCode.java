package flashdeal_api.auth.exception;

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
    // 1. LỖI XÁC THỰC & BẢO MẬT (1001 - 1009)
    // ==========================================
    INVALID_KEY(1001, "Invalid message key", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1004, "Unauthenticated. Please login to continue", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1005, "You do not have permission to access this resource", HttpStatus.FORBIDDEN),
    INVALID_CREDENTIALS(1006, "Incorrect email or password", HttpStatus.UNAUTHORIZED),
    USER_BLOCKED(1007, "User account is blocked or inactive", HttpStatus.FORBIDDEN),
    INVALID_TOKEN(1008, "Token is invalid or revoked", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED(1009, "Token has expired", HttpStatus.UNAUTHORIZED),

    // ==========================================
    // 2. DTO VALIDATION - AUTH & USER (1010 - 1019)
    // ==========================================
    EMAIL_BLANK(1010, "Email is required", HttpStatus.BAD_REQUEST),
    EMAIL_INVALID(1011, "Email format is invalid", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1012, "Email already exists", HttpStatus.BAD_REQUEST),
    PASSWORD_BLANK(1013, "Password is required", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1014, "Password must be at least 6 characters", HttpStatus.BAD_REQUEST),
    FULLNAME_BLANK(1016, "Full name is required", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1017, "User not found", HttpStatus.NOT_FOUND),
    REFRESH_TOKEN_INVALID(1018, "Refresh token is invalid or expired. Please login again", HttpStatus.UNAUTHORIZED),
    LOGOUT_FAILED(1019, "Logout failed", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatusCode httpStatusCode;

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }
}
