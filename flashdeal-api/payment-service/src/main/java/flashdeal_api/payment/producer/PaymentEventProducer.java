package flashdeal_api.payment.producer;

import flashdeal_api.payment.model.event.PaymentSuccessfulEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
@Slf4j
@RequiredArgsConstructor
public class PaymentEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${spring.kafka.topic.payment-successful:payment.successful.event}")
    private String paymentSuccessfulTopic;

    public void publishPaymentSuccessfulEvent(PaymentSuccessfulEvent event) {
        log.info("[Kafka Producer] Bắn sự kiện thanh toán thành công cho đơn hàng: [{}], số tiền: [{} đ]",
                event.getOrderCode(), event.getAmount());

        CompletableFuture<SendResult<String, Object>> future =
                kafkaTemplate.send(paymentSuccessfulTopic, event.getOrderCode(), event);

        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("[Kafka Producer] Gửi sự kiện thanh toán thành công tới topic [{}] - partition [{}], offset [{}]",
                        result.getRecordMetadata().topic(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            } else {
                log.error("[Kafka Producer] Lỗi khi gửi sự kiện thanh toán tới Kafka topic [{}]: {}",
                        paymentSuccessfulTopic, ex.getMessage(), ex);
            }
        });
    }
}
