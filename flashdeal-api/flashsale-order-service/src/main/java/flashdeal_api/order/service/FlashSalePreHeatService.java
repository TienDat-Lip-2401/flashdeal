package flashdeal_api.order.service;

import flashdeal_api.order.entity.CampaignStatus;
import flashdeal_api.order.entity.FlashSaleCampaign;
import flashdeal_api.order.entity.FlashSaleProduct;
import flashdeal_api.order.redis.StockDeductionLuaScript;
import flashdeal_api.order.repository.FlashSaleCampaignRepository;
import flashdeal_api.order.repository.FlashSaleProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FlashSalePreHeatService {

    private final FlashSaleCampaignRepository campaignRepository;
    private final FlashSaleProductRepository productRepository;
    private final StockDeductionLuaScript stockDeductionLuaScript;

    @Transactional(readOnly = true)
    public void preHeatCampaign(Long campaignId) {
        FlashSaleCampaign campaign = campaignRepository.findById(campaignId).orElse(null);
        if (campaign == null) {
            log.warn("Cannot pre-heat: Campaign not found with ID: {}", campaignId);
            return;
        }

        List<FlashSaleProduct> products = productRepository.findByCampaignId(campaignId);
        for (FlashSaleProduct product : products) {
            // Nap so luong ton kho kha dung tu DB vao Redis
            stockDeductionLuaScript.setStock(campaignId, product.getProductId(), product.getAvailableStock());
            log.info("Pre-heated stock for campaign: {}, product: {} ({}), stock: {}",
                    campaignId, product.getProductId(), product.getProductName(), product.getAvailableStock());
        }
        log.info("Pre-heated campaign [{}] with {} products into Redis RAM", campaign.getTitle(), products.size());
    }

    @Transactional(readOnly = true)
    public void preHeatAllActiveCampaigns() {
        LocalDateTime now = LocalDateTime.now();
        List<FlashSaleCampaign> activeCampaigns = campaignRepository.findCurrentActiveCampaigns(now);
        List<FlashSaleCampaign> upcomingCampaigns = campaignRepository.findByStatus(CampaignStatus.UPCOMING);

        log.info("Starting auto pre-heat: found {} active and {} upcoming campaigns",
                activeCampaigns.size(), upcomingCampaigns.size());

        for (FlashSaleCampaign campaign : activeCampaigns) {
            preHeatCampaign(campaign.getId());
        }

        for (FlashSaleCampaign campaign : upcomingCampaigns) {
            preHeatCampaign(campaign.getId());
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("FlashSaleOrderService is ready. Executing startup pre-heat for active campaigns...");
        try {
            preHeatAllActiveCampaigns();
        } catch (Exception e) {
            log.error("Failed to execute startup pre-heat: ", e);
        }
    }

    public void restock(Long campaignId, Long productId, Long userId, int quantity) {
        stockDeductionLuaScript.restock(campaignId, productId, userId, quantity);
        log.info("Restocked {} items in Redis for campaign: {}, product: {}, user: {}",
                quantity, campaignId, productId, userId);
    }
}
