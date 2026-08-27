package flashdeal_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "flash_sale_items", indexes = {
        @Index(name = "idx_fsi_sale_product", columnList = "flash_sale_id, product_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashSaleItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flash_sale_id", nullable = false)
    private FlashSale flashSale;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Column(name = "flash_sale_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal flashSalePrice;
    @Column(name = "sale_quantity", nullable = false)
    private Integer saleQuantity; // Số lượng mở bán Flash Sale
    @Column(name = "sold_quantity", nullable = false)
    @Builder.Default
    private Integer soldQuantity = 0; // Đã bán được
    @Column(name = "user_limit", nullable = false)
    @Builder.Default
    private Integer userLimit = 1; // Giới hạn mỗi user được mua bao nhiêu chiếc
}
