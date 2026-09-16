package flashdeal_api.payment.scheduler;

import com.fasterxml.jackson.databind.ObjectMapper;
import flashdeal_api.payment.entity.OutboxEvent;
import flashdeal_api.payment.entity.OutboxStatus;
import flashdeal_api.payment.model.event.PaymentSuccessfulEvent;
import flashdeal_api.payment.repository.OutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Background Worker chuyển phát sự kiện từ bảng outbox_events sang Apache Kafka.
 * Đảm bảo cơ chế At-Least-Once Delivery và an toàn đa luồng/đa Pod (SKIP LOCKED).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class OutboxScheduler {

    private final OutboxRepository outboxRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    private static final int BATCH_SIZE = 50;
    private static final int MAX_RETRIES = 5;

    /**
     * Quét các sự kiện PENDING trong bảng outbox_events và bắn sang Apache Kafka.
     * Chạy định kỳ mỗi 1 giây (fixedDelay = 1000).
     */
    @Scheduled(fixedDelay = 1000)
    public void processOutboxEvents() {
        List<OutboxEvent> events = fetchAndLockEvents();
        if (events.isEmpty()) {
            return;
        }

        log.info("[Outbox Worker] Nhặt được {} sự kiện đang chờ gửi sang Kafka", events.size());

        for (OutboxEvent event : events) {
            publishSingleEvent(event);
        }
    }

    /**
     * Khóa dòng an toàn bằng SKIP LOCKED trong một Transaction ngắn,
     * chuyển trạng thái sang PROCESSING để các replica khác không nhặt trùng.
     */
    @Transactional
    public List<OutboxEvent> fetchAndLockEvents() {
        List<OutboxEvent> pending = outboxRepository.findPendingEventsWithLock(BATCH_SIZE);
        if (pending.isEmpty()) {
            return pending;
        }

        for (OutboxEvent event : pending) {
            event.setStatus(OutboxStatus.PROCESSING);
        }
        return outboxRepository.saveAll(pending);
    }

    /**
     * Bắn từng sự kiện sang Kafka và cập nhật trạng thái tương ứng.
     * Thực thi tách biệt khỏi connection pool dài hạn để bảo vệ database.
     */
    public void publishSingleEvent(OutboxEvent event) {
        try {
            // 1. Chuyển đổi payload thành Object tương ứng
            Object payloadObject;
            if ("PaymentSuccessfulEvent".equals(event.getEventType())) {
                payloadObject = objectMapper.readValue(event.getPayload(), PaymentSuccessfulEvent.class);
            } else {
                payloadObject = objectMapper.readTree(event.getPayload());
            }

            // 2. Bắn sang Kafka và chờ xác nhận (Ack) trong tối đa 5 giây
            CompletableFuture<SendResult<String, Object>> future = kafkaTemplate.send(
                    event.getTopic(),
                    event.getAggregateId(),
                    payloadObject
            );

            SendResult<String, Object> result = future.get(5, TimeUnit.SECONDS);

            // 3. Kafka đã nhận an toàn -> Chuyển sang PUBLISHED!
            markAsPublished(event.getId());

            log.info("[Outbox Worker] Đã bắn sự kiện [{}] (orderCode: [{}]) tới Kafka topic [{}] thành công - Partition: {}, Offset: {}",
                    event.getId(),
                    event.getAggregateId(),
                    result.getRecordMetadata().topic(),
                    result.getRecordMetadata().partition(),
                    result.getRecordMetadata().offset());

        } catch (Exception ex) {
            log.error("[Outbox Worker] Lỗi khi bắn sự kiện [{}] (orderCode: [{}]) sang Kafka: {}",
                    event.getId(), event.getAggregateId(), ex.getMessage());
            markAsFailedOrRetry(event.getId(), ex.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markAsPublished(String eventId) {
        outboxRepository.findById(eventId).ifPresent(event -> {
            event.setStatus(OutboxStatus.PUBLISHED);
            event.setPublishedAt(LocalDateTime.now());
            event.setErrorMessage(null);
            outboxRepository.save(event);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markAsFailedOrRetry(String eventId, String errorMessage) {
        outboxRepository.findById(eventId).ifPresent(event -> {
            int newRetryCount = event.getRetryCount() + 1;
            event.setRetryCount(newRetryCount);
            event.setErrorMessage(errorMessage);

            if (newRetryCount >= MAX_RETRIES) {
                event.setStatus(OutboxStatus.FAILED);
                log.error("[Outbox Worker] Sự kiện [{}] đã vượt quá {} lần retry. Đánh dấu FAILED!", eventId, MAX_RETRIES);
            } else {
                event.setStatus(OutboxStatus.PENDING);
                log.warn("[Outbox Worker] Sự kiện [{}] gửi thất bại (lần {}). Trả về PENDING để thử lại.", eventId, newRetryCount);
            }
            outboxRepository.save(event);
        });
    }

    /**
     * Dọn dẹp các sự kiện đã PUBLISHED thành công và đã cũ hơn 3 ngày.
     * Chạy định kỳ vào 02:00 AM mỗi đêm.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void housekeepingPublishedEvents() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(3);
        int batchSize = 1000;
        int totalDeleted = 0;
        int deleted;

        do {
            deleted = outboxRepository.deleteBatchPublishedBefore(cutoffTime, batchSize);
            totalDeleted += deleted;
        } while (deleted == batchSize);

        if (totalDeleted > 0) {
            log.info("[Outbox Housekeeping] Đã dọn dẹp tổng cộng {} bản ghi PUBLISHED cũ hơn 3 ngày.", totalDeleted);
        }
    }
}
