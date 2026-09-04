package flashdeal_api.order.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String TOPIC_FLASHSALE_ORDER_CREATED = "flashsale.order.created";
    public static final String TOPIC_PRODUCT_EVENTS = "product.events";
    public static final String TOPIC_PAYMENT_SUCCESSFUL = "payment.successful.event";

    @Bean
    public NewTopic flashsaleOrderCreatedTopic() {
        return TopicBuilder.name(TOPIC_FLASHSALE_ORDER_CREATED)
                .partitions(4)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic paymentSuccessfulTopic() {
        return TopicBuilder.name(TOPIC_PAYMENT_SUCCESSFUL)
                .partitions(2)
                .replicas(1)
                .build();
    }
}
