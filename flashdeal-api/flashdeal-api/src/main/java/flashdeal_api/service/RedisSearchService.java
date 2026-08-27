package flashdeal_api.service;

import flashdeal_api.model.product.TrendingKeywordResponse;

import java.util.List;

public interface RedisSearchService {
    // 1. Nap tu khoa san pham vao Redis ZSET (Autocomplete)
    void indexKeyword(String keyword);

    // 2. Lay danh sach goi y khi nguoi dung go phim
    List<String> getSuggestions(String prefix, int limit);

    // 3. Ghi nhan luot tim kiem cua tu khoa (+1 score)
    void recordSearchKeyword(String keyword);

    // 4. Lay danh sach Top tu khoa tim kiem nhieu nhat
    List<TrendingKeywordResponse> getTopTrendingKeywords(int limit);
}
