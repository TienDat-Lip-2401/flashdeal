package flashdeal_api.order.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String TOPIC_FLASHSALE_ORDER_CREATED = "flashsale.order.created";
    public static final String TOPIC_FLASHSALE_ORDER_CREATED_DLT = "flashsale.order.created.DLT";
    public static final String TOPIC_PRODUCT_EVENTS = "product.events";
    public static final String TOPIC_PAYMENT_SUCCESSFUL = "payment.successful.event";
    public static final String TOPIC_PAYMENT_SUCCESSFUL_DLT = "payment.successful.event.DLT";
    public static final String TOPIC_PAYMENT_FAILED = "payment.failed.event";
    public static final String TOPIC_PAYMENT_FAILED_DLT = "payment.failed.event.DLT";

    @Bean
    public NewTopic flashsaleOrderCreatedTopic() {
        return TopicBuilder.name(TOPIC_FLASHSALE_ORDER_CREATED)
                .partitions(4)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic flashsaleOrderCreatedDltTopic() {
        return TopicBuilder.name(TOPIC_FLASHSALE_ORDER_CREATED_DLT)
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

    @Bean
    public NewTopic paymentSuccessfulDltTopic() {
        return TopicBuilder.name(TOPIC_PAYMENT_SUCCESSFUL_DLT)
                .partitions(2)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic paymentFailedTopic() {
        return TopicBuilder.name(TOPIC_PAYMENT_FAILED)
                .partitions(2)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic paymentFailedDltTopic() {
        return TopicBuilder.name(TOPIC_PAYMENT_FAILED_DLT)
                .partitions(2)
                .replicas(1)
                .build();
    }
}
