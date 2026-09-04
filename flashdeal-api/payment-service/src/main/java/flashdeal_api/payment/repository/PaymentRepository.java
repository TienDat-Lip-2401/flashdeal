package flashdeal_api.payment.repository;

import flashdeal_api.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderCode(String orderCode);
    Optional<Payment> findByPaymentCode(String paymentCode);
}
