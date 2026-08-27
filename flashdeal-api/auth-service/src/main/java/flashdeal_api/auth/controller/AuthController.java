package flashdeal_api.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import flashdeal_api.auth.model.*;
import flashdeal_api.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication & User Controller", description = "APIs Dang ky, Dang nhap, Ho so, Refresh Token va Dang xuat")
public class AuthController {

    private final AuthService authService;
    private final ObjectMapper objectMapper;

    @PostMapping("/register")
    @Operation(summary = "Dang ky tai khoan moi", description = "Tao tai khoan Customer moi va ban su kien vao Kafka")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.builder()
                        .code(1000)
                        .message("Dang ky tai khoan thanh cong")
                        .data(objectMapper.valueToTree(response))
                        .build());
    }

    @PostMapping("/login")
    @Operation(summary = "Dang nhap tai khoan", description = "Xac thuc email/mat khau va cap phat cap Access Token + Refresh Token")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.builder()
                .code(1000)
                .message("Dang nhap thanh cong")
                .data(objectMapper.valueToTree(response))
                .build());
    }

    @GetMapping("/profile")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Lay thong tin ho so ca nhan", description = "Lay thong tin chi tiet cua nguoi dung dang dang nhap")
    public ResponseEntity<ApiResponse> getProfile(@AuthenticationPrincipal Long userId) {
        UserProfileResponse response = authService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.builder()
                .code(1000)
                .message("Lay thong tin ho so thanh cong")
                .data(objectMapper.valueToTree(response))
                .build());
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Cap lai Access Token", description = "Dung Refresh Token hop le tren Redis de cap lai Access Token moi")
    public ResponseEntity<ApiResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.builder()
                .code(1000)
                .message("Cap lai Token thanh cong")
                .data(objectMapper.valueToTree(response))
                .build());
    }

    @PostMapping("/logout")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Dang xuat tai khoan", description = "Huy Refresh Token va dua Access Token vao Redis Blacklist")
    public ResponseEntity<ApiResponse> logout(HttpServletRequest request,
                                             @AuthenticationPrincipal Long userId) {
        String token = extractTokenFromRequest(request);
        authService.logout(token, userId);
        return ResponseEntity.ok(ApiResponse.builder()
                .code(1000)
                .message("Dang xuat thanh cong")
                .build());
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
