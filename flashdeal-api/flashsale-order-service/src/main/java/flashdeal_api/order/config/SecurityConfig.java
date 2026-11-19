package flashdeal_api.order.config;

import flashdeal_api.order.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public Swagger & Health endpoints
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/actuator/**"
                        ).permitAll()

                        // Trang loi noi bo cua Spring Boot: de loi tra ve dung ma (404, 500) thay vi 403
                        .requestMatchers("/error").permitAll()

                        // Public: xem chien dich Flash Sale & san pham dang mo ban
                        .requestMatchers(HttpMethod.GET, "/flash-sales/campaigns", "/flash-sales/campaigns/**").permitAll()

                        // Admin: tao/xoa chien dich, them san pham vao chien dich
                        .requestMatchers("/flash-sales/campaigns", "/flash-sales/campaigns/**").hasRole("ADMIN")

                        // Admin: quan tri don hang. Phai dat TRUOC rule authenticated() ben duoi,
                        // vi Spring dung o rule khop dau tien
                        .requestMatchers("/flash-sales/orders/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/flash-sales/orders/cancel-expired").hasRole("ADMIN")

                        // Authenticated: San Deal & xem don hang ca nhan
                        .requestMatchers(HttpMethod.POST, "/flash-sales/orders/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/flash-sales/orders/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/flash-sales/orders/**").authenticated()

                        // Mac dinh chan: endpoint moi phai duoc khai bao ro rang o tren
                        .anyRequest().denyAll()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
