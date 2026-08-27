package flashdeal_api.auth.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Phản hồi xác thực Đăng nhập & Cấp lại Token")
public class AuthResponse {

    @Schema(description = "Access Token JWT dùng để xác thực các request", example = "eyJhbGciOiJIUzI1NiJ9...")
    private String accessToken;

    @Schema(description = "Refresh Token dùng để cấp lại Access Token mới", example = "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    private String refreshToken;

    @Builder.Default
    @Schema(description = "Loại Token", example = "Bearer")
    private String tokenType = "Bearer";

    @Schema(description = "Thời gian sống của Access Token tính bằng giây", example = "3600")
    private long expiresIn;

    @Schema(description = "Thông tin cơ bản của người dùng")
    private UserResponse user;
}
