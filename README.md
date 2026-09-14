# ⚡ FLASHDEAL ENTERPRISE – HỆ THỐNG FLASHSALE CHỊU TẢI CAO & ĐẶT HÀNG PHÂN TÁN

> **Dự án**: Nền tảng Thương mại Điện tử Săn Deal Flash Sale Tốc Độ Cao  
> **Kiến trúc**: Event-Driven Microservices (Spring Boot 3.4.1), Apache Kafka (KRaft), Redis 7 In-Memory, PostgreSQL 16 (Database-per-Service), React 19 Frontend, Docker Containerization.  
> **Hiệu năng thực nghiệm**: Phản hồi đơn hàng `< 5ms`, Cổng chặn tồn kho Redis `< 1.5ms`, Gom dữ liệu đa luồng `12ms`, Chặn trùng lặp Idempotency `< 1.5ms`.

---

## 📑 MỤC LỤC TỔNG QUAN
1. [Tổng quan Kiến trúc Hệ thống (System Architecture)](#1-tổng-quan-kiến-trúc-hệ-thống)
2. [Chi tiết 6 Microservices & Bảng Phân Chia Trách Nhiệm](#2-chi-tiết-6-microservices--bảng-phân-chia-trách-nhiệm)
3. [Bộ 4 Trụ Cột Kỹ Thuật Doanh Nghiệp (Enterprise Resiliency Patterns)](#3-bộ-4-trụ-cột-kỹ-thuật-doanh-nghiệp)
   - 3.1. [Route-Level Rate Limiter (Redis Token Bucket)](#31-route-level-rate-limiter-redis-token-bucket)
   - 3.2. [API Composition Aggregator Đa Luồng (Java Concurrency 12ms)](#32-api-composition-aggregator-đa-luồng-java-concurrency-12ms)
   - 3.3. [Kafka Dead Letter Topic (DLT) & Cơ Chế Phục Hồi Tự Động](#33-kafka-dead-letter-topic-dlt--cơ-chế-phục-hồi-tự-động)
   - 3.4. [Tính Lũy Đẳng Toàn Diện (Hybrid Idempotency Pattern)](#34-tính-lũy-đẳng-toàn-diện-hybrid-idempotency-pattern)
4. [Các Chức Năng Nghiệp Vụ Cốt Lõi](#4-các-chức-năng-nghiệp-vụ-cốt-lõi)
   - 4.1. [Xác thực & Phân quyền Người dùng (Auth Service)](#41-xác-thực--phân-quyền-người-dùng-auth-service)
   - 4.2. [Quản lý Danh mục & Sản phẩm (Product Service)](#42-quản-lý-danh-mục--sản-phẩm-product-service)
   - 4.3. [Tìm kiếm Autocomplete & Top Xu Hướng (Redis ZSET Lexicographical)](#43-tìm-kiếm-autocomplete--top-xu-hướng-redis-zset-lexicographical)
   - 4.4. [Động cơ Săn Deal Chống Âm Kho (Lua Script Fast-Gate)](#44-động-cơ-săn-deal-chống-âm-kho-lua-script-fast-gate)
   - 4.5. [Cổng Thanh toán Trực tuyến (VNPAY & VietQR)](#45-cổng-thanh-toán-trực-tuyến-vnpay--vietqr)
   - 4.6. [Quản lý Vòng Đời Đơn Hàng & Tự Động Hoàn Kho (Timeout Scheduler)](#46-quản-lý-vòng-đời-đơn-hàng--tự-động-hoàn-kho-timeout-scheduler)
   - 4.7. [Hệ thống Thông báo & Gửi Email Hóa Đơn (Notification Service)](#47-hệ-thống-thông-báo--gửi-email-hóa-đơn-notification-service)
5. [Bản Đồ Ứng Dụng Redis & Apache Kafka](#5-bản-đồ-ứng-dụng-redis--apache-kafka)
6. [Hướng Dẫn Khởi Chạy 1-Click Bằng Docker](#6-hướng-dẫn-khởi-chạy-1-click-bằng-docker)
7. [Tài Khoản Kiểm Thử & Kịch Bản Mẫu](#7-tài-khoản-kiểm-thử--kịch-bản-mẫu)

---

# 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Hệ thống được thiết kế theo mô hình **Event-Driven Microservices** chuẩn doanh nghiệp, tuân thủ nguyên tắc **Database-per-Service** (Mỗi dịch vụ sở hữu cơ sở dữ liệu riêng biệt), giúp mở rộng linh hoạt (Scalability), cô lập lỗi (Fault Isolation) và đạt hiệu năng chịu tải cao thông qua **Redis In-Memory** và **Apache Kafka Message Broker**.

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
                 │ (2 Partitions)                    │ (3 Partitions)                    │ (4 Partitions | Key: productId)
                 │                                   │                                   │
                 │         ┌─────────────────────────┴───────────────────────────────────┘
                 │         │                     ▲
                 │         │                     │ payment.successful.event (2 Partitions)
                 ▼         ▼                     │
      ┌────────────────────────────────────────────────────────┐             ┌──────────────────────┐
      │              APACHE KAFKA BROKER (:9092)               │◄────────────┤PAYMENT SERVICE (:8084│
      │ • KRaft Distributed Log                                │             │• VNPAY & VietQR Gate │
      │ • Fault-Tolerance: Dead Letter Topics (.DLT)           │             │• HMAC SHA512 Sign    │
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

# 2. CHI TIẾT 6 MICROSERVICES & BẢNG PHÂN CHIA TRÁCH NHIỆM

| Service | Port | Database | Công nghệ Cốt lõi | Trách nhiệm Nghiệp vụ Chính |
| :--- | :---: | :---: | :--- | :--- |
| **API Gateway** | `8080` | *Không dùng* | Spring Cloud Gateway, Redis Token Bucket | • Cổng vào duy nhất tiếp nhận request từ Client, điều hướng động.<br/>• **Rate Limiting theo Route**: Bảo vệ hệ thống khỏi DDoS/Spam bằng Redis Token Bucket.<br/>• Xử lý CORS tập trung, OpenAPI Swagger Aggregator. |
| **Auth Service** | `8081` | PostgreSQL (`auth_db`) | Spring Security, JJWT, Redis | • Đăng ký, đăng nhập, cấp phát cặp Token (Access Token 15p + Refresh Token 7 ngày).<br/>• Phân quyền RBAC (`ROLE_CUSTOMER`, `ROLE_ADMIN`).<br/>• Xoay vòng Refresh Token (Token Rotation) & Logout an toàn với Redis Blacklist. |
| **Product Service** | `8082` | PostgreSQL (`product_db`) | Spring Data JPA, Redis ZSET, Multithreading | • Quản lý danh mục & sản phẩm.<br/>• **API Composition Aggregator đa luồng**: Gom thông tin chi tiết siêu tốc trong **`12ms`**.<br/>• Tìm kiếm Autocomplete `< 2ms` bằng Redis ZSET Lexicographical & Top 10 xu hướng thời gian thực. |
| **FlashSale Order** | `8083` | PostgreSQL (`order_db`) | Redis Lua Script, Spring AOP, Kafka Streams | • Quản trị chiến dịch Flash Sale & khung giờ mở bán.<br/>• **Cổng chặn Fast-Gate Lua Script**: Trừ kho RAM trong **`1.5ms`**, chống âm kho và chống mua trùng.<br/>• **Idempotency Hybrid Pattern**: Chặn đứng click spam trong **`< 1.5ms`** qua Redis `SETNX`.<br/>• Quản lý vòng đời đơn hàng, tự động hoàn kho sau 15 phút. |
| **Payment Service** | `8084` | *Tích hợp Order/Kafka* | VNPay Sandbox, VietQR API, HMAC SHA512 | • Tích hợp Cổng thanh toán trực tuyến **VNPAY Sandbox**.<br/>• Sinh mã QR thanh toán ngân hàng **VietQR động**.<br/>• Ký số bảo mật và phát sự kiện `payment.successful.event` vào Kafka. |
| **Notification** | `8086` | *Không dùng* | Spring Kafka, Thymeleaf, JavaMail | • Lắng nghe các Kafka Events (`user.registered`, `order.created`, `payment.successful`).<br/>• Render giao diện hóa đơn đặt hàng bằng Thymeleaf Engine.<br/>• Gửi Email xác nhận tự động qua Gmail SMTP. |

---

# 3. BỘ 4 TRỤ CỘT KỸ THUẬT DOANH NGHIỆP

Hệ thống được tích hợp 4 chốt chặn kiến trúc chuyên sâu giúp đảm bảo độ ổn định, tính nhất quán dữ liệu và khả năng chịu tải đỉnh:

### 3.1. Route-Level Rate Limiter (Redis Token Bucket)
* **Vị trí**: `api-gateway`.
* **Cơ chế**: Sử dụng thuật toán **Token Bucket** trên nền Redis:
  - Cấu hình hạn ngạch request theo từng loại tài nguyên (ví dụ: route Đặt hàng có hạn ngạch khắt khe hơn route Tra cứu).
  - Khi người dùng gửi vượt quá hạn mức cho phép, Gateway lập tức phản hồi mã lỗi **`HTTP 429 Too Many Requests`** mà không làm nghẽn các service bên dưới.

### 3.2. API Composition Aggregator Đa Luồng (Java Concurrency 12ms)
* **Vị trí**: `product-service` (`GET /api/products/{id}/detail-summary`).
* **Cơ chế**:
  - Khi người dùng xem chi tiết sản phẩm, hệ thống cần dữ liệu từ 4 nguồn khác nhau: Thông tin gốc, Giá & Tồn kho Flash Sale, Danh mục liên quan, và Thống kê tồn kho.
  - Sử dụng `ThreadPoolTaskExecutor` (16 worker threads) kết hợp `CompletableFuture.allOf()` để thực thi 4 tác vụ song song bất đồng bộ.
  - **Kết quả thực nghiệm**: Thời gian phản hồi giảm từ $60ms \rightarrow \mathbf{12ms}$ (tối ưu hóa gấp 5 lần).

### 3.3. Kafka Dead Letter Topic (DLT) & Cơ Chế Phục Hồi Tự Động
* **Vị trí**: `flashsale-order-service` và toàn bộ hệ thống Kafka Consumers.
* **Cơ chế**:
  - Khi một thông điệp đơn hàng gặp lỗi hạ tầng (ví dụ: Deadlock database, lỗi kết nối), `DefaultErrorHandler` kích hoạt cơ chế thử lại **3 lần (mỗi lần cách nhau 2 giây)** với `FixedBackOff(2000L, 3)`.
  - Nếu sau 3 lần vẫn thất bại, `DeadLetterPublishingRecoverer` tự động bọc thông điệp kèm toàn bộ dấu vết ngoại lệ và đẩy sang topic cách ly:
    * `flashsale.order.created.DLT` (4 partitions)
    * `payment.successful.event.DLT` (2 partitions)
  - `OrderDltConsumer` giám sát topic DLT, ghi nhật ký cảnh báo phục vụ điều tra và replay dữ liệu.
  - **Lợi ích**: Loại bỏ hoàn toàn 2 nguy cơ chí mạng: **Data Loss (Mất đơn hàng)** và **Poison Pill (Nghẽn hàng đợi)**.

### 3.4. Tính Lũy Đẳng Toàn Diện (Hybrid Idempotency Pattern)
* **Vị trí**: `flashsale-order-service` (`POST /api/flash-sales/orders`) & `flashdeal-fe`.
* **Cơ chế**:
  1. **Mô hình lai (Hybrid)**:
     - **Ưu tiên 1**: Đọc Header `Idempotency-Key` (UUIDv4) do Frontend tự động sinh khi người dùng bấm nút Săn Deal.
     - **Phao cứu sinh (Fallback)**: Nếu Client không gửi Header, Backend tự động băm mã băm `MD5(userId + ":" + campaignId + ":" + productId)` để tự bảo vệ.
  2. **Chốt chặn nguyên tử Redis RAM**:
     - Khi nhận request: Thực thi lệnh nguyên tử `SET key "PROCESSING" NX EX 30` (30 giây khóa tạm phòng server crash).
     - Nếu key đã tồn tại $\rightarrow$ Trả ngay mã chuẩn quốc tế **`HTTP 409 Conflict (code: 1090)`** trong vòng **$< 1.5ms$**.
     - Khi đơn hàng tạo thành công: Cập nhật `SET key "COMPLETED" EX 120` (giữ khóa 120 giây chống spam click).
     - Nếu gặp ngoại lệ nghiệp vụ (hết hàng, hết giờ): Tự động xóa key (`DEL`) để giải phóng lượt mua cho khách.
  3. **Đồng bộ Frontend**: Frontend bắt mã lỗi `1090` và hiển thị cảnh báo thân thiện: *"Yêu cầu của bạn đang được xử lý hoặc đã hoàn tất. Vui lòng không thao tác lặp lại!"*.

---

# 4. CÁC CHỨC NĂNG NGHIỆP VỤ CỐT LÕI

### 4.1. Xác thực & Phân quyền Người dùng (Auth Service)
* **Stateless JWT**: Sử dụng thuật toán HMAC-SHA256, không lưu session trên server.
* **Token Rotation**: Mỗi lần làm mới Access Token (15 phút), Refresh Token cũ bị thu hồi và cấp cặp token mới.
* **Redis Blacklist**: Khi người dùng ấn Đăng xuất, Access Token được đưa vào danh sách đen trong Redis với thời gian TTL bằng đúng thời hạn còn lại của token.

### 4.2. Quản lý Danh mục & Sản phẩm (Product Service)
* Hỗ trợ đầy đủ các thao tác CRUD danh mục và sản phẩm công nghệ (Laptop, Bàn phím cơ, Điện thoại...).
* Tự động phát sự kiện `product.events` sang Kafka mỗi khi có sản phẩm mới hoặc cập nhật để các service liên quan đồng bộ.

### 4.3. Tìm kiếm Autocomplete & Top Xu Hướng (Redis ZSET Lexicographical)
* **Gợi ý từ khóa Autocomplete**: Dùng cấu trúc `ZSET` với kỹ thuật băm tiền tố `ZRANGEBYLEX`, trả về kết quả gợi ý khi đang gõ phím với độ trễ **$< 2ms$**.
* **Bảng xếp hạng xu hướng (Top Trending)**: Tăng điểm số tìm kiếm thời gian thực qua lệnh `ZINCRBY`, tự động hiển thị danh sách 10 từ khóa hot nhất.

### 4.4. Động cơ Săn Deal Chống Âm Kho (Lua Script Fast-Gate)
* Chặn đứng tình trạng **Overselling (Âm kho)** và **Race Condition** bằng tập lệnh **Redis Lua Script nguyên tử**:
  1. Kiểm tra khách hàng đã mua sản phẩm trong chiến dịch này chưa (Mỗi tài khoản chỉ được mua 1 sản phẩm).
  2. Kiểm tra tồn kho khả dụng trong Redis.
  3. Trừ tồn kho và ghi nhận quyền mua trong 1 bước duy nhất tại bộ nhớ RAM ($< 1.5ms$).
* Sau khi vượt qua Fast-Gate, hệ thống đóng gói sự kiện bắn vào Kafka phân vùng theo `productId` để xử lý ghi đơn hàng bất đồng bộ vào PostgreSQL.

### 4.5. Cổng Thanh toán Trực tuyến (VNPAY & VietQR)
* **VNPAY Sandbox**: Tích hợp chuẩn giao thức thanh toán thẻ ATM / QR-Pay của VNPAY, mã hóa kiểm tra toàn vẹn dữ liệu bằng chữ ký số `HMAC SHA512`.
* **VietQR Động**: Sinh mã QR chuẩn ngân hàng NAPAS kèm chính xác số tiền và mã đơn hàng để quét chuyển khoản tức thì.

### 4.6. Quản lý Vòng Đời Đơn Hàng & Tự Động Hoàn Kho (Timeout Scheduler)
* **Vòng đời đơn hàng**: `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `SHIPPING` $\rightarrow$ `DELIVERED` (hoặc `CANCELLED`).
* **Timeout Restock Scheduler**: Tự động quét các đơn hàng ở trạng thái `PENDING` quá **15 phút** mà chưa thanh toán để hủy đơn và **hoàn lại số lượng tồn kho** vào cả Redis RAM lẫn PostgreSQL.

### 4.7. Hệ thống Thông báo & Gửi Email Hóa Đơn (Notification Service)
* Lắng nghe các sự kiện từ Kafka để gửi Email xác nhận đăng ký tài khoản và Email hóa đơn chi tiết đơn hàng (render giao diện HTML chuyên nghiệp bằng Thymeleaf) qua Gmail SMTP.

---

# 5. BẢN ĐỒ ỨNG DỤNG REDIS & APACHE KAFKA

### 🔹 Bản đồ Khóa Redis In-Memory:
| Cấu trúc Key | Kiểu Dữ Liệu | Mục Đích Sử Dụng | Thời Gian Sống (TTL) |
| :--- | :---: | :--- | :---: |
| `idempotency:flashsale_order:{key}` | `String` | Khóa chống click trùng & spam đặt hàng | 30s (PROCESSING) / 120s (COMPLETED) |
| `flashsale:stock:{campaignId}:{productId}` | `String` | Quản lý tồn kho Flash Sale thời gian thực | Xuyên suốt chiến dịch |
| `flashsale:user:{campaignId}:{productId}:{userId}` | `String` | Chặn mỗi người dùng chỉ mua 1 lần | 24 giờ |
| `blacklist:token:{token}` | `String` | Vô hiệu hóa Access Token khi Đăng xuất | Bằng thời hạn còn lại của JWT |
| `refresh:token:{userId}` | `String` | Quản lý vòng xoay Refresh Token | 7 ngày |
| `search:suggestions` | `ZSET` | Tra cứu gợi ý từ khóa Autocomplete | Vĩnh viễn (cập nhật khi sửa sản phẩm) |
| `search:trending` | `ZSET` | Bảng xếp hạng Top xu hướng tìm kiếm | Tích lũy thời gian thực |

### 🔹 Bản đồ Phân Bổ Apache Kafka Topics:
| Tên Topic | Số Partitions | Partition Key | Mục Đích Nghiệp Vụ |
| :--- | :---: | :---: | :--- |
| `flashsale.order.created` | 4 | `productId` | Hàng đợi ghi nhận đơn hàng sau khi vượt qua Redis Fast-Gate |
| `flashsale.order.created.DLT` | 4 | `productId` | **Dead Letter Topic**: Cách ly các thông điệp đặt hàng bị lỗi sau 3 lần retry |
| `payment.successful.event` | 2 | `orderCode` | Đồng bộ trạng thái thanh toán giữa Payment và Order service |
| `payment.successful.event.DLT`| 2 | `orderCode` | **Dead Letter Topic**: Cách ly các sự kiện thanh toán lỗi |
| `product.events` | 3 | `productId` | Đồng bộ dữ liệu sản phẩm giữa Product và Order service |
| `user.registered.event` | 2 | `userId` | Kích hoạt gửi email chào mừng người dùng mới |

---

# 6. HƯỚNG DẪN KHỞI CHẠY 1-CLICK BẰNG DOCKER

### Yêu Cầu Môi Trường:
- **Docker Desktop** (bật tính năng Docker Compose).
- **Node.js 18+** & **npm** (để chạy giao diện Frontend).

### 🔹 Bước 1: Build mã nguồn & Khởi chạy toàn bộ hệ thống bằng Docker Compose
Mở PowerShell tại thư mục gốc của dự án (`d:\spring\flashdeal\flashdeal-api`):
```powershell
# 1. Đóng gói mã nguồn Java
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

# 7. TÀI KHOẢN KIỂM THỬ & KỊCH BẢN MẪU

### 🔑 Danh Sách Cổng Truy Cập Dịch Vụ:
* **Giao diện Web Khách Hàng / Admin**: [http://localhost:5173](http://localhost:5173)
* **API Gateway (Điểm vào duy nhất)**: [http://localhost:8080](http://localhost:8080)
* **Kafka UI (Bảng điều khiển trực quan Topics & Consumer Groups)**: [http://localhost:8085](http://localhost:8085)
* **PostgreSQL Database**: Port `5434` (User: `flashdeal_user`, Pass: `flashdeal_password`)
* **Redis Server**: Port `6380`

### 🔑 Tài Khoản Đăng Nhập Mặc Định:
| Vai Trò | Email Đăng Nhập | Mật Khẩu | Quyền Hạn |
| :--- | :--- | :---: | :--- |
| **Quản Trị Viên (Admin)** | `admin@flashdeal.vn` | `Admin123@` | Toàn quyền tạo chiến dịch Flash Sale, thêm sản phẩm, quản lý đơn hàng. |
| **Khách Hàng (Customer)** | `customer1@flashdeal.vn` | `Customer123@` | Tìm kiếm, xem chi tiết sản phẩm và săn deal Flash Sale. |

### ⚡ Kịch Bản Kiểm Thử Tính Lũy Đẳng (Idempotency Test):
Gửi 2 request đặt hàng liên tiếp với cùng một Header `Idempotency-Key`:
```bash
# Request 1: Thành công
curl -X POST http://localhost:8080/api/flash-sales/orders \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-uuid-1111" \
  -d '{"campaignId":6,"productId":5,"shippingAddress":"Hà Nội","phone":"0987654321"}'
# -> Nhận mã HTTP 202 Accepted (Order Created)

# Request 2 (Bấm lặp lại ngay lập tức):
curl -X POST http://localhost:8080/api/flash-sales/orders \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-uuid-1111" \
  -d '{"campaignId":6,"productId":5,"shippingAddress":"Hà Nội","phone":"0987654321"}'
# -> Nhận ngay mã HTTP 409 Conflict (Code: 1090) trong < 2ms từ Redis RAM
```
