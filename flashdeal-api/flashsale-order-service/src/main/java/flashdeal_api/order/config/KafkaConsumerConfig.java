package flashdeal_api.order.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import flashdeal_api.order.model.event.OrderCreatedEvent;
import flashdeal_api.order.model.event.PaymentSuccessfulEvent;
import flashdeal_api.order.model.event.ProductEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
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

    @Value("${spring.kafka.consumer.group-id:flashsale-order-group}")
    private String defaultGroupId;

    @Value("${spring.kafka.consumer.auto-offset-reset:earliest}")
    private String autoOffsetReset;

    private Map<String, Object> baseConsumerConfigs(String groupId) {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, autoOffsetReset);
        return props;
    }

    // 1. Container Factory cho OrderCreatedEvent (Săn deal Flash Sale thành công -> lưu DB)
    @Bean
    public ConsumerFactory<String, OrderCreatedEvent> orderCreatedConsumerFactory(ObjectMapper objectMapper) {
        JsonDeserializer<OrderCreatedEvent> deserializer = new JsonDeserializer<>(OrderCreatedEvent.class, objectMapper);
        deserializer.addTrustedPackages("*");
        deserializer.setUseTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(
                baseConsumerConfigs("flashsale-order-group"),
                new StringDeserializer(),
                deserializer
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, OrderCreatedEvent> orderCreatedKafkaListenerContainerFactory(
            ConsumerFactory<String, OrderCreatedEvent> orderCreatedConsumerFactory) {
        ConcurrentKafkaListenerContainerFactory<String, OrderCreatedEvent> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(orderCreatedConsumerFactory);
        factory.setConcurrency(4);
        return factory;
    }

    // 2. Container Factory cho PaymentSuccessfulEvent (Thanh toán VNPAY thành công -> đổi trạng thái PAID)
    @Bean
    public ConsumerFactory<String, PaymentSuccessfulEvent> paymentSuccessfulConsumerFactory(ObjectMapper objectMapper) {
        JsonDeserializer<PaymentSuccessfulEvent> deserializer = new JsonDeserializer<>(PaymentSuccessfulEvent.class, objectMapper);
        deserializer.addTrustedPackages("*");
        deserializer.setUseTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(
                baseConsumerConfigs("order-payment-group"),
                new StringDeserializer(),
                deserializer
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentSuccessfulEvent> paymentSuccessfulKafkaListenerContainerFactory(
            ConsumerFactory<String, PaymentSuccessfulEvent> paymentSuccessfulConsumerFactory) {
        ConcurrentKafkaListenerContainerFactory<String, PaymentSuccessfulEvent> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(paymentSuccessfulConsumerFactory);
        factory.setConcurrency(2);
        return factory;
    }

    // 3. Container Factory cho ProductEvent (Đồng bộ sản phẩm)
    @Bean
    public ConsumerFactory<String, ProductEvent> productEventConsumerFactory(ObjectMapper objectMapper) {
        JsonDeserializer<ProductEvent> deserializer = new JsonDeserializer<>(ProductEvent.class, objectMapper);
        deserializer.addTrustedPackages("*");
        deserializer.setUseTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(
                baseConsumerConfigs("flashsale-product-sync-group"),
                new StringDeserializer(),
                deserializer
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ProductEvent> productEventKafkaListenerContainerFactory(
            ConsumerFactory<String, ProductEvent> productEventConsumerFactory) {
        ConcurrentKafkaListenerContainerFactory<String, ProductEvent> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(productEventConsumerFactory);
        factory.setConcurrency(2);
        return factory;
    }
}
