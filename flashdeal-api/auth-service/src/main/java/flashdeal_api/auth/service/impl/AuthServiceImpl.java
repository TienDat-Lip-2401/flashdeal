package flashdeal_api.auth.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import flashdeal_api.auth.entity.User;
import flashdeal_api.auth.entity.UserRole;
import flashdeal_api.auth.entity.UserStatus;
import flashdeal_api.auth.exception.AppException;
import flashdeal_api.auth.exception.ErrorCode;
import flashdeal_api.auth.model.*;
import flashdeal_api.auth.producer.UserEventProducer;
import flashdeal_api.auth.repository.UserRepository;
import flashdeal_api.auth.security.JwtTokenProvider;
import flashdeal_api.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final StringRedisTemplate redisTemplate;
    private final UserEventProducer userEventProducer;
    private final ObjectMapper objectMapper;

    @Value("${jwt.access-token-expiration-ms:3600000}")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    private static final String REDIS_REFRESH_TOKEN_PREFIX = "auth:refresh:token:";
    private static final String REDIS_REFRESH_USER_PREFIX = "auth:refresh:user:";
    private static final String REDIS_BLACKLIST_PREFIX = "auth:blacklist:";

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .role(UserRole.ROLE_CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);

        // Ban su kien UserRegisteredEvent vao Kafka de Notification Service gui email
        try {
            userEventProducer.publishUserRegisteredEvent(savedUser);
        } catch (Exception e) {
            log.error("Failed to publish UserRegisteredEvent for user: {}", savedUser.getId(), e);
        }

        return mapToUserResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        return generateAuthResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String tokenKey = REDIS_REFRESH_TOKEN_PREFIX + request.getRefreshToken();
        String userIdStr = redisTemplate.opsForValue().get(tokenKey);

        if (userIdStr == null) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        Long userId = Long.parseLong(userIdStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        // Xoa Refresh Token cu de xoay vong (Token Rotation)
        redisTemplate.delete(tokenKey);
        redisTemplate.delete(REDIS_REFRESH_USER_PREFIX + userId);

        // Sinh cap Token moi
        return generateAuthResponse(user);
    }

    @Override
    public void logout(String token, Long userId) {
        try {
            // 1. Xoa Refresh Token tren Redis
            if (userId != null) {
                String oldRefreshToken = redisTemplate.opsForValue().get(REDIS_REFRESH_USER_PREFIX + userId);
                if (oldRefreshToken != null) {
                    redisTemplate.delete(REDIS_REFRESH_TOKEN_PREFIX + oldRefreshToken);
                }
                redisTemplate.delete(REDIS_REFRESH_USER_PREFIX + userId);
            }

            // 2. Dua Access Token vao Blacklist tren Redis
            if (token != null) {
                long remainingTimeMs = jwtTokenProvider.getRemainingTimeMs(token);
                if (remainingTimeMs > 0) {
                    redisTemplate.opsForValue().set(
                            REDIS_BLACKLIST_PREFIX + token,
                            "LOGGED_OUT",
                            remainingTimeMs,
                            TimeUnit.MILLISECONDS
                    );
                }
            }
        } catch (Exception e) {
            log.error("Error during logout: {}", e.getMessage());
            throw new AppException(ErrorCode.LOGOUT_FAILED);
        }
    }

    private AuthResponse generateAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = UUID.randomUUID().toString();

        // Luu Refresh Token vao Redis voi TTL cau hinh tu YAML
        redisTemplate.opsForValue().set(
                REDIS_REFRESH_TOKEN_PREFIX + refreshToken,
                String.valueOf(user.getId()),
                refreshTokenExpirationMs,
                TimeUnit.MILLISECONDS
        );

        redisTemplate.opsForValue().set(
                REDIS_REFRESH_USER_PREFIX + user.getId(),
                refreshToken,
                refreshTokenExpirationMs,
                TimeUnit.MILLISECONDS
        );

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(accessTokenExpirationMs / 1000)
                .user(mapToUserResponse(user))
                .build();
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
