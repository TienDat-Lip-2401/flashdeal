package flashdeal_api.model;

import lombok.*;

import java.io.Serializable;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> implements Serializable {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
