package flashdeal_api.repository;

import flashdeal_api.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByTransactionCode(String transactionCode);
    Optional<PaymentTransaction> findByOrderId(Long orderId);
}
