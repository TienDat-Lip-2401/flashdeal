package flashdeal_api.notification.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import flashdeal_api.notification.model.event.OrderCreatedEvent;
import flashdeal_api.notification.model.event.UserRegisteredEvent;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.HashMap;
import java.util.Map;

@EnableKafka
@Configuration
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    @Value("${spring.kafka.consumer.group-id:notification-service-group}")
    private String groupId;

    @Value("${spring.kafka.consumer.auto-offset-reset:earliest}")
    private String autoOffsetReset;

    private Map<String, Object> baseConsumerConfigs() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, autoOffsetReset);
        return props;
    }

    // 1. Container Factory cho OrderCreatedEvent (Don hang Flash Sale)
    @Bean
    public ConsumerFactory<String, OrderCreatedEvent> orderCreatedConsumerFactory(ObjectMapper objectMapper) {
        JsonDeserializer<OrderCreatedEvent> deserializer = new JsonDeserializer<>(OrderCreatedEvent.class, objectMapper);
        deserializer.addTrustedPackages("*");
        deserializer.setUseTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(
                baseConsumerConfigs(),
                new StringDeserializer(),
                deserializer
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, OrderCreatedEvent> orderCreatedKafkaListenerContainerFactory(
            ConsumerFactory<String, OrderCreatedEvent> orderCreatedConsumerFactory) {
        ConcurrentKafkaListenerContainerFactory<String, OrderCreatedEvent> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(orderCreatedConsumerFactory);
        return factory;
    }

    // 2. Container Factory cho UserRegisteredEvent (Chao mung Dang ky User moi)
    @Bean
    public ConsumerFactory<String, UserRegisteredEvent> userRegisteredConsumerFactory(ObjectMapper objectMapper) {
        JsonDeserializer<UserRegisteredEvent> deserializer = new JsonDeserializer<>(UserRegisteredEvent.class, objectMapper);
        deserializer.addTrustedPackages("*");
        deserializer.setUseTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(
                baseConsumerConfigs(),
                new StringDeserializer(),
                deserializer
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, UserRegisteredEvent> userRegisteredKafkaListenerContainerFactory(
            ConsumerFactory<String, UserRegisteredEvent> userRegisteredConsumerFactory) {
        ConcurrentKafkaListenerContainerFactory<String, UserRegisteredEvent> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(userRegisteredConsumerFactory);
        factory.setConcurrency(2);
        return factory;
    }

    @Bean
    public NewTopic userRegisteredTopic() {
        return TopicBuilder.name("user.registered.event")
                .partitions(2)
                .replicas(1)
                .build();
    }

    // 3. Container Factory cho PaymentSuccessfulEvent (Thanh toán VNPAY thành công)
    @Bean
    public ConsumerFactory<String, flashdeal_api.notification.model.event.PaymentSuccessfulEvent> paymentSuccessfulConsumerFactory(ObjectMapper objectMapper) {
        JsonDeserializer<flashdeal_api.notification.model.event.PaymentSuccessfulEvent> deserializer =
                new JsonDeserializer<>(flashdeal_api.notification.model.event.PaymentSuccessfulEvent.class, objectMapper);
        deserializer.addTrustedPackages("*");
        deserializer.setUseTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(
                baseConsumerConfigs(),
                new StringDeserializer(),
                deserializer
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, flashdeal_api.notification.model.event.PaymentSuccessfulEvent> paymentSuccessfulKafkaListenerContainerFactory(
            ConsumerFactory<String, flashdeal_api.notification.model.event.PaymentSuccessfulEvent> paymentSuccessfulConsumerFactory) {
        ConcurrentKafkaListenerContainerFactory<String, flashdeal_api.notification.model.event.PaymentSuccessfulEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(paymentSuccessfulConsumerFactory);
        factory.setConcurrency(2);
        return factory;
    }

    @Bean
    public NewTopic paymentSuccessfulTopic() {
        return TopicBuilder.name("payment.successful.event")
                .partitions(2)
                .replicas(1)
                .build();
    }
}
