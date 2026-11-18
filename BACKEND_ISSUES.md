# Lỗi backend phát hiện khi làm lại FE (18/11/2026)

Các lỗi dưới đây được phát hiện khi chạy toàn bộ hệ thống bằng Docker và chạy test Playwright. **Code backend chưa được sửa**; mỗi mục có cách kiểm chứng và hướng sửa đề xuất để bạn chọn.

Mức độ: 🔴 nghiêm trọng (bảo mật, mất tiền) · 🟠 sai dữ liệu · 🟡 nhỏ hoặc tài liệu.

---

## 🔴 1. Khách thường gọi được API quản trị đơn hàng

- **Nơi:** `flashsale-order-service` › `SecurityConfig`. `/flash-sales/orders/**` chỉ yêu cầu `authenticated()`, không kiểm tra `ROLE_ADMIN`.
- **Kiểm chứng:** đăng nhập `customer@flashdeal.vn`, gọi `GET /api/flash-sales/orders/admin/all` → **200**, trả về đơn của mọi người (địa chỉ, số điện thoại). `PUT /admin/{code}/status` cũng vượt qua lớp bảo mật (đơn không tồn tại trả 404 thay vì 403).
- **Hậu quả:** lộ thông tin khách; khách tự chuyển đơn của mình sang `SHIPPING` hoặc `DELIVERED` mà không thanh toán.
- **Hướng sửa:** thêm `.requestMatchers("/flash-sales/orders/admin/**").hasRole("ADMIN")` trước rule `authenticated()`. Nên thêm cả `@PreAuthorize`.

## 🔴 2. Ai cũng tạo hoặc xóa được chiến dịch flash sale, không cần đăng nhập

- **Nơi:** `flashsale-order-service` › `SecurityConfig`. Chỉ khai báo `GET /flash-sales/campaigns/**` là `permitAll`, nhưng cuối file có `.anyRequest().permitAll()`, nên `POST` và `DELETE` cũng mở.
- **Kiểm chứng:** `POST /api/flash-sales/campaigns` với body rỗng, không gửi token → trả lỗi **validate** (1002), tức request đã vào tới controller.
- **Hướng sửa:** `POST/DELETE /flash-sales/campaigns/**` → `hasRole("ADMIN")`, và đổi `anyRequest()` thành `denyAll()` hoặc `authenticated()`.

## 🔴 3. Ai cũng đánh dấu được đơn là đã thanh toán (`simulate-pay`)

- **Nơi:** `payment-service`. Service này **không có Spring Security** (không có dependency `spring-boot-starter-security`). `POST /payments/vnpay/simulate-pay?orderCode=...` và `simulate-fail` mở cho mọi người.
- **Hậu quả:** biết mã đơn là thanh toán được mà không trả tiền. Mã đơn lại nằm trong URL và email.
- **Hướng sửa:** chỉ bật các endpoint `simulate-*` ở profile `dev` (`@Profile("dev")`, hoặc cờ `payment.simulate.enabled`), và thêm xác thực JWT cho payment-service. FE hiện vẫn hiện nút "Thanh toán thử (môi trường demo)"; khi tắt endpoint thì cần ẩn nút này.

## 🔴 4. Xem được đơn hàng của người khác theo mã đơn (IDOR)

- **Nơi:** `OrderServiceImpl.getOrderByCode(orderCode)` không kiểm tra `order.userId == userId`. `GET /payments/order/{orderCode}` cũng không cần đăng nhập.
- **Hậu quả:** người đăng nhập bất kỳ (hoặc người lạ, với API payment) đọc được địa chỉ, số điện thoại và số tiền của đơn khác.
- **Hướng sửa:** truyền `userId` vào service; trả 404 nếu không phải chủ đơn (trừ admin).

## 🟠 5. Gợi ý tìm kiếm không cập nhật khi đổi tên hoặc xóa sản phẩm

- **Nơi:** `product-service` › `RedisSearchService` (ZSET `search:suggestions`).
- **Kiểm chứng:** sau khi đổi tên "AirPods 3" → "AirPods 2" và "Sony WH-1000XM4" → "XM3", `GET /products/search/suggestions?q=airpods` vẫn trả `"airpods 3"`, còn `q=sony` chỉ trả `"sony wh-1000xm4"` (tên cũ). Sản phẩm Dell đã xóa có lẽ cũng còn trong gợi ý.
- **Hướng sửa:** trong `updateProduct`, `ZREM` tên cũ rồi `ZADD` tên mới; trong `deleteProduct`, `ZREM` tên.

## 🟠 6. Tên sản phẩm trong chiến dịch bị lưu cứng, lệch khi sửa sản phẩm

- **Nơi:** `flash_sale_products.product_name` (order-service) lưu bản sao tên lúc thêm vào chiến dịch. Event `product.events` có được consume, nhưng không cập nhật tên này.
- **Kiểm chứng:** `GET /flash-sales/campaigns/1` vẫn trả "Apple Watch Series 9 GPS 45mm" và "Sony WH-1000XM4", dù product-service đã đổi tên.
- **Hệ quả:** tên trong đơn hàng (`order_items.product_name`) cũng là tên cũ. FE hiện tự ghép tên và ảnh từ product-service theo `productId` để che lỗi này.
- **Hướng sửa:** khi nhận `ProductEvent` loại UPDATED, cập nhật `product_name` và `original_price` của các dòng chiến dịch **chưa kết thúc**.

## 🟠 7. `detail-summary` lấy flash sale từ bảng cũ của product-service

- **Nơi:** `ProductServiceImpl.getProductDetailSummary` đọc `FlashSaleItemRepository` của product-service (bảng `flash_sales` cũ, từ trước khi tách service). Chiến dịch thật nằm ở order-service.
- **Hệ quả:** trường `flashSale` trong response luôn trống. FE chỉ dùng `relatedProducts`, còn giá flash sale thì lấy từ `/flash-sales/campaigns`.
- **Hướng sửa:** bỏ phần flash sale khỏi summary, hoặc gọi sang order-service. Nên xóa luôn các entity cũ trong product-service (`Order`, `User`, `PaymentTransaction`, `FlashSale*`).

## 🟡 8. Giá trả về dạng số mũ (`1.899E+7`)

- **Nơi:** product-service serialize `BigDecimal` qua `objectMapper.valueToTree`, ra `"originalPrice":1.899E+7`.
- JavaScript vẫn đọc đúng, nhưng client khác (hoặc người đọc log) dễ hiểu sai.
- **Hướng sửa:** `spring.jackson.generator.write-bigdecimal-as-plain: true`, hoặc `JsonNodeFactory.withExactBigDecimals(true)`.

## 🟡 9. CORS cho mọi origin kèm credentials

- **Nơi:** `api-gateway` › `CorsConfig`: `allowedOriginPatterns("*")` cùng `allowCredentials(true)`.
- **Hướng sửa:** đưa danh sách origin vào cấu hình (`http://localhost:5173` khi dev, domain thật khi chạy production).

## 🟡 10. Sai tài khoản mẫu trong README

- README ghi `admin@flashdeal.vn / Admin123@` và `customer1@flashdeal.vn / Customer123@`.
- `DataInitializer` thực tế tạo **`admin@flashdeal.vn / Admin@123`** và **`customer@flashdeal.vn / Password@123`**.

## 🟡 11. Thiếu trường tên người nhận trong đơn

- `FlashSaleOrderRequest` chỉ có `shippingAddress`, `phone` và `email`. FE đang ghép `"Họ tên – địa chỉ"` vào `shippingAddress`.
- **Hướng sửa:** thêm `recipientName` vào request, entity và response.

## 🟡 12. Lưu ý khi chạy chung máy với dự án khác

- Gateway (8080) và auth-service (8081) trùng cổng với dự án `elearning` đang chạy trên máy.
- Lần này mình chạy FlashDeal bằng một file compose override ngoài repo, đổi gateway sang **8090** và auth sang **8091**. FE trỏ tới cổng 8090 qua `flashdeal-fe/.env.local`.
- Nên cho phép đổi cổng host bằng biến môi trường trong `docker-compose.yml`, ví dụ `"${GATEWAY_PORT:-8080}:8080"`.
