package flashdeal_api.order.consumer;

import flashdeal_api.order.config.KafkaTopicConfig;
import flashdeal_api.order.model.event.OrderCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderDltConsumer {

    @KafkaListener(
            topics = KafkaTopicConfig.TOPIC_FLASHSALE_ORDER_CREATED_DLT,
            groupId = "flashsale-order-dlt-group",
            containerFactory = "orderCreatedKafkaListenerContainerFactory"
    )
    public void consumeOrderCreatedDlt(
            ConsumerRecord<String, OrderCreatedEvent> record,
            @Header(name = KafkaHeaders.DLT_EXCEPTION_MESSAGE, required = false) String exceptionMessage,
            @Header(name = KafkaHeaders.DLT_ORIGINAL_TOPIC, required = false) String originalTopic,
            @Header(name = KafkaHeaders.DLT_ORIGINAL_PARTITION, required = false) Integer originalPartition,
            @Header(name = KafkaHeaders.DLT_ORIGINAL_OFFSET, required = false) Long originalOffset
    ) {
        OrderCreatedEvent event = record.value();

        log.error("================================================================================");
        log.error("🚨 [DEAD LETTER TOPIC ALERT] PHÁT HIỆN ĐƠN HÀNG HỎNG KHÔNG THỂ TẠO SAU 3 LẦN RETRY!");
        log.error("📌 Thông tin đơn hàng: OrderCode={}, UserId={}, ProductId={}, TotalAmount={}",
                event != null ? event.getOrderCode() : "N/A",
                event != null ? event.getUserId() : "N/A",
                event != null ? event.getProductId() : "N/A",
                event != null ? event.getTotalAmount() : "N/A");
        log.error("📍 Nguồn gốc ban đầu: Topic={}, Partition={}, Offset={}", originalTopic, originalPartition, originalOffset);
        log.error("💥 Chi tiết lỗi: {}", exceptionMessage);
        log.error("================================================================================");

        // Kỹ thuật thực tế:
        // 1. Lưu bản ghi vào bảng audit_failed_events để phục vụ công cụ Replay sau khi vá lỗi.
        // 2. Tự động bắn thông báo khẩn cấp tới Telegram / Slack cho kỹ sư trực hệ thống On-call.
    }
}