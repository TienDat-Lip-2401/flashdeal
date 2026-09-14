package flashdeal_api.model.product;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductDetailSummaryResponse implements Serializable {

    private ProductResponse product;
    private FlashSaleSummary flashSale;
    private List<ProductResponse> relatedProducts;

    private Long executionTimeMs;
    private List<String> executedThreads;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FlashSaleSummary implements Serializable {
        private Long flashSaleId;
        private String campaignTitle;
        private BigDecimal flashSalePrice;
        private Integer saleQuantity;
        private Integer soldQuantity;
        private Integer availableStock;
        private Integer userLimit;

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime startTime;

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime endTime;

        private String status;
    }
}