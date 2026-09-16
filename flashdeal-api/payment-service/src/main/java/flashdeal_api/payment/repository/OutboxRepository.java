package flashdeal_api.payment.repository;

import flashdeal_api.payment.entity.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OutboxRepository extends JpaRepository<OutboxEvent, String> {

    /**
     * Lấy danh sách các sự kiện PENDING cũ nhất để gửi sang Kafka.
     * Sử dụng FOR UPDATE SKIP LOCKED để ngăn ngừa xung đột (lock contention)
     * giữa nhiều replica/thread đang chạy đồng thời, tránh bắn trùng event.
     */
    @Query(value = "SELECT * FROM outbox_events " +
            "WHERE status = 'PENDING' OR (status = 'PROCESSING' AND created_at < (CURRENT_TIMESTAMP - INTERVAL '2 minutes')) " +
            "ORDER BY created_at ASC LIMIT :limit FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<OutboxEvent> findPendingEventsWithLock(@Param("limit") int limit);

    /**
     * Dọn dẹp các sự kiện đã gửi thành công (PUBLISHED) và đã cũ hơn thời điểm cutoff.
     * Xóa theo từng lô (Batch Size) để tránh lock bảng và bảo vệ hiệu năng Database.
     */
    @Modifying
    @Query(value = "DELETE FROM outbox_events WHERE id IN (" +
            "SELECT id FROM outbox_events " +
            "WHERE status = 'PUBLISHED' AND published_at < :cutoffTime " +
            "LIMIT :batchSize)", nativeQuery = true)
    int deleteBatchPublishedBefore(@Param("cutoffTime") LocalDateTime cutoffTime, @Param("batchSize") int batchSize);
}
