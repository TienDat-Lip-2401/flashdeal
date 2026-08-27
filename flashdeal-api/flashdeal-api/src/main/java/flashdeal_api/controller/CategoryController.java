package flashdeal_api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import flashdeal_api.model.ApiResponse;
import flashdeal_api.model.category.CategoryRequest;
import flashdeal_api.model.category.CategoryResponse;
import flashdeal_api.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@Tag(name = "Category Controller", description = "Quản lý danh mục sản phẩm")
public class CategoryController {
    private final CategoryService categoryService;
    private final ObjectMapper objectMapper;

    @PostMapping
    @Operation(summary = "Tạo mới danh mục sản phẩm")
    public ResponseEntity<ApiResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse result = categoryService.createCategory(request);
        ApiResponse response = ApiResponse.builder()
                .code(200)
                .data(objectMapper.valueToTree(result))
                .message("Create category successfully")
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Lấy tất cả danh mục")
    public ResponseEntity<ApiResponse> getAllCategories() {
        List<CategoryResponse> result = categoryService.getAllCategories();
        ApiResponse response = ApiResponse.builder()
                .code(200)
                .data(objectMapper.valueToTree(result))
                .message("Get categories successfully")
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết danh mục theo ID")
    public ResponseEntity<ApiResponse> getCategoryById(@PathVariable("id") Long id) {
        CategoryResponse result = categoryService.getCategoryById(id);
        ApiResponse response = ApiResponse.builder()
                .code(200)
                .data(objectMapper.valueToTree(result))
                .message("Get category detail successfully")
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Lấy chi tiết danh mục theo Slug")
    public ResponseEntity<ApiResponse> getCategoryBySlug(@PathVariable("slug") String slug) {
        CategoryResponse result = categoryService.getCategoryBySlug(slug);
        ApiResponse response = ApiResponse.builder()
                .code(200)
                .data(objectMapper.valueToTree(result))
                .message("Get category detail successfully")
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật danh mục")
    public ResponseEntity<ApiResponse> updateCategory(@PathVariable("id") Long id, @Valid @RequestBody CategoryRequest request) {
        CategoryResponse result = categoryService.updateCategory(id, request);
        ApiResponse response = ApiResponse.builder()
                .code(200)
                .data(objectMapper.valueToTree(result))
                .message("Update category successfully")
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa danh mục")
    public ResponseEntity<ApiResponse> deleteCategory(@PathVariable("id") Long id) {
        categoryService.deleteCategory(id);
        ApiResponse response = ApiResponse.builder()
                .code(200)
                .message("Delete category successfully")
                .build();
        return ResponseEntity.ok(response);
    }

}
