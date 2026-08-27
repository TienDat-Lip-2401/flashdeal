package flashdeal_api.service;

import flashdeal_api.model.PageResponse;
import flashdeal_api.model.product.ProductFilterRequest;
import flashdeal_api.model.product.ProductRequest;
import flashdeal_api.model.product.ProductResponse;

public interface ProductService {
    ProductResponse createProduct(ProductRequest request);
    ProductResponse getProductById(Long id);
    ProductResponse getProductBySlug(String slug);
    PageResponse<ProductResponse> filterProducts(ProductFilterRequest filter);
    ProductResponse updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);
}
