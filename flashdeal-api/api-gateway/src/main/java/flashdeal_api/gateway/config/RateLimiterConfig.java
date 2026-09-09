package flashdeal_api.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;

@Configuration
public class RateLimiterConfig {

    /**
     * KeyResolver định danh người dùng theo địa chỉ Client IP.
     * Ưu tiên kiểm tra header X-Forwarded-For (khi qua proxy/load balancer),
     * nếu không có thì fallback về RemoteAddress của socket.
     */
    @Bean
    @Primary
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String clientIp = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
            if (clientIp != null && !clientIp.isBlank()) {
                String[] ips = clientIp.split(",");
                return Mono.just(ips[0].trim());
            }

            InetSocketAddress remoteAddress = exchange.getRequest().getRemoteAddress();
            if (remoteAddress != null && remoteAddress.getAddress() != null) {
                return Mono.just(remoteAddress.getAddress().getHostAddress());
            }

            return Mono.just("anonymous");
        };
    }
}
