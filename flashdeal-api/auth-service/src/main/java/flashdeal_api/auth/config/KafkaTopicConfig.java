package flashdeal_api.auth.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String TOPIC_USER_REGISTERED = "user.registered.event";

    @Bean
    public NewTopic userRegisteredTopic() {
        return TopicBuilder.name(TOPIC_USER_REGISTERED)
                .partitions(2)
                .replicas(1)
                .build();
    }
}
