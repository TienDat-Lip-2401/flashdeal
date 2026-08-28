package flashdeal_api.order.model.dto;

import flashdeal_api.order.entity.CampaignStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignResponse {

    private Long id;
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private CampaignStatus status;
    private List<FlashSaleProductResponse> products;
    private LocalDateTime createdAt;
}
