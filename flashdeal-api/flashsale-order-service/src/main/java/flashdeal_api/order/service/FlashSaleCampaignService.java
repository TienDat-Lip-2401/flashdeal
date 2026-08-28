package flashdeal_api.order.service;

import flashdeal_api.order.model.dto.AddProductToCampaignRequest;
import flashdeal_api.order.model.dto.CampaignRequest;
import flashdeal_api.order.model.dto.CampaignResponse;
import flashdeal_api.order.model.dto.FlashSaleProductResponse;

import java.util.List;

public interface FlashSaleCampaignService {

    CampaignResponse createCampaign(CampaignRequest request);

    FlashSaleProductResponse addProductToCampaign(Long campaignId, AddProductToCampaignRequest request);

    List<CampaignResponse> getActiveCampaigns();

    List<CampaignResponse> getAllCampaigns();

    CampaignResponse getCampaignById(Long id);

    void deleteCampaign(Long id);

    int updateCampaignStatuses();
}
