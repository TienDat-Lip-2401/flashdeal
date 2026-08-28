package flashdeal_api.order.producer;

import flashdeal_api.order.config.KafkaTopicConfig;
import flashdeal_api.order.model.event.OrderCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class FlashSaleOrderProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishOrderCreatedEvent(OrderCreatedEvent event) {
        String partitionKey = String.valueOf(event.getProductId());

        kafkaTemplate.send(KafkaTopicConfig.TOPIC_FLASHSALE_ORDER_CREATED, partitionKey, event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Published OrderCreatedEvent for orderCode: {}, productId: {} to partition: {} with offset: {}",
                                event.getOrderCode(),
                                event.getProductId(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    } else {
                        log.error("Failed to publish OrderCreatedEvent for orderCode: {}, productId: {}",
                                event.getOrderCode(), event.getProductId(), ex);
                    }
                });
    }
}
