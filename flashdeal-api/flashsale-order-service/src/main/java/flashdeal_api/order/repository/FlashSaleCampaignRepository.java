package flashdeal_api.order.repository;

import flashdeal_api.order.entity.CampaignStatus;
import flashdeal_api.order.entity.FlashSaleCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FlashSaleCampaignRepository extends JpaRepository<FlashSaleCampaign, Long> {

    List<FlashSaleCampaign> findByStatus(CampaignStatus status);

    @Query("SELECT c FROM FlashSaleCampaign c WHERE c.status = 'ONGOING' AND :now BETWEEN c.startTime AND c.endTime")
    List<FlashSaleCampaign> findCurrentActiveCampaigns(LocalDateTime now);

    @Query("SELECT c FROM FlashSaleCampaign c WHERE c.status = 'UPCOMING' AND c.startTime <= :now")
    List<FlashSaleCampaign> findCampaignsReadyToStart(LocalDateTime now);

    @Query("SELECT c FROM FlashSaleCampaign c WHERE c.status = 'ONGOING' AND c.endTime <= :now")
    List<FlashSaleCampaign> findCampaignsReadyToEnd(LocalDateTime now);
}
