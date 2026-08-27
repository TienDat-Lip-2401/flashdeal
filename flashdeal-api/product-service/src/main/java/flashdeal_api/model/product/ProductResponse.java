package flashdeal_api.model.product;

import com.fasterxml.jackson.annotation.JsonFormat;
import flashdeal_api.entity.ProductStatus;
import flashdeal_api.model.category.CategoryResponse;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse implements Serializable {
    private Long id;
    private String name;
    private String slug;
    private CategoryResponse category;
    private BigDecimal originalPrice;
    private Integer totalStock;
    private String description;
    private String imageUrl;
    private ProductStatus status;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}
