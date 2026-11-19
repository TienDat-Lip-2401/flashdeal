# Lỗi backend phát hiện khi làm lại FE (18/11/2026)

Các lỗi dưới đây được phát hiện khi chạy toàn bộ hệ thống bằng Docker và chạy test Playwright. Mỗi mục có cách kiểm chứng và hướng sửa đề xuất. Mục nào đã sửa thì có ghi **✅ Đã khắc phục**, các mục còn lại chưa sửa.

Mức độ: 🔴 nghiêm trọng (bảo mật, mất tiền) · 🟠 sai dữ liệu · 🟡 nhỏ hoặc tài liệu.

---

## 🔴 1. Khách thường gọi được API quản trị đơn hàng — ✅ Đã khắc phục (20/11/2026)

> **Đã sửa:** trong `SecurityConfig`, `/flash-sales/orders/admin/**` và `POST /flash-sales/orders/cancel-expired` yêu cầu `hasRole("ADMIN")`, đặt trước rule `authenticated()`. Thêm `@PreAuthorize("hasRole('ADMIN')")` trên 3 endpoint này trong `OrderController`, làm lớp chặn thứ hai.
> **Kiểm chứng lại:** tài khoản khách gọi `GET /admin/all`, `PUT /admin/{code}/status`, `POST /cancel-expired` → **403**. Tài khoản admin gọi `GET /admin/all` → 200. `GET /my-orders` của khách vẫn 200. Playwright 24/24 pass.

- **Nơi:** `flashsale-order-service` › `SecurityConfig`. `/flash-sales/orders/**` chỉ yêu cầu `authenticated()`, không kiểm tra `ROLE_ADMIN`.
- **Kiểm chứng:** đăng nhập `customer@flashdeal.vn`, gọi `GET /api/flash-sales/orders/admin/all` → **200**, trả về đơn của mọi người (địa chỉ, số điện thoại). `PUT /admin/{code}/status` cũng vượt qua lớp bảo mật (đơn không tồn tại trả 404 thay vì 403).
- **Hậu quả:** lộ thông tin khách; khách tự chuyển đơn của mình sang `SHIPPING` hoặc `DELIVERED` mà không thanh toán.
- **Hướng sửa:** thêm `.requestMatchers("/flash-sales/orders/admin/**").hasRole("ADMIN")` trước rule `authenticated()`. Nên thêm cả `@PreAuthorize`.

## 🔴 2. Ai cũng tạo hoặc xóa được chiến dịch flash sale, không cần đăng nhập — ✅ Đã khắc phục (20/11/2026)

> **Đã sửa:** `GET /flash-sales/campaigns/**` vẫn công khai. Mọi method khác trên `/flash-sales/campaigns/**` (tạo, xóa, thêm sản phẩm) yêu cầu `hasRole("ADMIN")`, có thêm `@PreAuthorize` trong `FlashSaleCampaignController`. Cuối file đổi `anyRequest().permitAll()` thành `denyAll()` (mặc định chặn), và mở riêng `/error` để lỗi 404/500 không bị đổi thành 403.
> **Kiểm chứng lại:** không gửi token, gọi `POST /campaigns`, `POST /campaigns/{id}/products`, `DELETE /campaigns/{id}` → **403**. Tài khoản khách → 403. Tài khoản admin vẫn tạo được (body rỗng → 400 validate). `npm run seed` vẫn chạy được.

- **Nơi:** `flashsale-order-service` › `SecurityConfig`. Chỉ khai báo `GET /flash-sales/campaigns/**` là `permitAll`, nhưng cuối file có `.anyRequest().permitAll()`, nên `POST` và `DELETE` cũng mở.
- **Kiểm chứng:** `POST /api/flash-sales/campaigns` với body rỗng, không gửi token → trả lỗi **validate** (1002), tức request đã vào tới controller.
- **Hướng sửa:** `POST/DELETE /flash-sales/campaigns/**` → `hasRole("ADMIN")`, và đổi `anyRequest()` thành `denyAll()` hoặc `authenticated()`.

## 🔴 3. Ai cũng đánh dấu được đơn là đã thanh toán (`simulate-pay`) — ✅ Đã khắc phục (20/11/2026)

> **Đã sửa:**
> - **Payment-service có JWT:** thêm Spring Security và JWT, dùng chung secret với các service khác. `payment-callback` (bảo vệ bằng chữ ký HMAC của VNPay) và `health` vẫn công khai. Các endpoint `/payments/**` khác cần đăng nhập, phần còn lại `denyAll()`. Chưa đăng nhập thì trả 401 để FE tự làm mới token.
> - **Không tin dữ liệu client:** `OrderClient` gọi `GET /flash-sales/orders/{code}` của order-service bằng chính token của người gọi. Order-service chỉ trả đơn cho chủ đơn hoặc admin, nên một lần gọi vừa kiểm tra quyền vừa lấy được tổng tiền thật. Chỉ chủ đơn mới thanh toán được, và chỉ khi đơn còn `PENDING`; người khác nhận 404, đơn không còn chờ thanh toán nhận 409.
> - **Endpoint giả lập có thể tắt:** `simulate-pay` và `simulate-fail` được tách sang `PaymentSimulateController`, chỉ tồn tại khi `payment.simulate.enabled=true`. Mặc định tắt; `docker-compose.yml` bật cho demo qua `PAYMENT_SIMULATE_ENABLED`. FE chỉ hiện nút "Thanh toán thử" khi `VITE_ENABLE_TEST_PAYMENT=true`.
> - **Bỏ `PUT /flash-sales/orders/{code}/pay`:** trạng thái `PAID` giờ chỉ đến từ `payment.successful.event`.
>
> **Kiểm chứng lại** (request thật qua gateway):
> - Không token gọi `simulate-pay` → 401.
> - Người lạ gọi `simulate-pay`, `simulate-fail`, `create-payment-url` → 404.
> - Admin gọi `simulate-pay` cho đơn người khác → 404.
> - `PUT .../pay` → 404.
> - Chủ đơn gọi `simulate-pay` → 200, đơn chuyển `PAID`. Gọi lần 2 → 409.
> - Tắt cờ thì `simulate-*` → 404.
> - Playwright 24/24 pass.

- **Nơi:** `payment-service`. Service này **không có Spring Security** (không có dependency `spring-boot-starter-security`). `POST /payments/vnpay/simulate-pay?orderCode=...` và `simulate-fail` mở cho mọi người.
- **Hậu quả:** biết mã đơn là thanh toán được mà không trả tiền. Mã đơn lại nằm trong URL và email.
- **Lỗ cùng loại (phát hiện 20/11/2026):** `PUT /flash-sales/orders/{code}/pay` (`OrderServiceImpl.payOrder`) chỉ kiểm tra đúng chủ đơn rồi đặt thẳng `PAID`, không đi qua payment-service. Khách đăng nhập có thể tự đánh dấu đơn của mình là đã thanh toán. FE không gọi endpoint này. Nên bỏ hẳn, hoặc chỉ bật ở dev như `simulate-*`; trạng thái `PAID` chỉ nên đến từ `payment.successful.event`.
- **Lỗ cùng gốc: số tiền do client tự gửi (phát hiện và sửa 20/11/2026).** `create-payment-url` lấy `amount` và `userId` từ body, còn callback VNPay chỉ kiểm tra chữ ký mà không so số tiền. Khách có thể sửa `amount` thành 1.000đ, trả 1.000đ thật, và đơn 18 triệu vẫn thành `PAID`. **Đã sửa:** số tiền lấy từ order-service, request không còn trường `amount`/`userId`/`email`. Callback từ chối đơn chưa tạo yêu cầu thanh toán (mã `01`) và số tiền lệch với đơn (mã `04`). Kiểm chứng bằng callback có chữ ký hợp lệ nhưng sửa số tiền → `04`, đơn vẫn `PENDING`.
- **Hướng sửa:** chỉ bật các endpoint `simulate-*` ở profile `dev` (`@Profile("dev")`, hoặc cờ `payment.simulate.enabled`), và thêm xác thực JWT cho payment-service. FE hiện vẫn hiện nút "Thanh toán thử (môi trường demo)"; khi tắt endpoint thì cần ẩn nút này.

## 🔴 4. Xem được đơn hàng của người khác theo mã đơn (IDOR) — ✅ Đã khắc phục (20/11/2026)

> **Đã sửa:** `getOrderByCode(orderCode, userId, isAdmin)` chỉ trả đơn cho chủ đơn hoặc admin, người khác nhận `ORDER_NOT_FOUND` (404, không phải 403, để không lộ việc đơn có tồn tại). `GET /payments/order/{code}` cần đăng nhập và kiểm tra quyền qua order-service theo cùng quy tắc.
> **Kiểm chứng lại:** người lạ gọi `GET /flash-sales/orders/{code}` hoặc `GET /payments/order/{code}` → 404. Không token → 401. Chủ đơn và admin → 200.

- **Nơi:** `OrderServiceImpl.getOrderByCode(orderCode)` không kiểm tra `order.userId == userId`. `GET /payments/order/{orderCode}` cũng không cần đăng nhập.
- **Hậu quả:** người đăng nhập bất kỳ (hoặc người lạ, với API payment) đọc được địa chỉ, số điện thoại và số tiền của đơn khác.
- **Hướng sửa:** truyền `userId` vào service; trả 404 nếu không phải chủ đơn (trừ admin).

## 🟡 4b. Cấu hình cần đóng lại khi deploy (ghi nhận 20/11/2026, chưa sửa)

- Payment-service (8084) và các service khác mở cổng thẳng ra host, gọi được mà không qua giới hạn tốc độ của gateway. Khi deploy chỉ nên mở cổng gateway.
- Kafka UI (8085) không có đăng nhập, xem được mọi message, kể cả mã đơn. Không nên mở ra ngoài.
- Đường dẫn không tồn tại ở order-service từng trả 500 (do handler bắt `Exception` chung). Đã sửa thành 404/405.

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
