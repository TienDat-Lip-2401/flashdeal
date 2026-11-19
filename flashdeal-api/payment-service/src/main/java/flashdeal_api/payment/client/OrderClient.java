package flashdeal_api.payment.client;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

/**
 * Hoi order-service thong tin don hang bang chinh token cua nguoi goi.
 * Order-service chi tra don cho chu don (hoac admin), nen ket qua vua la du lieu that
 * (userId, tong tien, trang thai) vua la buoc kiem tra quyen.
 */
@Slf4j
@Component
public class OrderClient {

    private final RestClient restClient;

    public OrderClient(@Value("${order-service.url}") String orderServiceUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(5000);
        this.restClient = RestClient.builder()
                .baseUrl(orderServiceUrl)
                .requestFactory(factory)
                .build();
    }

    public OrderInfo getOrder(String orderCode, String authorizationHeader) {
        try {
            JsonNode body = restClient.get()
                    .uri("/flash-sales/orders/{orderCode}", orderCode)
                    .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                    .retrieve()
                    .body(JsonNode.class);

            JsonNode data = body == null ? null : body.get("data");
            if (data == null || data.isNull()) {
                throw notFound();
            }
            return new OrderInfo(
                    data.path("orderCode").asText(),
                    data.path("userId").asLong(),
                    data.path("totalAmount").decimalValue(),
                    data.path("status").asText());
        } catch (HttpClientErrorException ex) {
            // 403/404 tu order-service: khong phai chu don hoac don khong ton tai -> deu tra 404
            log.warn("[OrderClient] Khong lay duoc don [{}]: {}", orderCode, ex.getStatusCode());
            throw notFound();
        }
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng.");
    }

    public record OrderInfo(String orderCode, Long userId, BigDecimal totalAmount, String status) {

        /** Chi chu don moi thanh toan duoc, va chi khi don con cho thanh toan. */
        public OrderInfo requirePayableBy(Long callerId) {
            if (!userId.equals(callerId)) {
                // Admin xem duoc don nguoi khac nhung khong thanh toan ho; tra 404 de khong lo don ton tai
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng.");
            }
            if (!"PENDING".equals(status)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Đơn hàng này không còn chờ thanh toán.");
            }
            return this;
        }
    }
}
