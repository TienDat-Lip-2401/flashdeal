package flashdeal_api.service.impl;

import flashdeal_api.model.product.TrendingKeywordResponse;
import flashdeal_api.service.RedisSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Range;
import org.springframework.data.redis.connection.Limit;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class RedisSearchServiceImpl implements RedisSearchService {

    private static final String SUGGESTIONS_KEY = "search:suggestions";
    private static final String TRENDING_KEY = "search:trending";

    private final StringRedisTemplate stringRedisTemplate;

    @Override
    public void indexKeyword(String keyword) {
        if (!StringUtils.hasText(keyword)) return;

        String cleanKeyword = keyword.trim().toLowerCase();
        stringRedisTemplate.opsForZSet().add(SUGGESTIONS_KEY, cleanKeyword, 0);
        log.info("[RedisSearch] Da index tu khoa vao suggestions: {}", cleanKeyword);
    }

    @Override
    public List<String> getSuggestions(String prefix, int limit) {
        if (!StringUtils.hasText(prefix)) {
            return Collections.emptyList();
        }

        String cleanPrefix = prefix.trim().toLowerCase();
        int maxCount = limit > 0 ? limit : 10;

        Range<String> range = Range.closed(cleanPrefix, cleanPrefix + "\uffff");
        Limit redisLimit = Limit.limit().count(maxCount);

        Set<String> results = stringRedisTemplate.opsForZSet().rangeByLex(SUGGESTIONS_KEY, range, redisLimit);
        if (results == null || results.isEmpty()) {
            return Collections.emptyList();
        }

        return results.stream().toList();
    }

    @Override
    public void recordSearchKeyword(String keyword) {
        if (!StringUtils.hasText(keyword)) return;

        String cleanKeyword = keyword.trim().toLowerCase();
        // Tang score len +1 moi khi co nguoi tim kiem tu khoa nay (ZINCRBY)
        Double newScore = stringRedisTemplate.opsForZSet().incrementScore(TRENDING_KEY, cleanKeyword, 1.0);
        log.info("[RedisSearch] Ghi nhan tim kiem: '{}', tong luot: {}", cleanKeyword, newScore != null ? newScore.longValue() : 1);
    }

    @Override
    public List<TrendingKeywordResponse> getTopTrendingKeywords(int limit) {
        int maxCount = limit > 0 ? limit : 10;

        // Lay Top tu cao xuong thap (ZREVRANGE search:trending 0 (limit-1) WITHSCORES)
        Set<ZSetOperations.TypedTuple<String>> tuples = stringRedisTemplate.opsForZSet()
                .reverseRangeWithScores(TRENDING_KEY, 0, maxCount - 1);

        if (tuples == null || tuples.isEmpty()) {
            return Collections.emptyList();
        }

        List<TrendingKeywordResponse> responses = new ArrayList<>();
        for (ZSetOperations.TypedTuple<String> tuple : tuples) {
            if (tuple.getValue() != null) {
                responses.add(TrendingKeywordResponse.builder()
                        .keyword(tuple.getValue())
                        .searchCount(tuple.getScore() != null ? tuple.getScore().longValue() : 0)
                        .build());
            }
        }
        return responses;
    }
}
