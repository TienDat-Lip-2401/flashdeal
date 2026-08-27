package flashdeal_api.auth.producer;

import flashdeal_api.auth.config.KafkaTopicConfig;
import flashdeal_api.auth.entity.User;
import flashdeal_api.auth.model.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishUserRegisteredEvent(User user) {
        UserRegisteredEvent event = UserRegisteredEvent.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .registeredAt(LocalDateTime.now())
                .build();

        // Su dung userId lam Partition Key de dam bao thu tu message
        String partitionKey = String.valueOf(user.getId());

        kafkaTemplate.send(KafkaTopicConfig.TOPIC_USER_REGISTERED, partitionKey, event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Sent UserRegisteredEvent for userId: {} to partition: {} with offset: {}",
                                user.getId(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    } else {
                        log.error("Failed to send UserRegisteredEvent for userId: {}", user.getId(), ex);
                    }
                });
    }
}
