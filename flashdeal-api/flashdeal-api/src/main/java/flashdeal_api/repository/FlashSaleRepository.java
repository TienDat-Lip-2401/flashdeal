package flashdeal_api.repository;

import flashdeal_api.entity.FlashSale;
import flashdeal_api.entity.FlashSaleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface FlashSaleRepository extends JpaRepository<FlashSale, Long> {
    List<FlashSale> findByStatus(FlashSaleStatus status);
    // Tìm đợt Flash Sale đang diễn ra tại thời điểm hiện tại
    Optional<FlashSale> findFirstByStartTimeLessThanEqualAndEndTimeGreaterThanEqualAndStatus(
            LocalDateTime start, LocalDateTime end, FlashSaleStatus status);
}
