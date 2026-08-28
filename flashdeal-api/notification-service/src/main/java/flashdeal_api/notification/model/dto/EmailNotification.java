package flashdeal_api.notification.model.dto;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailNotification {

    private String to;
    private String subject;
    private String templateName;
    private Map<String, Object> templateModel;
}
