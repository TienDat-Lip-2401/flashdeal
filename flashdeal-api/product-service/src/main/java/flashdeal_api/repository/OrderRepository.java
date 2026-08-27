package flashdeal_api.repository;

import flashdeal_api.entity.Order;
import flashdeal_api.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Tìm các đơn hàng PENDING đã quá hạn 15 phút chưa thanh toán để tự động hủy & hoàn kho
    List<Order> findByStatusAndExpiresAtBefore(OrderStatus status, LocalDateTime now);
}
