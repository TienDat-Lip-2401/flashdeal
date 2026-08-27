package flashdeal_api.service.impl;

import flashdeal_api.entity.Category;
import flashdeal_api.exception.AppException;
import flashdeal_api.exception.ErrorCode;
import flashdeal_api.model.category.CategoryRequest;
import flashdeal_api.model.category.CategoryResponse;
import flashdeal_api.repository.CategoryRepository;
import flashdeal_api.service.CategoryService;
import flashdeal_api.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;
    private final flashdeal_api.repository.ProductRepository productRepository;

    @Override
    @CacheEvict(value = "categories", allEntries = true)
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? SlugUtil.toSlug(request.getSlug())
                : SlugUtil.toSlug(request.getName());
        if (categoryRepository.existsBySlug(slug)) {
            throw new AppException(ErrorCode.CATEGORY_SLUG_EXISTED);
        }
        Category category = Category.builder()
                .name(request.getName())
                .slug(slug)
                .parentId(request.getParentId())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();
        categoryRepository.save(category);
        return buildCategoryResponse(category);
    }

    @Override
    @Cacheable(value = "categories", key = "'all'")
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::buildCategoryResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "categories", key = "#id")
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        return buildCategoryResponse(category);
    }

    @Override
    @Cacheable(value = "categories", key = "#slug")
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        return buildCategoryResponse(category);
    }

    @Override
    @CacheEvict(value = "categories", allEntries = true)
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? SlugUtil.toSlug(request.getSlug())
                : SlugUtil.toSlug(request.getName());
        if (!category.getSlug().equals(slug) && categoryRepository.existsBySlug(slug)) {
            throw new AppException(ErrorCode.CATEGORY_SLUG_EXISTED);
        }
        category.setName(request.getName());
        category.setSlug(slug);
        category.setParentId(request.getParentId());
        if (request.getDisplayOrder() != null) {
            category.setDisplayOrder(request.getDisplayOrder());
        }
        categoryRepository.save(category);
        return buildCategoryResponse(category);
    }

    @Override
    @CacheEvict(value = {"categories", "products", "product_filters"}, allEntries = true)
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // Khong cho phep xoa danh muc mac dinh Chua phan loai
        if ("chua-phan-loai".equalsIgnoreCase(category.getSlug())) {
            throw new AppException(ErrorCode.CANNOT_DELETE_DEFAULT_CATEGORY);
        }

        // Tim hoac tao danh muc mac dinh Chua phan loai
        Category uncategorized = categoryRepository.findBySlug("chua-phan-loai")
                .orElseGet(() -> categoryRepository.save(
                        Category.builder()
                                .name("Chưa phân loại")
                                .slug("chua-phan-loai")
                                .displayOrder(999)
                                .build()
                ));

        // Chuyen toan bo san pham cua danh muc bi xoa sang danh muc Chua phan loai
        productRepository.updateCategoryForProducts(id, uncategorized);

        // Xoa danh muc
        categoryRepository.delete(category);
    }

    private CategoryResponse buildCategoryResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .parentId(category.getParentId())
                .displayOrder(category.getDisplayOrder())
                .createdAt(category.getCreatedAt())
                .build();
    }
}
