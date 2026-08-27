package flashdeal_api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApiResponse {
    @Builder.Default
    private int code = 1000;
    private String message;
    private JsonNode data;
    private Meta meta;
    @Data
    @Builder
    public static class Meta {
        long total;

        int page;

        @JsonProperty("page_of_number")
        int pageOfNumber;
    }
}
