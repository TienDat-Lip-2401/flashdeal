# ⚡ FLASHDEAL ENTERPRISE – HỆ THỐNG FLASHSALE CHỊU TẢI CAO & ĐẶT HÀNG PHÂN TÁN

> **Dự án**: Nền tảng Thương mại Điện tử Săn Deal Flash Sale Tốc Độ Cao  
> **Kiến trúc**: Event-Driven Microservices (Spring Boot 3.4.1), Apache Kafka (KRaft), Redis 7 In-Memory, PostgreSQL 16 (Shared-Nothing / Database-per-Service), React 19 Frontend, Docker Containerization.  
> **Hiệu năng thực nghiệm**: Phản hồi đơn hàng `< 5ms`, Cổng chặn kho Redis `< 1.5ms`, Gom dữ liệu đa luồng `12ms`, Chặn trùng lặp Idempotency `< 1.5ms`, Tự động bồi hoàn Saga `< 1s`.

---

## 📑 MỤC LỤC TỔNG QUAN
1. [Tổng quan Kiến trúc Hệ thống (System Architecture)](#1-tổng-quan-kiến-trúc-hệ-thống)
2. [Chi tiết 6 Microservices & 4 CSDL Độc Lập](#2-chi-tiết-6-microservices--4-csdl-độc-lập)
3. [Bộ 6 Trụ Cột Kỹ Thuật Doanh Nghiệp (Enterprise Resiliency Patterns)](#3-bộ-6-trụ-cột-kỹ-thuật-doanh-nghiệp)
   - 3.1. [Route-Level Rate Limiter (Redis Token Bucket)](#31-route-level-rate-limiter-redis-token-bucket)
   - 3.2. [API Composition Aggregator Đa Luồng (Java Concurrency 12ms)](#32-api-composition-aggregator-đa-luồng-java-concurrency-12ms)
   - 3.3. [Kafka Dead Letter Topic (DLT) & Phục Hồi Tự Động](#33-kafka-dead-letter-topic-dlt--phục-hồi-tự-động)
   - 3.4. [Tính Lũy Đẳng Toàn Diện (Hybrid Idempotency Pattern)](#34-tính-lũy-đẳng-toàn-diện-hybrid-idempotency-pattern)
   - 3.5. [Transactional Outbox Pattern (Zero Dual-Write & Chaos Resilience)](#35-transactional-outbox-pattern-zero-dual-write--chaos-resilience)
   - 3.6. [Choreography Saga Pattern (Giao Dịch Bồi Hoàn Phân Tán)](#36-choreography-saga-pattern-giao-dịch-bồi-hoàn-phân-tán)
4. [Động Cơ Săn Deal & Quản Lý Vòng Đời Đơn Hàng](#4-động-cơ-săn-deal--quản-lý-vòng-đời-đơn-hàng)
5. [Bản Đồ Ứng Dụng Redis & Apache Kafka Topics](#5-bản-đồ-ứng-dụng-redis--apache-kafka-topics)
6. [Hướng Dẫn Khởi Chạy 1-Click Bằng Docker](#6-hướng-dẫn-khởi-chạy-1-click-bằng-docker)
7. [Bộ 5 Kịch Bản Kiểm Thử Thực Chiến (Verification Cookbook)](#7-bộ-5-kịch-bản-kiểm-thử-thực-chiến)

---

# 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Hệ thống được thiết kế theo mô hình **Event-Driven Microservices** chuẩn Enterprise, tuân thủ nguyên tắc **Database-per-Service** (Mỗi dịch vụ sở hữu cơ sở dữ liệu riêng biệt), giúp mở rộng linh hoạt (Scalability), cô lập lỗi (Fault Isolation) và đạt hiệu năng chịu tải cao thông qua **Redis In-Memory** và **Apache Kafka Message Broker**.

```
                                  ┌────────────────────────────────────────┐
                                  │       React 19 Frontend (:5173)        │
                                  │      (Vite + Tailwind CSS + Lucide)    │
                                  └───────────────────┬────────────────────┘
                                                      │ HTTP / REST (Idempotency-Key Header)
                                                      ▼
                                  ┌────────────────────────────────────────┐
                                  │      API GATEWAY SERVICE (:8080)       │
                                  │ • Route Rate Limiting (Token Bucket)   │
                                  │ • Dynamic Routing & Centralized CORS   │
                                  └───────┬──────────┬──────────┬──────────┘
                                          │          │          │
                 ┌────────────────────────┘          │          └────────────────────────┐
                 ▼                                   ▼                                   ▼
      ┌──────────────────────┐            ┌──────────────────────┐            ┌──────────────────────┐
      │  AUTH SERVICE (:8081)│            │PRODUCT SERVICE (:8082│            │FLASHSALE-ORDER (:8083│
      │ • Stateless JWT Auth │            │• BFF Parallel (12ms) │            │• Lua Script FastGate │
      │ • DB: auth_db        │            │• DB: product_db      │            │• DB: order_db        │
      │ • Redis: Blacklist   │            │• Redis: ZSET Search  │            │• Hybrid Idempotency  │
      └──────────┬───────────┘            └──────────┬───────────┘            └──────────┬───────────┘
                 │ user.registered.event             │ product.events                    │ flashsale.order.created
                 │ (2 Partitions)                    │ (3 Partitions)                    │ (4 Partitions)
                 │                                   │                                   │
                 │         ┌─────────────────────────┴───────────────────────────────────┘
                 │         │                     ▲                     ▲
                 │         │                     │ payment.successful  │ payment.failed.event (SAGA)
                 │         │                     │ (2 Partitions)      │ (2 Partitions)
                 ▼         ▼                     │                     │
      ┌────────────────────────────────────────────────────────┐       │     ┌──────────────────────┐
      │              APACHE KAFKA BROKER (:9092)               │◄──────┴─────┤PAYMENT SERVICE (:8084│
      │ • KRaft Distributed Log                                │             │• DB: payment_db      │
      │ • Fault-Tolerance: Dead Letter Topics (.DLT)           │             │• Transactional Outbox│
      │ • Topics: order.created, payment.successful, failed    │             │• VNPay & VietQR Gate │
      └────────────────────────────┬───────────────────────────┘             └──────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ NOTIFICATION (:8086) │
                        │ • Thymeleaf Engine   │
                        │ • Gmail SMTP Sender  │
                        └──────────────────────┘
```

---

# 2. CHI TIẾT 6 MICROSERVICES & 4 CSDL ĐỘC LẬP

Tuân thủ kiến trúc **Shared-Nothing**, các microservices sở hữu database độc lập hoàn toàn trong PostgreSQL 16:

| Service | Port | Database | Công nghệ Cốt lõi | Trách nhiệm Nghiệp vụ Chính |
| :--- | :---: | :---: | :--- | :--- |
| **API Gateway** | `8080` | *Không dùng* | Spring Cloud Gateway, Redis Token Bucket | • Cổng vào duy nhất tiếp nhận request từ Client, điều hướng động.<br/>• **Rate Limiting theo Route**: Bảo vệ hệ thống khỏi DDoS/Spam bằng Redis Token Bucket.<br/>• Xử lý CORS tập trung, OpenAPI Swagger Aggregator. |
| **Auth Service** | `8081` | PostgreSQL (`auth_db`) | Spring Security, JJWT, Redis | • Đăng ký, đăng nhập, cấp phát cặp Token (Access Token 15p + Refresh Token 7 ngày).<br/>• Phân quyền RBAC (`ROLE_CUSTOMER`, `ROLE_ADMIN`).<br/>• Xoay vòng Refresh Token (Token Rotation) & Logout an toàn với Redis Blacklist. |
| **Product Service** | `8082` | PostgreSQL (`product_db`) | Spring Data JPA, Redis ZSET, Multithreading | • Quản lý danh mục & sản phẩm.<br/>• **API Composition Aggregator đa luồng**: Gom thông tin chi tiết siêu tốc trong **`12ms`**.<br/>• Tìm kiếm Autocomplete `< 2ms` bằng Redis ZSET Lexicographical & Top 10 xu hướng thời gian thực. |
| **FlashSale Order** | `8083` | PostgreSQL (`order_db`) | Redis Lua Script, Spring AOP, Kafka Streams | • Quản trị chiến dịch Flash Sale & khung giờ mở bán.<br/>• **Cổng chặn Fast-Gate Lua Script**: Trừ kho RAM trong **`1.5ms`**, chống âm kho và chống mua trùng.<br/>• **Idempotency Hybrid Pattern**: Chặn đứng click spam trong **`< 1.5ms`** qua Redis `SETNX`.<br/>• **Saga Participant**: Tiếp nhận sự kiện hủy thanh toán và bồi hoàn tồn kho tự động. |
| **Payment Service** | `8084` | PostgreSQL (`payment_db`) | VNPay SDK, VietQR, Transactional Outbox | • Tích hợp Cổng thanh toán **VNPAY Sandbox** & sinh mã **VietQR động**.<br/>• **Transactional Outbox Pattern**: Đảm bảo At-Least-Once Delivery, triệt tiêu Dual-Write.<br/>• **Saga Initiator**: Khởi phát sự kiện thanh toán thất bại `payment.failed.event` kích hoạt bồi hoàn. |
| **Notification** | `8086` | *Không dùng* | Spring Kafka, Thymeleaf, JavaMail | • Lắng nghe các Kafka Events (`user.registered`, `order.created`, `payment.successful`).<br/>• Render giao diện hóa đơn đặt hàng bằng Thymeleaf Engine.<br/>• Gửi Email xác nhận tự động qua Gmail SMTP. |

---

# 3. BỘ 6 TRỤ CỘT KỸ THUẬT DOANH NGHIỆP

Hệ thống được tích hợp 6 chốt chặn kiến trúc chuyên sâu giúp đảm bảo độ ổn định, tính nhất quán dữ liệu và khả năng chịu tải đỉnh:

### 3.1. Route-Level Rate Limiter (Redis Token Bucket)
* **Vị trí**: `api-gateway`.
* **Cơ chế**: Thuật toán **Token Bucket** trên nền Redis:
  - Cấu hình hạn ngạch request độc lập theo từng loại tài nguyên (ví dụ: route Đặt hàng có hạn mức khắt khe hơn route Tra cứu thông tin).
  - Khi người dùng gửi vượt quá hạn mức cho phép, Gateway lập tức phản hồi mã lỗi chuẩn **`HTTP 429 Too Many Requests`** mà không gây áp lực xuống các microservices bên dưới.

### 3.2. API Composition Aggregator Đa Luồng (Java Concurrency 12ms)
* **Vị trí**: `product-service` (`GET /api/products/{id}/detail-summary`).
* **Cơ chế**:
  - Gom đồng thời 4 nguồn dữ liệu độc lập: Thông tin chi tiết sản phẩm, Tồn kho Flash Sale, Danh mục liên quan, và Thống kê kho.
  - Sử dụng `ThreadPoolTaskExecutor` (16 worker threads chuyên biệt) kết hợp `CompletableFuture.allOf()` để song song hóa các tác vụ.
  - **Kết quả thực nghiệm**: Giảm độ trễ từ $60ms \rightarrow \mathbf{12ms}$ (tối ưu hóa gấp 5 lần).

### 3.3. Kafka Dead Letter Topic (DLT) & Phục Hồi Tự Động
* **Vị trí**: `flashsale-order-service` và toàn bộ Kafka Consumers.
* **Cơ chế**:
  - Khi một thông điệp gặp lỗi hạ tầng hoặc ngoại lệ tạm thời, `DefaultErrorHandler` kích hoạt cơ chế thử lại **3 lần (mỗi lần cách nhau 2 giây)** với `FixedBackOff(2000L, 3)`.
  - Nếu sau 3 lần vẫn thất bại, `DeadLetterPublishingRecoverer` tự động bọc thông điệp kèm toàn bộ Header chẩn đoán lỗi (`kafka_dlt-exception-message`, `kafka_dlt-original-offset`...) và chuyển sang topic cách ly:
    * `flashsale.order.created.DLT` (4 partitions)
    * `payment.successful.event.DLT` (2 partitions)
    * `payment.failed.event.DLT` (2 partitions)
  - `OrderDltConsumer` tiếp nhận, in cảnh báo chi tiết phục vụ giám sát, cảnh báo và replay dữ liệu.
  - **Lợi ích**: Triệt tiêu hoàn toàn nguy cơ **Mất đơn hàng (Data Loss)** và **Tắc nghẽn hàng đợi (Poison Pill)**.

### 3.4. Tính Lũy Đẳng Toàn Diện (Hybrid Idempotency Pattern)
* **Vị trí**: `flashsale-order-service` (`POST /api/flash-sales/orders`) & `flashdeal-fe`.
* **Cơ chế**:
  1. **Mô hình lai (Hybrid)**:
     - **Ưu tiên 1**: Đọc Header `Idempotency-Key` (UUIDv4) do Frontend tự động sinh khi người dùng bấm nút Săn Deal.
     - **Phao cứu sinh (Fallback)**: Nếu Client không gửi Header, Backend tự động băm mã MD5 `MD5(userId + ":" + campaignId + ":" + productId)`.
  2. **Chốt chặn nguyên tử Redis RAM**:
     - Khi nhận request: Thực thi lệnh nguyên tử `SET key "PROCESSING" NX EX 30` (30 giây khóa tạm phòng server crash).
     - Nếu key đã tồn tại $\rightarrow$ Trả ngay mã chuẩn quốc tế **`HTTP 409 Conflict (code: 1090)`** trong vòng **$< 1.5ms$**.
     - Khi đơn hàng tạo thành công: Cập nhật `SET key "COMPLETED" EX 120` (giữ khóa 120 giây chống spam click).
     - Nếu gặp ngoại lệ nghiệp vụ (hết hàng, hết giờ): Tự động xóa key (`DEL`) để giải phóng lượt mua cho khách.
  3. **Đồng bộ Frontend**: Frontend bắt mã lỗi `1090` và hiển thị cảnh báo thân thiện: *"Yêu cầu của bạn đang được xử lý hoặc đã hoàn tất. Vui lòng không thao tác lặp lại!"*.

### 3.5. Transactional Outbox Pattern (Zero Dual-Write & Chaos Resilience)
* **Vị trí**: `payment-service` (`payment_db.outbox_events`).
* **Cơ chế**:
  - **Giải quyết bài toán Dual-Write**: Không gọi Kafka trực tiếp trong transaction của HTTP Request để tránh tình huống DB commit thành công nhưng mạng gửi Kafka bị lỗi.
  - **Lưu trữ nguyên tử**: Bản ghi thanh toán `Payment` và sự kiện `OutboxEvent` (status: `PENDING`) được lưu trong cùng **1 Database Transaction (`@Transactional`)** duy nhất.
  - **Worker quét thông minh**: `OutboxScheduler` chạy mỗi 1 giây sử dụng native query `SELECT ... FOR UPDATE SKIP LOCKED` để lấy các sự kiện `PENDING` $\rightarrow$ chuyển sang `PROCESSING` $\rightarrow$ phát tán Kafka $\rightarrow$ cập nhật `PUBLISHED`.
  - **Chống tranh chấp đa pod**: Nhờ `SKIP LOCKED`, khi scale nhiều instance của payment-service, các container không bao giờ bị khóa tranh chấp hay gửi trùng sự kiện.
  - **Khả năng chịu lỗi (Chaos Resilience)**: Khi Kafka Broker gặp sự cố hoặc sập hoàn toàn, payment-service vẫn phản hồi thanh toán bình thường. Khi Kafka hoạt động trở lại, scheduler sẽ tự động gửi bù (At-Least-Once Delivery).
  - **Housekeeping tự động**: Tự động dọn dẹp các sự kiện `PUBLISHED` cũ hơn 3 ngày định kỳ lúc 02:00 AM.

### 3.6. Choreography Saga Pattern (Giao Dịch Bồi Hoàn Phân Tán)
* **Vị trí**: Phối hợp giữa `payment-service` và `flashsale-order-service`.
* **Cơ chế**:
  - Khi thanh toán thất bại hoặc người dùng hủy thanh toán VNPay (mã phản hồi != `00`):
    1. `payment-service` ghi nhận sự kiện `PaymentFailedEvent` vào bảng `outbox_events`.
    2. `OutboxScheduler` quét và phát tán sự kiện tới Kafka topic **`payment.failed.event`**.
    3. `PaymentFailedConsumer` tại `flashsale-order-service` tiếp nhận sự kiện và kích hoạt **Giao dịch Bồi hoàn (Compensating Transaction)**:
       - Đổi trạng thái đơn hàng trong `order_db.orders` sang **`CANCELLED`**.
       - Tự động hoàn tồn kho trên database PostgreSQL: `UPDATE flash_sale_products SET available_stock = available_stock + qty`.
       - Tự động hoàn tồn kho trên bộ nhớ tạm **Redis RAM**: `INCRBY flashsale:stock:... qty`.
       - Tự động mở khóa cho người dùng trên Redis: `DEL flashsale:user:...` để người dùng có thể tham gia săn deal lại.
  - **Tính lũy đẳng (Idempotency)**: Đơn hàng đã ở trạng thái `CANCELLED` hoặc đã `PAID` sẽ tự động bỏ qua, ngăn ngừa việc bồi hoàn lặp lại nếu có message gửi đè.

---

# 4. ĐỘNG CƠ SĂN DEAL & QUẢN LÝ VÒNG ĐỜI ĐƠN HÀNG

### 4.1. Cổng Chặn Fast-Gate Bằng Redis Lua Script Nguyên Tử
Chặn đứng 100% nguy cơ **Overselling (Âm kho)** và **Race Condition** trong điều kiện nghìn người tranh mua cùng 1 mili-giây:
```lua
-- Kiểm tra user đã mua chưa (Mỗi người chỉ được mua 1 sản phẩm)
if redis.call('EXISTS', KEYS[2]) == 1 then
    return -2
end
-- Kiểm tra tồn kho khả dụng
local stock = tonumber(redis.call('GET', KEYS[1]))
if not stock or stock < tonumber(ARGV[1]) then
    return -1
end
-- Trừ kho và ghi nhận quyền mua trong 1 thao tác nguyên tử duy nhất
redis.call('DECRBY', KEYS[1], ARGV[1])
redis.call('SET', KEYS[2], '1', 'EX', tonumber(ARGV[2]))
return 1
```
* **Thời gian xử lý tại RAM**: `< 1.5ms`.
* Sau khi vượt qua Fast-Gate, hệ thống bắn message vào Kafka topic `flashsale.order.created` (phân vùng theo `productId`) để xử lý ghi đơn hàng bất đồng bộ vào PostgreSQL mà không gây nghẽn database.

### 4.2. Quản Lý Vòng Đời Đơn Hàng & Tự Động Hoàn Kho
```
                   ┌──────────┐
                   │ PENDING  │◄─── Tạo đơn hàng qua Fast-Gate & Kafka
                   └────┬─────┘
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
    (Thanh toán OK)            (Hết hạn 15p / Hủy thanh toán)
    ┌───────────┐               ┌───────────┐
    │   PAID    │               │ CANCELLED │ ──► Bồi hoàn kho DB & Redis RAM
    └─────┬─────┘               └───────────┘
          ▼
    ┌───────────┐
    │ SHIPPING  │
    └─────┬─────┘
          ▼
    ┌───────────┐
    │ DELIVERED │
    └───────────┘
```
* **Timeout Restock Scheduler**: Tự động quét các đơn hàng ở trạng thái `PENDING` quá **15 phút** mà chưa thanh toán để tự động chuyển sang `CANCELLED` và hoàn tồn kho DB + Redis.
* **Saga Instant Restock**: Hủy ngay lập tức và hoàn kho ngay khi có thông báo thanh toán thất bại từ cổng VNPay.

---

# 5. BẢN ĐỒ ỨNG DỤNG REDIS & APACHE KAFKA TOPICS

### 🔹 Bản đồ Khóa Redis In-Memory:
| Cấu trúc Key | Kiểu Dữ Liệu | Mục Đích Sử Dụng | Thời Gian Sống (TTL) |
| :--- | :---: | :--- | :---: |
| `idempotency:flashsale_order:{key}` | `String` | Khóa chống click trùng & spam đặt hàng | 30s (PROCESSING) / 120s (COMPLETED) |
| `flashsale:stock:{campaignId}:{productId}` | `String` | Quản lý tồn kho Flash Sale thời gian thực | Xuyên suốt chiến dịch |
| `flashsale:user:{campaignId}:{productId}:{userId}` | `String` | Chặn mỗi người dùng chỉ mua 1 lần | 24 giờ (hoặc xóa khi hủy đơn) |
| `blacklist:token:{token}` | `String` | Vô hiệu hóa Access Token khi Đăng xuất | Bằng thời hạn còn lại của JWT |
| `refresh:token:{userId}` | `String` | Quản lý vòng xoay Refresh Token | 7 ngày |
| `search:suggestions` | `ZSET` | Tra cứu gợi ý từ khóa Autocomplete | Vĩnh viễn (cập nhật khi sửa sản phẩm) |
| `search:trending` | `ZSET` | Bảng xếp hạng Top xu hướng tìm kiếm | Tích lũy thời gian thực qua `ZINCRBY` |

### 🔹 Bản đồ Phân Bổ Apache Kafka Topics:
| Tên Topic | Số Partitions | Partition Key | Consumer Group | Mục Đích Nghiệp Vụ |
| :--- | :---: | :---: | :--- | :--- |
| `flashsale.order.created` | 4 | `productId` | `flashsale-order-group` | Xử lý ghi nhận đơn hàng bất đồng bộ vào PostgreSQL |
| `flashsale.order.created.DLT` | 4 | `productId` | `flashsale-order-dlt-group` | **DLT**: Cách ly các message đơn hàng lỗi sau 3 lần retry |
| `payment.successful.event` | 2 | `orderCode` | `order-payment-group` | Chuyển trạng thái đơn hàng sang `PAID` khi thanh toán thành công |
| `payment.successful.event.DLT`| 2 | `orderCode` | `order-payment-dlt-group` | **DLT**: Cách ly các sự kiện thanh toán thành công bị lỗi |
| `payment.failed.event` | 2 | `orderCode` | `order-payment-failed-group` | **SAGA**: Kích hoạt giao dịch bồi hoàn hủy đơn & hoàn kho |
| `payment.failed.event.DLT` | 2 | `orderCode` | `order-payment-failed-dlt-group` | **DLT**: Cách ly các sự kiện thất bại bị lỗi trong quá trình bồi hoàn |
| `product.events` | 3 | `productId` | `order-product-group` | Đồng bộ dữ liệu sản phẩm giữa Product và Order service |
| `user.registered.event` | 2 | `userId` | `notification-group` | Kích hoạt gửi email chào mừng người dùng mới |

---

# 6. HƯỚNG DẪN KHỞI CHẠY 1-CLICK BẰNG DOCKER

### Yêu Cầu Môi Trường:
- **Docker Desktop** (Đã kích hoạt Docker Compose).
- **Node.js 18+** & **npm** (để chạy giao diện Frontend).

### 🔹 Bước 1: Build mã nguồn & Khởi chạy toàn bộ hệ thống bằng Docker Compose
Mở PowerShell tại thư mục gốc backend (`d:\spring\flashdeal\flashdeal-api`):
```powershell
# 1. Đóng gói mã nguồn toàn bộ 6 microservices
./mvnw.cmd clean package -DskipTests

# 2. Khởi chạy toàn bộ 10 Containers Microservices và Hạ tầng
docker compose up -d --build
```

### 🔹 Bước 2: Khởi chạy Giao diện Frontend React 19
Mở một cửa sổ Terminal mới tại thư mục `flashdeal-fe`:
```powershell
cd ../flashdeal-fe
npm install
npm run dev
```
Giao diện sẽ chạy tại địa chỉ: `http://localhost:5173`.

---

# 7. BỘ 5 KỊCH BẢN KIỂM THỬ THỰC CHIẾN

### 🔑 Danh Sách Cổng Truy Cập & Tài Khoản Mặc Định:
* **Giao diện Web Khách Hàng / Admin**: [http://localhost:5173](http://localhost:5173)
* **API Gateway (Cổng duy nhất)**: [http://localhost:8080](http://localhost:8080)
* **Kafka UI (Bảng điều khiển trực quan Topics & Partitions)**: [http://localhost:8085](http://localhost:8085)
* **PostgreSQL Database**: Port `5434` (User: `flashdeal_user`, Pass: `flashdeal_password`)
* **Redis Server**: Port `6380`

| Vai Trò | Email Đăng Nhập | Mật Khẩu | Quyền Hạn |
| :--- | :--- | :---: | :--- |
| **Quản Trị Viên (Admin)** | `admin@flashdeal.vn` | `Admin123@` | Toàn quyền tạo chiến dịch Flash Sale, thêm sản phẩm, quản lý đơn hàng. |
| **Khách Hàng (Customer)** | `customer1@flashdeal.vn` | `Customer123@` | Tìm kiếm, xem chi tiết sản phẩm và săn deal Flash Sale. |

---

### ⚡ Test 1: Kiểm Thử Tính Lũy Đẳng (Idempotency Click Spam)
Gửi 2 request đặt hàng liên tiếp với cùng một Header `Idempotency-Key`:
```bash
# Request 1: Thành công
curl -X POST http://localhost:8080/api/flash-sales/orders \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-uuid-1111" \
  -d '{"campaignId":5,"productId":8,"shippingAddress":"Hà Nội","phone":"0987654321"}'
# -> Kết quả: HTTP 202 Accepted (Order Created)

# Request 2 (Gửi lại cùng key ngay lập tức):
curl -X POST http://localhost:8080/api/flash-sales/orders \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-uuid-1111" \
  -d '{"campaignId":5,"productId":8,"shippingAddress":"Hà Nội","phone":"0987654321"}'
# -> Kết quả: HTTP 409 Conflict (Code: 1090) trong < 1.5ms từ Redis RAM
```

### ⚡ Test 2: Kiểm Thử Gom Dữ Liệu Đa Luồng 12ms (Java Concurrency)
Truy vấn chi tiết sản phẩm qua BFF Aggregator:
```bash
curl -i http://localhost:8080/api/products/8/detail-summary
# -> Kết quả: Trả về đầy đủ dữ liệu tổng hợp với độ trễ chỉ 12ms - 13ms (nhanh gấp 5 lần tuần tự)
```

### ⚡ Test 3: Kiểm Thử Cách Ly Lỗi Kafka DLT (Poison Pill Isolation)
Gửi một thông điệp đơn hàng cố tình hỏng dữ liệu vào Kafka:
```bash
# Thông điệp thiếu trường bắt buộc gây lỗi DB Constraint
# DefaultErrorHandler sẽ retry 3 lần (mỗi lần cách 2s)
# Sau đó tự động đẩy vào topic: flashsale.order.created.DLT
# OrderDltConsumer in log cảnh báo mà không làm nghẽn các đơn hàng phía sau
```

### ⚡ Test 4: Kiểm Thử Chaos Outbox Pattern (Đánh Sập Kafka)
Kiểm chứng tính toàn vẹn thanh toán khi Broker sập:
```bash
# 1. Tắt container Kafka
docker stop flashdeal-kafka

# 2. Khách thực hiện thanh toán:
# -> API thanh toán vẫn phản hồi thành công cho khách!
# -> payment_db lưu Payment (SUCCESS) và outbox_events (PENDING/FAILED), không mất dữ liệu!

# 3. Khởi động lại Kafka:
docker start flashdeal-kafka
# -> OutboxScheduler tự động bốc lại sự kiện và bắn sang Kafka thành công!
# -> order_db tự động cập nhật đơn hàng sang PAID!
```

### ⚡ Test 5: Kiểm Thử Choreography Saga (Bồi Hoàn Phân Tán Tự Động)
Mô phỏng khách hàng hủy thanh toán hoặc nhập sai OTP tại cổng VNPay:
```bash
# Gọi API mô phỏng thanh toán thất bại
curl -X POST "http://localhost:8084/payments/vnpay/simulate-fail?orderCode=ORD-SAGA-TEST-01&reason=USER_CANCELLED"

# Kết quả đối soát tự động:
# 1. payment_db.outbox_events: Bản ghi PaymentFailedEvent chuyển sang PUBLISHED.
# 2. Kafka: Bắn message vào topic payment.failed.event.
# 3. order_db.orders: Đơn hàng tự động đổi sang CANCELLED.
# 4. PostgreSQL: available_stock tự động hoàn lại (+1).
# 5. Redis RAM: flashsale:stock tự động hoàn lại (+1), và flashsale:user được xóa để khách mua lại được!
```
