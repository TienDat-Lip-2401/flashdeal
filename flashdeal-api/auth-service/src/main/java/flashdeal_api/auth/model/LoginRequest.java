package flashdeal_api.auth.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu đăng nhập")
public class LoginRequest {

    @NotBlank(message = "EMAIL_BLANK")
    @Email(message = "EMAIL_INVALID")
    @Schema(description = "Email đăng nhập", example = "customer@gmail.com")
    private String email;

    @NotBlank(message = "PASSWORD_BLANK")
    @Schema(description = "Mật khẩu", example = "123456")
    private String password;
}
