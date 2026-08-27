package flashdeal_api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import flashdeal_api.entity.ProductStatus;
import flashdeal_api.model.ApiResponse;
import flashdeal_api.model.PageResponse;
import flashdeal_api.model.product.ProductFilterRequest;
import flashdeal_api.model.product.ProductRequest;
import flashdeal_api.model.product.ProductResponse;
import flashdeal_api.model.product.TrendingKeywordResponse;
import flashdeal_api.service.ProductService;
import flashdeal_api.service.RedisSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@Tag(name = "Product Controller", description = "Quản lý sản phẩm & Lọc tìm kiếm")
public class ProductController {

    private final ObjectMapper objectMapper;
    private final ProductService productService;
    private final RedisSearchService redisSearchService;
    // 1. TẠO MỚI SẢN PHẨM
    @PostMapping
    @Operation(summary = "Tạo mới sản phẩm")
    public ResponseEntity<ApiResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        ProductResponse result = productService.createProduct(request);
        ApiResponse response = ApiResponse.builder()
                .code(200)
                .data(objectMapper.valueToTree(result))
                .message("Create product successfully")
                .build();
        return ResponseEntity.ok(response);
    }

    // 2. LỌC & TÌM KIẾM SẢN PHẨM VỚI @RequestParam
    @GetMapping
    @Operation(summary = "Lọc & Tìm kiếm sản phẩm đa tiêu chí")
    public ResponseEntity<ApiResponse> filterProducts(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "minPrice", required = false) BigDecimal minPrice,
            @RequestParam(value = "maxPrice", required = false) BigDecimal maxPrice,
            @RequestParam(value = "status", required = false) ProductStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(value = "sortDirection", defaultValue = "DESC") String sortDirection
    ) {
        ProductFilterRequest filter = ProductFilterRequest.builder()
                .keyword(keyword)
                .categoryId(categoryId)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .status(status != null ? status : ProductStatus.ACTIVE)
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        PageResponse<ProductResponse> dtos = productService.filterProducts(filter);
        ApiResponse response = ApiResponse.builder()
                .code(200)
                .data(objectMapper.valueToTree(dtos.getContent()))
                .meta(ApiResponse.Meta.builder()
                        .page(dtos.getPage())
                        .total(dtos.getTotalElements())
                        .pageOfNumber(dtos.getTotalPages())
                        .build())
                .message("Get products successfully")
                .build();
        return ResponseEntity.ok(response);
    }

    // 3. LẤY CHI TIẾT SẢN PHẨM THEO ID
    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết sản phẩm theo ID")
    public ResponseEntity<ApiResponse> getProductById(@PathVariable("id") Long id) {
        ProductResponse result = productService.getProductById(id);
        ApiResponse response = ApiResponse.builder()
                .code(200)
                .data(objectMapper.valueToTree(result))
                .message("Get product detail successfully")
                .build();
        return ResponseEntity.ok(response);
    }

    // 4. LẤY CHI TIẾT SẢN PHẨM THEO SLUG
    @GetMapping("/slug/{slug}")
    @Operation(summary = "Lấy chi tiết sản phẩm theo Slug")
    public ResponseEntity<ApiResponse> getProductBySlug(@PathVariable("slug") String slug) {
        ProductResponse result = productService.getProductBySlug(slug);
        ApiResponse response = ApiResponse.builder()
                .code(200)
                .data(objectMapper.valueToTree(result))
                .message("Get product detail successfully")
                .build();
        return ResponseEntity.ok(response);
    }

    // 5. CẬP NHẬT SẢN PHẨM
    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật sản phẩm")
    public ResponseEntity<ApiResponse> updateProduct(@PathVariable("id") Long id, @Valid @RequestBody ProductRequest request) {
        ProductResponse result = productService.updateProduct(id, request);
        ApiResponse response = ApiResponse.builder()
                .code(200)
                .data(objectMapper.valueToTree(result))
                .message("Update product successfully")
                .build();
        return ResponseEntity.ok(response);
    }

    // 6. XÓA SẢN PHẨM
    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa sản phẩm")
    public ResponseEntity<ApiResponse> deleteProduct(@PathVariable("id") Long id) {
        productService.deleteProduct(id);
        ApiResponse response = ApiResponse.builder()
                .code(200)
                .message("Delete product successfully")
                .build();
        return ResponseEntity.ok(response);
    }

    // 7. GỢI Ý TÌM KIẾM AUTOCOMPLETE
    @GetMapping("/search/suggestions")
    @Operation(summary = "Gợi ý từ khóa tìm kiếm Autocomplete khi gõ phím (<2ms từ Redis)")
    public ResponseEntity<ApiResponse> getSuggestions(
            @RequestParam("q") String query,
            @RequestParam(value = "limit", defaultValue = "10") int limit
    ) {
        List<String> suggestions = redisSearchService.getSuggestions(query, limit);
        ApiResponse response = ApiResponse.builder()
                .code(200)
                .data(objectMapper.valueToTree(suggestions))
                .message("Get search suggestions successfully")
                .build();
        return ResponseEntity.ok(response);
    }

    // 8. BANG XEP HANG TOP TRENDING SEARCH
    @GetMapping("/search/trending")
    @Operation(summary = "Lay danh sach Top 10 tu khoa tim kiem hot nhat tu Redis ZSET")
    public ResponseEntity<ApiResponse> getTrendingKeywords(
            @RequestParam(value = "limit", defaultValue = "10") int limit
    ) {
        List<TrendingKeywordResponse> trendingList = redisSearchService.getTopTrendingKeywords(limit);
        ApiResponse response = ApiResponse.builder()
                .code(200)
                .data(objectMapper.valueToTree(trendingList))
                .message("Get trending search keywords successfully")
                .build();
        return ResponseEntity.ok(response);
    }

}
