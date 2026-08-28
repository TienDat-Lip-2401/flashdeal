package flashdeal_api.order.controller;

import flashdeal_api.order.model.ApiResponse;
import flashdeal_api.order.model.dto.AddProductToCampaignRequest;
import flashdeal_api.order.model.dto.CampaignRequest;
import flashdeal_api.order.model.dto.CampaignResponse;
import flashdeal_api.order.model.dto.FlashSaleProductResponse;
import flashdeal_api.order.service.FlashSaleCampaignService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/flash-sales/campaigns")
@RequiredArgsConstructor
@Tag(name = "Flash Sale Campaigns", description = "APIs quản lý chiến dịch Flash Sale và nạp kho Redis")
public class FlashSaleCampaignController {

    private final FlashSaleCampaignService campaignService;

    @PostMapping
    @Operation(summary = "Tạo chiến dịch Flash Sale mới (Admin)")
    public ResponseEntity<ApiResponse<CampaignResponse>> createCampaign(
            @Valid @RequestBody CampaignRequest request) {
        CampaignResponse response = campaignService.createCampaign(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo chiến dịch thành công", response));
    }

    @PostMapping("/{campaignId}/products")
    @Operation(summary = "Thêm sản phẩm vào chiến dịch Flash Sale & Pre-heat kho vào Redis (Admin)")
    public ResponseEntity<ApiResponse<FlashSaleProductResponse>> addProductToCampaign(
            @PathVariable Long campaignId,
            @Valid @RequestBody AddProductToCampaignRequest request) {
        FlashSaleProductResponse response = campaignService.addProductToCampaign(campaignId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Thêm sản phẩm và nạp kho Redis thành công", response));
    }

    @GetMapping("/active")
    @Operation(summary = "Lấy danh sách các chiến dịch Flash Sale đang mở bán (Public)")
    public ResponseEntity<ApiResponse<List<CampaignResponse>>> getActiveCampaigns() {
        List<CampaignResponse> campaigns = campaignService.getActiveCampaigns();
        return ResponseEntity.ok(ApiResponse.success(campaigns));
    }

    @GetMapping
    @Operation(summary = "Lấy tất cả chiến dịch Flash Sale (Public / Admin)")
    public ResponseEntity<ApiResponse<List<CampaignResponse>>> getAllCampaigns() {
        List<CampaignResponse> campaigns = campaignService.getAllCampaigns();
        return ResponseEntity.ok(ApiResponse.success(campaigns));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết chiến dịch Flash Sale theo ID (Public)")
    public ResponseEntity<ApiResponse<CampaignResponse>> getCampaignById(@PathVariable Long id) {
        CampaignResponse campaign = campaignService.getCampaignById(id);
        return ResponseEntity.ok(ApiResponse.success(campaign));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa chiến dịch Flash Sale (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteCampaign(@PathVariable Long id) {
        campaignService.deleteCampaign(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa chiến dịch thành công", null));
    }
}
