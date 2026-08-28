package flashdeal_api.order.model.event;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductEvent implements Serializable {

    private Long productId;
    private ProductEventType eventType;
    private String name;
    private String slug;
    private Long categoryId;
    private BigDecimal originalPrice;
    private Integer totalStock;
    private String status;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
}
