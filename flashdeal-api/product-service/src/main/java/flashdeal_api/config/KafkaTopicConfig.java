package flashdeal_api.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String TOPIC_PRODUCT_EVENTS = "product.events";

    @Bean
    public NewTopic productEventsTopic() {
        return TopicBuilder.name(TOPIC_PRODUCT_EVENTS)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
