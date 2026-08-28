package flashdeal_api.order.repository;

import flashdeal_api.order.entity.Order;
import flashdeal_api.order.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderCode(String orderCode);

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByStatusAndExpiresAtBefore(OrderStatus status, LocalDateTime dateTime);

    boolean existsByOrderCode(String orderCode);
}
