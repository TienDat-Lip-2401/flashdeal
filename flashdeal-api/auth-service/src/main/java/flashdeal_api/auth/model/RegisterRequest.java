package flashdeal_api.auth.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu đăng ký tài khoản mới")
public class RegisterRequest {

    @NotBlank(message = "EMAIL_BLANK")
    @Email(message = "EMAIL_INVALID")
    @Schema(description = "Email người dùng", example = "customer@gmail.com")
    private String email;

    @NotBlank(message = "PASSWORD_BLANK")
    @Size(min = 6, message = "PASSWORD_INVALID")
    @Schema(description = "Mật khẩu (tối thiểu 6 ký tự)", example = "123456")
    private String password;

    @NotBlank(message = "FULLNAME_BLANK")
    @Schema(description = "Họ và tên", example = "Nguyễn Văn A")
    private String fullName;

    @Schema(description = "Số điện thoại liên hệ", example = "0988888888")
    private String phone;

    @Schema(description = "Địa chỉ giao hàng", example = "123 Cầu Giấy, Hà Nội")
    private String address;
}
