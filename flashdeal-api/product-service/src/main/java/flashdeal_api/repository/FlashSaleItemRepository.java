package flashdeal_api.repository;

import flashdeal_api.entity.FlashSaleItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlashSaleItemRepository extends JpaRepository<FlashSaleItem, Long> {
    // 1. Phục vụ API người dùng xem danh sách Flash Sale (Có phân trang)
    Page<FlashSaleItem> findByFlashSaleId(Long flashSaleId, Pageable pageable);
    // 2. Phục vụ Job nội bộ nạp tồn kho lên Redis trước giờ G (Lấy toàn bộ)
    List<FlashSaleItem> findByFlashSaleId(Long flashSaleId);
    // 3. Tìm sản phẩm cụ thể trong đợt sale
    Optional<FlashSaleItem> findByFlashSaleIdAndProductId(Long flashSaleId, Long productId);

    // 4. Tìm sản phẩm trong đợt Flash Sale đang ACTIVE tại thời điểm hiện tại
    @org.springframework.data.jpa.repository.Query("SELECT fsi FROM FlashSaleItem fsi JOIN FETCH fsi.flashSale fs " +
            "WHERE fsi.product.id = :productId " +
            "AND fs.status = :status " +
            "AND :now BETWEEN fs.startTime AND fs.endTime")
    Optional<FlashSaleItem> findActiveFlashSaleItemByProductId(@org.springframework.data.repository.query.Param("productId") Long productId,
                                                              @org.springframework.data.repository.query.Param("status") flashdeal_api.entity.FlashSaleStatus status,
                                                              @org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now);
}
