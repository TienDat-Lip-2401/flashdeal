package flashdeal_api.auth.exception;

import flashdeal_api.auth.model.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(value = AppException.class)
    public ResponseEntity<ApiResponse> handleAppException(AppException e) {
        ErrorCode errorCode = e.getErrorCode();
        return ResponseEntity.status(errorCode.getHttpStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build());
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidationException(MethodArgumentNotValidException e) {
        String enumKey = e.getFieldError() != null ? e.getFieldError().getDefaultMessage() : "INVALID_KEY";
        ErrorCode errorCode = ErrorCode.INVALID_KEY;

        try {
            if (enumKey != null) {
                errorCode = ErrorCode.valueOf(enumKey);
            }
        } catch (IllegalArgumentException ex) {
            log.warn("Validation error key not mapped: {}", enumKey);
        }

        return ResponseEntity.status(errorCode.getHttpStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build());
    }

    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<ApiResponse> handleGeneralException(Exception e) {
        log.error("Unhandled Exception: ", e);
        return ResponseEntity.internalServerError()
                .body(ApiResponse.builder()
                        .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                        .message(e.getMessage() != null ? e.getMessage() : ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage())
                        .build());
    }
}
