package flashdeal_api.repository.specification;

import flashdeal_api.entity.Product;
import flashdeal_api.entity.ProductStatus;
import flashdeal_api.util.SlugUtil;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

public class ProductSpecification {

    // 1. Tìm kiếm theo từ khóa (tìm trong tên sản phẩm và mô tả)
    public static Specification<Product> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return null;
            }
            String cleanKeyword = keyword.trim().toLowerCase();
            String pattern = "%" + cleanKeyword + "%";

            // Chuyển từ khóa thành dạng không dấu (slug): "chuột gaming" -> "chuot-gaming"
            String slugKeyword = "%" + SlugUtil.toSlug(cleanKeyword) + "%";
            String likePattern = "%" + keyword.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), likePattern),
                    cb.like(cb.lower(root.get("description")), likePattern),
                    cb.like(root.get("slug"), slugKeyword)
            );
        };
    }

    // 2. Lọc theo danh mục
    public static Specification<Product> hasCategory(Long categoryId) {
        return (root, query, cb) -> {
            if (categoryId == null) {
                return null;
            }
            return cb.equal(root.get("category").get("id"), categoryId);
        };
    }

    // 3. Lọc theo giá tối thiểu (minPrice)
    public static Specification<Product> minPrice(BigDecimal minPrice) {
        return (root, query, cb) -> {
            if (minPrice == null || minPrice.compareTo(BigDecimal.ZERO) < 0) {
                return null;
            }
            return cb.greaterThanOrEqualTo(root.get("originalPrice"), minPrice);
        };
    }

    // 4. Lọc theo giá tối đa (maxPrice)
    public static Specification<Product> maxPrice(BigDecimal maxPrice) {
        return (root, query, cb) -> {
            if (maxPrice == null) {
                return null;
            }
            return cb.lessThanOrEqualTo(root.get("originalPrice"), maxPrice);
        };
    }

    // 5. Lọc theo trạng thái sản phẩm (mặc định ACTIVE)
    public static Specification<Product> hasStatus(ProductStatus status) {
        return (root, query, cb) -> {
            if (status == null) {
                return null;
            }
            return cb.equal(root.get("status"), status);
        };
    }
}