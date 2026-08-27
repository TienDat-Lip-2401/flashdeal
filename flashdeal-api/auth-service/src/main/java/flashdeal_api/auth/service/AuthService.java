package flashdeal_api.auth.service;

import flashdeal_api.auth.model.*;

public interface AuthService {

    UserResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserProfileResponse getProfile(Long userId);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(String token, Long userId);
}
