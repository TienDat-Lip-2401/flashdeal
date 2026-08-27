package flashdeal_api.model.product;

import flashdeal_api.entity.ProductStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProductRequest {
    private String name;
    private String slug; // Bỏ trống sẽ tự sinh theo name
    private Long categoryId;
    private BigDecimal originalPrice;
    private Integer totalStock;
    private String description;
    private String imageUrl;
    private ProductStatus status = ProductStatus.ACTIVE;
}
