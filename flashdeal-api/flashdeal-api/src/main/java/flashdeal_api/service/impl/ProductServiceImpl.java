package flashdeal_api.service.impl;

import flashdeal_api.entity.Category;
import flashdeal_api.entity.Product;
import flashdeal_api.exception.AppException;
import flashdeal_api.exception.ErrorCode;
import flashdeal_api.model.PageResponse;
import flashdeal_api.model.category.CategoryResponse;
import flashdeal_api.model.product.ProductFilterRequest;
import flashdeal_api.model.product.ProductRequest;
import flashdeal_api.model.product.ProductResponse;
import flashdeal_api.repository.CategoryRepository;
import flashdeal_api.repository.ProductRepository;
import flashdeal_api.repository.specification.ProductSpecification;
import flashdeal_api.service.ProductService;
import flashdeal_api.service.RedisSearchService;
import flashdeal_api.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final RedisSearchService redisSearchService;
    @Override
    @CacheEvict(value = "products", allEntries = true)
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? SlugUtil.toSlug(request.getSlug())
                : SlugUtil.toSlug(request.getName());
        if (productRepository.existsBySlug(slug)) {
            throw new AppException(ErrorCode.PRODUCT_SLUG_EXISTED);
        }
        Product product = productRepository.save(
                Product.builder()
                        .name(request.getName())
                        .slug(slug)
                        .category(category)
                        .originalPrice(request.getOriginalPrice())
                        .totalStock(request.getTotalStock())
                        .description(request.getDescription())
                        .imageUrl(request.getImageUrl())
                        .status(request.getStatus())
                        .build()
        );
        redisSearchService.indexKeyword(product.getName());
        return buildProductResponse(product);

    }

    @Override
    @Cacheable(value = "products", key = "#id")
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        return buildProductResponse(product);
    }

    @Override
    @Cacheable(value = "products", key = "#slug")
    @Transactional(readOnly = true)
    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        return buildProductResponse(product);
    }

    @Override
    @Cacheable(value = "product_filters", key = "#filter.toCacheKey()")
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> filterProducts(ProductFilterRequest filter) {
        if (filter.getKeyword() != null && !filter.getKeyword().trim().isBlank()) {
            redisSearchService.recordSearchKeyword(filter.getKeyword());
        }

        Specification<Product> spec = Specification
                .where(ProductSpecification.hasStatus(filter.getStatus()))
                .and(ProductSpecification.hasKeyword(filter.getKeyword()))
                .and(ProductSpecification.hasCategory(filter.getCategoryId()))
                .and(ProductSpecification.minPrice(filter.getMinPrice()))
                .and(ProductSpecification.maxPrice(filter.getMaxPrice()));
        Sort.Direction direction = "ASC".equalsIgnoreCase(filter.getSortDirection())
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize(), Sort.by(direction, filter.getSortBy()));
        Page<Product> pageData = productRepository.findAll(spec, pageable);

        return PageResponse.<ProductResponse>builder()
                .content(pageData.getContent().stream().map(this::buildProductResponse).collect(Collectors.toList()))
                .page(pageData.getNumber() + 1)
                .size(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .build();

    }

    @Override
    @CacheEvict(value = {"products", "product_filters"}, allEntries = true)
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? SlugUtil.toSlug(request.getSlug())
                : SlugUtil.toSlug(request.getName());
        if (!product.getSlug().equals(slug) && productRepository.existsBySlug(slug)) {
            throw new AppException(ErrorCode.PRODUCT_SLUG_EXISTED);
        }
        product.setName(request.getName());
        product.setSlug(slug);
        product.setCategory(category);
        product.setOriginalPrice(request.getOriginalPrice());
        product.setTotalStock(request.getTotalStock());
        product.setDescription(request.getDescription());
        product.setImageUrl(request.getImageUrl());
        product.setStatus(request.getStatus());
        productRepository.save(product);
        return buildProductResponse(product);
    }

    @Override
    @CacheEvict(value = {"products", "product_filters"}, allEntries = true)
    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }
        productRepository.deleteById(id);
    }

    private ProductResponse buildProductResponse(Product product) {
        CategoryResponse categoryResponse = null;
        if (product.getCategory() != null) {
            categoryResponse = CategoryResponse.builder()
                    .id(product.getCategory().getId())
                    .name(product.getCategory().getName())
                    .slug(product.getCategory().getSlug())
                    .parentId(product.getCategory().getParentId())
                    .displayOrder(product.getCategory().getDisplayOrder())
                    .createdAt(product.getCategory().getCreatedAt())
                    .build();
        }
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .category(categoryResponse)
                .originalPrice(product.getOriginalPrice())
                .totalStock(product.getTotalStock())
                .description(product.getDescription())
                .imageUrl(product.getImageUrl())
                .status(product.getStatus())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
