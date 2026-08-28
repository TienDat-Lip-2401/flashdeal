package flashdeal_api.order.repository;

import flashdeal_api.order.entity.FlashSaleProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlashSaleProductRepository extends JpaRepository<FlashSaleProduct, Long> {

    List<FlashSaleProduct> findByCampaignId(Long campaignId);

    Optional<FlashSaleProduct> findByCampaignIdAndProductId(Long campaignId, Long productId);

    @Modifying
    @Query("UPDATE FlashSaleProduct p SET p.availableStock = p.availableStock - :qty WHERE p.id = :id AND p.availableStock >= :qty")
    int deductStockDb(@Param("id") Long id, @Param("qty") int qty);

    @Modifying
    @Query("UPDATE FlashSaleProduct p SET p.availableStock = p.availableStock + :qty WHERE p.id = :id")
    int restockDb(@Param("id") Long id, @Param("qty") int qty);
}
