package flashdeal_api.order.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String TOPIC_FLASHSALE_ORDER_CREATED = "flashsale.order.created";
    public static final String TOPIC_PRODUCT_EVENTS = "product.events";

    @Bean
    public NewTopic flashsaleOrderCreatedTopic() {
        return TopicBuilder.name(TOPIC_FLASHSALE_ORDER_CREATED)
                .partitions(4)
                .replicas(1)
                .build();
    }
}
