# FlashDeal

Website bán đồ công nghệ theo hình thức **flash sale**: mỗi đợt mở bán có số suất giới hạn, giá giảm sâu, nhiều người cùng tranh mua trong một thời điểm.

Mục tiêu của dự án là giải quyết các bài toán thường gặp khi bán hàng giờ cao điểm:

- **Không bán vượt số hàng đang có**, kể cả khi hàng nghìn người bấm mua cùng lúc.
- **Bấm đúp hay gửi lại vẫn chỉ tạo một đơn hàng.**
- **Thanh toán thất bại thì tự trả lại suất mua** cho người khác.
- **Một phần hệ thống gặp sự cố không làm mất đơn hay mất tiền.**

## Công nghệ

| Phần | Công nghệ |
| --- | --- |
| Backend | Java 21, Spring Boot 3, Spring Cloud Gateway, Spring Security (JWT) |
| Dữ liệu | PostgreSQL 16, Redis 7 |
| Hàng đợi sự kiện | Apache Kafka |
| Frontend | React 19, Vite, Tailwind CSS, TanStack Query, Zustand |
| Kiểm thử | Playwright (máy tính và điện thoại) |
| Triển khai | Docker Compose |
| Thanh toán | VNPay (môi trường thử nghiệm) |

## Chức năng

**Khách hàng**
- Xem sản phẩm theo danh mục, tìm kiếm có gợi ý từ khóa.
- Xem lịch flash sale, đồng hồ đếm ngược, số suất còn lại.
- Đặt mua, thanh toán qua VNPay, theo dõi và hủy đơn.
- Nhận email khi đăng ký, đặt hàng và thanh toán thành công.

**Quản trị viên**
- Quản lý sản phẩm, danh mục, đợt flash sale.
- Xem và cập nhật trạng thái đơn hàng (đã thanh toán → đang giao → đã giao).

## Kiến trúc

Hệ thống gồm 6 dịch vụ nhỏ (microservices). Mỗi dịch vụ có cơ sở dữ liệu riêng và trao đổi với nhau qua Kafka.

```
            Trình duyệt (React)
                   │
                   ▼
              API Gateway  ── giới hạn số request, định tuyến
                   │
   ┌───────────────┼────────────────┬──────────────┐
   ▼               ▼                ▼              ▼
 Auth          Product        Flash sale       Payment
 (đăng nhập)   (sản phẩm)     (đặt hàng)       (VNPay)
                   │                │              │
                   └──────── Kafka ─┴──────────────┘
                                │
                                ▼
                          Notification (email)
```

| Dịch vụ | Việc chính |
| --- | --- |
| `api-gateway` | Cổng vào duy nhất, chặn người gửi quá nhiều request |
| `auth-service` | Đăng ký, đăng nhập, cấp và thu hồi token |
| `product-service` | Sản phẩm, danh mục, tìm kiếm gợi ý |
| `flashsale-order-service` | Đợt flash sale, giữ suất, tạo và quản lý đơn hàng |
| `payment-service` | Thanh toán VNPay, báo kết quả cho dịch vụ đơn hàng |
| `notification-service` | Gửi email |

## Các kỹ thuật chính

| Vấn đề | Cách giải quyết |
| --- | --- |
| Nhiều người mua cùng lúc làm âm kho | Trừ kho trên Redis bằng một Lua script chạy nguyên khối: kiểm tra và trừ trong cùng một bước |
| Database quá tải giờ cao điểm | Giữ suất trên Redis rồi trả kết quả ngay; đơn được ghi vào PostgreSQL sau, qua Kafka |
| Bấm đúp tạo hai đơn | Mỗi lần đặt có một mã `Idempotency-Key`; mã trùng bị từ chối (HTTP 409) |
| Spam request | Gateway giới hạn số request theo IP (thuật toán token bucket trên Redis) |
| Lưu thanh toán xong nhưng gửi sự kiện thất bại | **Transactional Outbox**: lưu thanh toán và sự kiện trong cùng một transaction, một tiến trình nền gửi sự kiện đi sau |
| Thanh toán lỗi, suất bị giữ mãi | **Saga**: thanh toán thất bại thì đơn tự hủy và trả lại suất; đơn chưa thanh toán sau 15 phút cũng tự hủy |
| Một sự kiện lỗi làm kẹt hàng đợi | Thử lại 3 lần, vẫn lỗi thì chuyển sang hàng đợi riêng (Dead Letter Topic) để xem xét sau |
| Trang chi tiết sản phẩm cần nhiều nguồn dữ liệu | Lấy song song bằng `CompletableFuture` thay vì gọi lần lượt |

Vòng đời đơn hàng:

```
PENDING ──thanh toán──► PAID ──► SHIPPING ──► DELIVERED
   │
   └── quá 15 phút / thanh toán lỗi / khách hủy ──► CANCELLED (trả lại suất)
```

Chi tiết từng kỹ thuật, các khóa Redis và topic Kafka: [FLASHDEAL_ARCHITECTURE_AND_FEATURES.md](FLASHDEAL_ARCHITECTURE_AND_FEATURES.md).

## Chạy dự án

Cần cài: **Docker Desktop**, **Node.js 18+**, **JDK 21**.

**1. Backend**

```bash
cd flashdeal-api
# (tùy chọn) gửi email: tạo file .env chứa MAIL_USERNAME=... và MAIL_PASSWORD=<Gmail App Password>

./mvnw clean package -DskipTests     # Windows: ./mvnw.cmd
docker compose up -d --build
```

**2. Frontend**

```bash
cd flashdeal-fe
npm install
npm run dev
```

**3. Dữ liệu mẫu (không bắt buộc)**

```bash
npm run seed    # thêm danh mục, sản phẩm có ảnh và các đợt flash sale
```

Mở http://localhost:5173.

| Địa chỉ | Dùng để |
| --- | --- |
| http://localhost:5173 | Website |
| http://localhost:5173/quan-tri | Trang quản trị |
| http://localhost:8080/api | API Gateway |
| http://localhost:8085 | Kafka UI, xem các sự kiện |

**Tài khoản có sẵn**

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Quản trị viên | `admin@flashdeal.vn` | `Admin@123` |
| Khách hàng | `customer@flashdeal.vn` | `Password@123` |

## Kiểm thử

```bash
cd flashdeal-fe
npm run test:e2e
```

Bộ test Playwright chạy trên trình duyệt thật, cả giao diện máy tính và điện thoại. Các luồng được kiểm tra:

- Xem, lọc, tìm kiếm sản phẩm.
- Đặt hàng và thanh toán thử.
- Bấm đúp chỉ tạo một đơn.
- Hủy đơn.
- Phân quyền trang quản trị.

Backend cần đang chạy trước khi chạy test.

## Cấu trúc thư mục

```
flashdeal/
├── flashdeal-api/        # Backend: 6 dịch vụ Spring Boot + docker-compose.yml
├── flashdeal-fe/         # Frontend React
│   ├── src/pages/        # Các trang
│   ├── src/components/   # Thành phần giao diện
│   ├── e2e/              # Test Playwright
│   └── scripts/          # Nạp dữ liệu mẫu, tạo sitemap
├── BACKEND_ISSUES.md     # Các lỗi backend đã biết và hướng sửa
└── FLASHDEAL_ARCHITECTURE_AND_FEATURES.md
```
