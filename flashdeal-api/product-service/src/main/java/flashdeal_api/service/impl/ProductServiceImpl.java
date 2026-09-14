package flashdeal_api.service.impl;

import flashdeal_api.entity.Category;
import flashdeal_api.entity.Product;
import flashdeal_api.exception.AppException;
import flashdeal_api.exception.ErrorCode;
import flashdeal_api.model.PageResponse;
import flashdeal_api.model.category.CategoryResponse;
import flashdeal_api.model.product.ProductDetailSummaryResponse;
import flashdeal_api.model.product.ProductFilterRequest;
import flashdeal_api.model.product.ProductRequest;
import flashdeal_api.model.product.ProductResponse;
import flashdeal_api.repository.CategoryRepository;
import flashdeal_api.repository.FlashSaleItemRepository;
import flashdeal_api.repository.ProductRepository;
import flashdeal_api.repository.specification.ProductSpecification;
import flashdeal_api.service.ProductService;
import flashdeal_api.service.RedisSearchService;
import flashdeal_api.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final FlashSaleItemRepository flashSaleItemRepository;
    private final RedisSearchService redisSearchService;
    private final flashdeal_api.producer.ProductEventProducer productEventProducer;
    private final Executor productTaskExecutor;

    @Override
    @CacheEvict(value = {"products", "product_filters"}, allEntries = true)
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

        // Ban su kien CREATED vao Kafka topic product.events
        try {
            productEventProducer.publishProductEvent(product, flashdeal_api.model.event.ProductEventType.CREATED);
        } catch (Exception e) {
            // Log error without blocking transaction
        }

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
    @Transactional(readOnly = true)
    public ProductDetailSummaryResponse getProductDetailSummary(Long id) {
        long startTime = System.currentTimeMillis();
        Set<String> threadNames = ConcurrentHashMap.newKeySet();

        // 1. Task 1: Truy vấn thông tin sản phẩm cơ bản (Worker Thread 1)
        CompletableFuture<Product> productFuture = CompletableFuture.supplyAsync(() -> {
            String threadName = Thread.currentThread().getName();
            threadNames.add(threadName);
            log.info("[Multithreading] Task 1 (Product Base) running on thread: {}", threadName);
            return productRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        }, productTaskExecutor);

        // 2. Task 2: Truy vấn thông tin Flash Sale (Worker Thread 2)
        CompletableFuture<ProductDetailSummaryResponse.FlashSaleSummary> flashSaleFuture = CompletableFuture
                .<ProductDetailSummaryResponse.FlashSaleSummary>supplyAsync(() -> {
                    String threadName = Thread.currentThread().getName();
                    threadNames.add(threadName);
                    log.info("[Multithreading] Task 2 (Flash Sale Info) running on thread: {}", threadName);
                    LocalDateTime now = LocalDateTime.now();
                    return flashSaleItemRepository.findActiveFlashSaleItemByProductId(id, flashdeal_api.entity.FlashSaleStatus.HAPPENING, now)
                            .map(item -> {
                                var fs = item.getFlashSale();
                                int available = Math.max(0, item.getSaleQuantity() - (item.getSoldQuantity() != null ? item.getSoldQuantity() : 0));
                                return ProductDetailSummaryResponse.FlashSaleSummary.builder()
                                        .flashSaleId(fs.getId())
                                        .campaignTitle(fs.getTitle())
                                        .flashSalePrice(item.getFlashSalePrice())
                                        .saleQuantity(item.getSaleQuantity())
                                        .soldQuantity(item.getSoldQuantity())
                                        .availableStock(available)
                                        .userLimit(item.getUserLimit())
                                        .startTime(fs.getStartTime())
                                        .endTime(fs.getEndTime())
                                        .status(fs.getStatus().name())
                                        .build();
                            }).orElse(null);
                }, productTaskExecutor).exceptionally(ex -> {
                    log.warn("[Multithreading] Task 2 (Flash Sale Info) fallback to null. Error: {}", ex.getMessage());
                    return null;
                });

        // 3. Task 3: Truy vấn Top 4 sản phẩm liên quan cùng danh mục (Worker Thread 3)
        CompletableFuture<List<ProductResponse>> relatedFuture = productFuture.thenApplyAsync(product -> {
            String threadName = Thread.currentThread().getName();
            threadNames.add(threadName);
            log.info("[Multithreading] Task 3 (Related Products) running on thread: {}", threadName);
            if (product.getCategory() == null) {
                return Collections.<ProductResponse>emptyList();
            }
            List<Product> related = productRepository.findTop4ByCategoryIdAndIdNotAndStatus(
                    product.getCategory().getId(),
                    id,
                    flashdeal_api.entity.ProductStatus.ACTIVE
            );
            return related.stream().map(this::buildProductResponse).collect(Collectors.toList());
        }, productTaskExecutor).exceptionally(ex -> {
            log.warn("[Multithreading] Task 3 (Related Products) fallback to empty list. Error: {}", ex.getMessage());
            return Collections.emptyList();
        });

        // Chờ cả 3 luồng hoàn thành
        CompletableFuture.allOf(productFuture, flashSaleFuture, relatedFuture).join();

        Product product = productFuture.join();
        ProductDetailSummaryResponse.FlashSaleSummary flashSaleSummary = flashSaleFuture.join();
        List<ProductResponse> relatedProducts = relatedFuture.join();

        long executionDuration = System.currentTimeMillis() - startTime;
        List<String> executedList = new ArrayList<>(threadNames);
        Collections.sort(executedList);

        log.info("[Multithreading] Finished ProductDetailSummary for productId={} in {} ms on threads: {}",
                id, executionDuration, executedList);

        return ProductDetailSummaryResponse.builder()
                .product(buildProductResponse(product))
                .flashSale(flashSaleSummary)
                .relatedProducts(relatedProducts)
                .executionTimeMs(executionDuration)
                .executedThreads(executedList)
                .build();
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
        Product updatedProduct = productRepository.save(product);

        // Ban su kien UPDATED vao Kafka topic product.events
        try {
            productEventProducer.publishProductEvent(updatedProduct, flashdeal_api.model.event.ProductEventType.UPDATED);
        } catch (Exception e) {
            // Log error without blocking transaction
        }

        return buildProductResponse(updatedProduct);
    }

    @Override
    @CacheEvict(value = {"products", "product_filters"}, allEntries = true)
    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }
        productRepository.deleteById(id);

        // Ban su kien DELETED vao Kafka topic product.events
        try {
            productEventProducer.publishProductDeletedEvent(id);
        } catch (Exception e) {
            // Log error without blocking transaction
        }
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
