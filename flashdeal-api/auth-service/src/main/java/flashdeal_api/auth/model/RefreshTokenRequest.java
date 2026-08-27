package flashdeal_api.auth.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu cấp lại Access Token qua Refresh Token")
public class RefreshTokenRequest {

    @NotBlank(message = "REFRESH_TOKEN_INVALID")
    @Schema(description = "Chuỗi Refresh Token", example = "d9b2d8e4-8f92-4f3a-9382-7e1a3b4c5d6e")
    private String refreshToken;
}
