package flashdeal_api.service;

import flashdeal_api.model.category.CategoryRequest;
import flashdeal_api.model.category.CategoryResponse;

import java.util.List;

public interface CategoryService {
    // Tạo mới danh mục
    CategoryResponse createCategory(CategoryRequest request);
    // Lấy tất cả danh mục sắp xếp theo thứ tự hiển thị (Có Cache Redis)
    List<CategoryResponse> getAllCategories();
    // Lấy chi tiết danh mục theo ID (Có Cache Redis)
    CategoryResponse getCategoryById(Long id);
    // Lấy chi tiết danh mục theo Slug (Có Cache Redis)
    CategoryResponse getCategoryBySlug(String slug);
    // Cập nhật danh mục & Xóa Cache Redis
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    // Xóa danh mục & Xóa Cache Redis
    void deleteCategory(Long id);
}
