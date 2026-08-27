package flashdeal_api.model.product;

import flashdeal_api.entity.ProductStatus;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductFilterRequest {
    private String keyword;
    private Long categoryId;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    @Builder.Default
    private ProductStatus status = ProductStatus.ACTIVE;

    @Builder.Default
    private int page = 0;

    @Builder.Default
    private int size = 10;

    @Builder.Default
    private String sortBy = "createdAt";

    @Builder.Default
    private String sortDirection = "DESC";
    public String toCacheKey() {
        return String.format("kw=%s:cat=%s:min=%s:max=%s:st=%s:p=%d:s=%d:sort=%s_%s",
                keyword != null ? keyword.trim().toLowerCase() : "all",
                categoryId != null ? categoryId : "all",
                minPrice != null ? minPrice : "0",
                maxPrice != null ? maxPrice : "max",
                status != null ? status.name() : "ACTIVE",
                page,
                size,
                sortBy,
                sortDirection);
    }
}
