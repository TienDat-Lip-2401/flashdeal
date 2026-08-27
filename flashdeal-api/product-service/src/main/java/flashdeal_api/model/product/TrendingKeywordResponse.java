package flashdeal_api.model.product;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendingKeywordResponse implements Serializable {
    private String keyword;
    private long searchCount;
}
