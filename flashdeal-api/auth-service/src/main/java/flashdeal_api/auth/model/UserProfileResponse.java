package flashdeal_api.auth.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Thông tin hồ sơ cá nhân người dùng")
public class UserProfileResponse implements Serializable {

    @Schema(description = "ID người dùng", example = "1")
    private Long id;

    @Schema(description = "Email người dùng", example = "customer@gmail.com")
    private String email;

    @Schema(description = "Họ và tên", example = "Nguyễn Văn A")
    private String fullName;

    @Schema(description = "Số điện thoại", example = "0988888888")
    private String phone;

    @Schema(description = "Địa chỉ giao hàng", example = "123 Cầu Giấy, Hà Nội")
    private String address;

    @Schema(description = "Vai trò", example = "ROLE_CUSTOMER")
    private String role;

    @Schema(description = "Trạng thái tài khoản", example = "ACTIVE")
    private String status;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Schema(description = "Ngày tạo tài khoản")
    private LocalDateTime createdAt;
}
