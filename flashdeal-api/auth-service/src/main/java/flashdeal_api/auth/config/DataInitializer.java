package flashdeal_api.auth.config;

import flashdeal_api.auth.entity.User;
import flashdeal_api.auth.entity.UserRole;
import flashdeal_api.auth.entity.UserStatus;
import flashdeal_api.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Khoi tao tai khoan Quan Tri Vien mac dinh (ROLE_ADMIN) neu chua ton tai
        if (!userRepository.existsByEmail("admin@flashdeal.vn")) {
            User admin = User.builder()
                    .email("admin@flashdeal.vn")
                    .passwordHash(passwordEncoder.encode("Admin@123"))
                    .fullName("Tổng Quản Trị Hệ Thống")
                    .phone("0988668899")
                    .address("Tòa nhà VinUniversity, Vinhomes Ocean Park, Gia Lâm, Hà Nội")
                    .role(UserRole.ROLE_ADMIN)
                    .status(UserStatus.ACTIVE)
                    .build();
            userRepository.save(admin);
            log.info("Initialized default ADMIN user: admin@flashdeal.vn / Admin@123 [ROLE_ADMIN]");
        }

        // Khoi tao tai khoan Khach Hang mau (ROLE_CUSTOMER) neu chua ton tai
        if (!userRepository.existsByEmail("customer@flashdeal.vn")) {
            User customer = User.builder()
                    .email("customer@flashdeal.vn")
                    .passwordHash(passwordEncoder.encode("Password@123"))
                    .fullName("Nguyễn Văn Khách")
                    .phone("0912345678")
                    .address("Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội")
                    .role(UserRole.ROLE_CUSTOMER)
                    .status(UserStatus.ACTIVE)
                    .build();
            userRepository.save(customer);
            log.info("Initialized default CUSTOMER user: customer@flashdeal.vn / Password@123 [ROLE_CUSTOMER]");
        }
    }
}
