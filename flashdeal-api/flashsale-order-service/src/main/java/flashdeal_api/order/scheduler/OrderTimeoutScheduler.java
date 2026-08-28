package flashdeal_api.order.scheduler;

import flashdeal_api.order.service.FlashSaleCampaignService;
import flashdeal_api.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderTimeoutScheduler {

    private final OrderService orderService;
    private final FlashSaleCampaignService campaignService;

    /**
     * Dinh ky quet cac don hang PENDING qua han moi 10 giay
     * Tu dong huy don va hoan lai ton kho vao Redis RAM va Database
     */
    @Scheduled(fixedDelay = 10000)
    public void scanAndCancelExpiredOrders() {
        try {
            int cancelledCount = orderService.cancelExpiredOrders();
            if (cancelledCount > 0) {
                log.info("OrderTimeoutScheduler: Successfully auto-cancelled and restocked {} expired orders", cancelledCount);
            }
        } catch (Exception e) {
            log.error("Error occurred during OrderTimeoutScheduler execution", e);
        }
    }

    /**
     * Dinh ky cap nhat trang thai vong doi chien dich (UPCOMING -> ONGOING -> ENDED) moi 10 giay
     */
    @Scheduled(fixedDelay = 10000)
    public void updateCampaignLifecycles() {
        try {
            int count = campaignService.updateCampaignStatuses();
            if (count > 0) {
                log.info("CampaignLifecycleScheduler: Auto-transitioned {} campaigns", count);
            }
        } catch (Exception e) {
            log.error("Error occurred during campaign lifecycle transition", e);
        }
    }
}
