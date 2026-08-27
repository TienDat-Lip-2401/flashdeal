package flashdeal_api.producer;

import flashdeal_api.config.KafkaTopicConfig;
import flashdeal_api.entity.Product;
import flashdeal_api.model.event.ProductEvent;
import flashdeal_api.model.event.ProductEventType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishProductEvent(Product product, ProductEventType eventType) {
        ProductEvent event = ProductEvent.builder()
                .productId(product.getId())
                .eventType(eventType)
                .name(product.getName())
                .slug(product.getSlug())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .originalPrice(product.getOriginalPrice())
                .totalStock(product.getTotalStock())
                .status(product.getStatus() != null ? product.getStatus().name() : "ACTIVE")
                .timestamp(LocalDateTime.now())
                .build();

        String partitionKey = String.valueOf(product.getId());

        kafkaTemplate.send(KafkaTopicConfig.TOPIC_PRODUCT_EVENTS, partitionKey, event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Sent ProductEvent [{}] for productId: {} to partition: {} with offset: {}",
                                eventType,
                                product.getId(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    } else {
                        log.error("Failed to send ProductEvent [{}] for productId: {}", eventType, product.getId(), ex);
                    }
                });
    }

    public void publishProductDeletedEvent(Long productId) {
        ProductEvent event = ProductEvent.builder()
                .productId(productId)
                .eventType(ProductEventType.DELETED)
                .status("DELETED")
                .timestamp(LocalDateTime.now())
                .build();

        String partitionKey = String.valueOf(productId);

        kafkaTemplate.send(KafkaTopicConfig.TOPIC_PRODUCT_EVENTS, partitionKey, event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Sent ProductEvent [DELETED] for productId: {} to partition: {} with offset: {}",
                                productId,
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    } else {
                        log.error("Failed to send ProductEvent [DELETED] for productId: {}", productId, ex);
                    }
                });
    }
}
