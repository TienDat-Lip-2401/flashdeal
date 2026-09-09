package flashdeal_api.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Component
public class RateLimitResponseFilter implements GlobalFilter, Ordered {

    private static final String RATE_LIMIT_JSON =
            "{\"code\":1080,\"message\":\"Quá nhiều yêu cầu đến dịch vụ. Vui lòng thử lại sau!\",\"success\":false}";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpResponse originalResponse = exchange.getResponse();

        ServerHttpResponseDecorator decoratedResponse = new ServerHttpResponseDecorator(originalResponse) {
            @Override
            public Mono<Void> setComplete() {
                if (getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                    getHeaders().setContentType(MediaType.APPLICATION_JSON);
                    getHeaders().set("Retry-After", "30");
                    byte[] bytes = RATE_LIMIT_JSON.getBytes(StandardCharsets.UTF_8);
                    DataBuffer buffer = bufferFactory().wrap(bytes);
                    return super.writeWith(Mono.just(buffer));
                }
                return super.setComplete();
            }
        };

        return chain.filter(exchange.mutate().response(decoratedResponse).build());
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
