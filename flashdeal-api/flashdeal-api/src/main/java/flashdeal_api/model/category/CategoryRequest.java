package flashdeal_api.model.category;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryRequest {
    private String name;
    private String slug; // Bỏ trống sẽ tự sinh theo name
    private Long parentId;
    private Integer displayOrder = 0;
}
