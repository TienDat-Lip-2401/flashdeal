package flashdeal_api.order.consumer;

import flashdeal_api.order.config.KafkaTopicConfig;
import flashdeal_api.order.model.event.ProductEvent;
import flashdeal_api.order.model.event.ProductEventType;
import flashdeal_api.order.repository.FlashSaleProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductEventConsumer {

    private final FlashSaleProductRepository flashSaleProductRepository;

    @KafkaListener(
            topics = KafkaTopicConfig.TOPIC_PRODUCT_EVENTS,
            groupId = "flashsale-product-sync-group",
            containerFactory = "productEventKafkaListenerContainerFactory"
    )
    public void consumeProductEvent(ProductEvent event) {
        log.info("Received ProductEvent [{}] for productId: {}", event.getEventType(), event.getProductId());

        if (event.getEventType() == ProductEventType.DELETED || "INACTIVE".equalsIgnoreCase(event.getStatus())) {
            log.warn("Product [{}] was deleted/deactivated in product-service. Syncing status...", event.getProductId());
        }
    }
}
