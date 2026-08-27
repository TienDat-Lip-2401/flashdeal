package flashdeal_api.runner;

import flashdeal_api.repository.ProductRepository;
import flashdeal_api.service.RedisSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SearchWarmUpRunner {

    private final ProductRepository productRepository;
    private final RedisSearchService redisSearchService;

    @EventListener(ApplicationReadyEvent.class)
    public void warmUpSearchSuggestions() {
        log.info("[SearchWarmUpRunner] Bat dau lam am Cache Redis Search Suggestions tu Database...");
        try {
            List<String> productNames = productRepository.findAllActiveProductNames();
            if (productNames != null && !productNames.isEmpty()) {
                for (String name : productNames) {
                    redisSearchService.indexKeyword(name);
                }
                log.info("[SearchWarmUpRunner] Da nap thanh cong {} tu khoa san pham vao Redis Search Suggestions.", productNames.size());
            } else {
                log.info("[SearchWarmUpRunner] Khong co san pham ACTIVE nao trong DB de nap vao Search Cache.");
            }
        } catch (Exception e) {
            log.error("[SearchWarmUpRunner] Loi khi lam am Search Cache: {}", e.getMessage());
        }
    }
}
