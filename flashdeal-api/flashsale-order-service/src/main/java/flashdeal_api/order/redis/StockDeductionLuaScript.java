package flashdeal_api.order.redis;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class StockDeductionLuaScript {

    private final StringRedisTemplate stringRedisTemplate;
    private DefaultRedisScript<Long> deductionScript;

    public static final String STOCK_KEY_PREFIX = "flashsale:stock:";
    public static final String USER_PURCHASE_KEY_PREFIX = "flashsale:user:";
    private static final long USER_PURCHASE_TTL_SECONDS = 86400; // 24 hours

    @PostConstruct
    public void init() {
        String luaScript =
                "if redis.call('EXISTS', KEYS[2]) == 1 then " +
                "    return -2 " +
                "end " +
                "local stock = tonumber(redis.call('GET', KEYS[1])) " +
                "if not stock or stock < tonumber(ARGV[1]) then " +
                "    return -1 " +
                "end " +
                "redis.call('DECRBY', KEYS[1], ARGV[1]) " +
                "redis.call('SET', KEYS[2], '1', 'EX', tonumber(ARGV[2])) " +
                "return 1 ";

        deductionScript = new DefaultRedisScript<>();
        deductionScript.setScriptText(luaScript);
        deductionScript.setResultType(Long.class);
    }

    public Long executeDeduction(Long campaignId, Long productId, Long userId, int quantity) {
        String stockKey = getStockKey(campaignId, productId);
        String userKey = getUserPurchaseKey(campaignId, productId, userId);

        List<String> keys = Arrays.asList(stockKey, userKey);
        String quantityStr = String.valueOf(quantity);
        String ttlStr = String.valueOf(USER_PURCHASE_TTL_SECONDS);

        try {
            Long result = stringRedisTemplate.execute(deductionScript, keys, quantityStr, ttlStr);
            log.debug("Lua stock deduction result: {} for campaign: {}, product: {}, user: {}",
                    result, campaignId, productId, userId);
            return result != null ? result : -1L;
        } catch (Exception e) {
            log.error("Failed to execute Lua stock deduction for campaign: {}, product: {}, user: {}",
                    campaignId, productId, userId, e);
            throw e;
        }
    }

    public void setStock(Long campaignId, Long productId, int stock) {
        String stockKey = getStockKey(campaignId, productId);
        stringRedisTemplate.opsForValue().set(stockKey, String.valueOf(stock));
        log.info("Set Redis stock for key: {} to {}", stockKey, stock);
    }

    public Integer getStock(Long campaignId, Long productId) {
        String stockKey = getStockKey(campaignId, productId);
        String value = stringRedisTemplate.opsForValue().get(stockKey);
        return value != null ? Integer.parseInt(value) : null;
    }

    public void restock(Long campaignId, Long productId, Long userId, int quantity) {
        String stockKey = getStockKey(campaignId, productId);
        String userKey = getUserPurchaseKey(campaignId, productId, userId);

        stringRedisTemplate.opsForValue().increment(stockKey, quantity);
        stringRedisTemplate.delete(userKey);
        log.info("Restocked {} items for key: {} and cleared userKey: {}", quantity, stockKey, userKey);
    }

    public static String getStockKey(Long campaignId, Long productId) {
        return STOCK_KEY_PREFIX + campaignId + ":" + productId;
    }

    public static String getUserPurchaseKey(Long campaignId, Long productId, Long userId) {
        return USER_PURCHASE_KEY_PREFIX + campaignId + ":" + productId + ":" + userId;
    }
}
