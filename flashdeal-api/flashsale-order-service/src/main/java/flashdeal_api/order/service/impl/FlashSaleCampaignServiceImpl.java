package flashdeal_api.order.service.impl;

import flashdeal_api.order.entity.CampaignStatus;
import flashdeal_api.order.entity.FlashSaleCampaign;
import flashdeal_api.order.entity.FlashSaleProduct;
import flashdeal_api.order.exception.AppException;
import flashdeal_api.order.exception.ErrorCode;
import flashdeal_api.order.model.dto.AddProductToCampaignRequest;
import flashdeal_api.order.model.dto.CampaignRequest;
import flashdeal_api.order.model.dto.CampaignResponse;
import flashdeal_api.order.model.dto.FlashSaleProductResponse;
import flashdeal_api.order.redis.StockDeductionLuaScript;
import flashdeal_api.order.repository.FlashSaleCampaignRepository;
import flashdeal_api.order.repository.FlashSaleProductRepository;
import flashdeal_api.order.service.FlashSaleCampaignService;
import flashdeal_api.order.service.FlashSalePreHeatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FlashSaleCampaignServiceImpl implements FlashSaleCampaignService {

    private final FlashSaleCampaignRepository campaignRepository;
    private final FlashSaleProductRepository productRepository;
    private final FlashSalePreHeatService preHeatService;
    private final StockDeductionLuaScript stockDeductionLuaScript;

    @Override
    @Transactional
    public CampaignResponse createCampaign(CampaignRequest request) {
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new AppException(ErrorCode.CAMPAIGN_TIME_INVALID);
        }

        LocalDateTime now = LocalDateTime.now();
        CampaignStatus initialStatus = CampaignStatus.UPCOMING;
        if (!now.isBefore(request.getStartTime()) && !now.isAfter(request.getEndTime())) {
            initialStatus = CampaignStatus.ONGOING;
        } else if (now.isAfter(request.getEndTime())) {
            initialStatus = CampaignStatus.ENDED;
        }

        FlashSaleCampaign campaign = FlashSaleCampaign.builder()
                .title(request.getTitle())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(initialStatus)
                .build();

        FlashSaleCampaign saved = campaignRepository.save(campaign);
        log.info("Created FlashSaleCampaign ID: {}, Title: [{}], Status: [{}]", saved.getId(), saved.getTitle(), initialStatus);
        return mapToCampaignResponse(saved);
    }

    @Override
    @Transactional
    public FlashSaleProductResponse addProductToCampaign(Long campaignId, AddProductToCampaignRequest request) {
        FlashSaleCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(ErrorCode.CAMPAIGN_NOT_FOUND));

        if (productRepository.findByCampaignIdAndProductId(campaignId, request.getProductId()).isPresent()) {
            throw new AppException(ErrorCode.PRODUCT_ALREADY_IN_CAMPAIGN);
        }

        FlashSaleProduct product = FlashSaleProduct.builder()
                .campaign(campaign)
                .productId(request.getProductId())
                .productName(request.getProductName())
                .originalPrice(request.getOriginalPrice())
                .flashSalePrice(request.getFlashSalePrice())
                .flashSaleStock(request.getFlashSaleStock())
                .availableStock(request.getFlashSaleStock())
                .build();

        FlashSaleProduct savedProduct = productRepository.save(product);

        // Pre-heat so luong ton kho vao Redis RAM ngay lap tuc
        stockDeductionLuaScript.setStock(campaignId, request.getProductId(), request.getFlashSaleStock());
        log.info("Added product [{}] to campaign ID: {} and pre-heated stock: {} into Redis",
                request.getProductName(), campaignId, request.getFlashSaleStock());

        return mapToProductResponse(savedProduct);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampaignResponse> getActiveCampaigns() {
        LocalDateTime now = LocalDateTime.now();
        List<FlashSaleCampaign> activeCampaigns = campaignRepository.findCurrentActiveCampaigns(now);
        if (activeCampaigns.isEmpty()) {
            // Tra ve cac chien dich ONGOING hoac UPCOMING de nguoi dung theo doi
            activeCampaigns = campaignRepository.findAll().stream()
                    .filter(c -> c.getStatus() != CampaignStatus.ENDED)
                    .collect(Collectors.toList());
        }
        return activeCampaigns.stream().map(this::mapToCampaignResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampaignResponse> getAllCampaigns() {
        return campaignRepository.findAll().stream().map(this::mapToCampaignResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CampaignResponse getCampaignById(Long id) {
        FlashSaleCampaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CAMPAIGN_NOT_FOUND));
        return mapToCampaignResponse(campaign);
    }

    @Override
    @Transactional
    public void deleteCampaign(Long id) {
        if (!campaignRepository.existsById(id)) {
            throw new AppException(ErrorCode.CAMPAIGN_NOT_FOUND);
        }
        campaignRepository.deleteById(id);
        log.info("Deleted FlashSaleCampaign ID: {}", id);
    }

    @Override
    @Transactional
    public int updateCampaignStatuses() {
        LocalDateTime now = LocalDateTime.now();
        int transitionedCount = 0;

        // 1. Chuyen cac chien dich UPCOMING da den gio sang ONGOING
        List<FlashSaleCampaign> readyToStart = campaignRepository.findCampaignsReadyToStart(now);
        for (FlashSaleCampaign c : readyToStart) {
            if (!now.isAfter(c.getEndTime())) {
                c.setStatus(CampaignStatus.ONGOING);
                campaignRepository.save(c);
                transitionedCount++;
                log.info("Transitioned FlashSaleCampaign ID: {} [{}] from UPCOMING to ONGOING", c.getId(), c.getTitle());
            }
        }

        // 2. Chuyen cac chien dich ONGOING da het gio sang ENDED
        List<FlashSaleCampaign> readyToEnd = campaignRepository.findCampaignsReadyToEnd(now);
        for (FlashSaleCampaign c : readyToEnd) {
            c.setStatus(CampaignStatus.ENDED);
            campaignRepository.save(c);
            transitionedCount++;
            log.info("Transitioned FlashSaleCampaign ID: {} [{}] from ONGOING to ENDED", c.getId(), c.getTitle());
        }

        return transitionedCount;
    }

    private CampaignResponse mapToCampaignResponse(FlashSaleCampaign campaign) {
        List<FlashSaleProduct> products = productRepository.findByCampaignId(campaign.getId());
        List<FlashSaleProductResponse> productResponses = products.stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());

        return CampaignResponse.builder()
                .id(campaign.getId())
                .title(campaign.getTitle())
                .startTime(campaign.getStartTime())
                .endTime(campaign.getEndTime())
                .status(campaign.getStatus())
                .products(productResponses)
                .createdAt(campaign.getCreatedAt())
                .build();
    }

    private FlashSaleProductResponse mapToProductResponse(FlashSaleProduct product) {
        Integer redisStock = stockDeductionLuaScript.getStock(product.getCampaign().getId(), product.getProductId());
        return FlashSaleProductResponse.builder()
                .id(product.getId())
                .campaignId(product.getCampaign().getId())
                .productId(product.getProductId())
                .productName(product.getProductName())
                .originalPrice(product.getOriginalPrice())
                .flashSalePrice(product.getFlashSalePrice())
                .flashSaleStock(product.getFlashSaleStock())
                .availableStock(product.getAvailableStock())
                .redisStock(redisStock != null ? redisStock : product.getAvailableStock())
                .createdAt(product.getCreatedAt())
                .build();
    }
}
