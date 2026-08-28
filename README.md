# ⚡ FLASHDEAL ENTERPRISE – HIGH-CONCURRENCY FLASHSALE PLATFORM

> **Hệ thống Săn Deal Flash Sale & Thương mại điện tử Phân tán Chịu tải cao (50.000 req/s)**  
> **Kiến trúc**: Microservices (Spring Boot 3.4.1), Apache Kafka (KRaft), Redis 7 In-Memory, PostgreSQL 16, React 19 Frontend, Docker Containerization.

---

## 📑 TÀI LIỆU QUAN TRỌNG CHO DEMO & ĐỒ ÁN

* 📘 **Báo cáo Toàn diện Kiến trúc & Vận hành Kafka, Redis, Microservices**:  
  👉 **[`FLASHDEAL_ARCHITECTURE_AND_FEATURES.md`](./FLASHDEAL_ARCHITECTURE_AND_FEATURES.md)**
* 💻 **Mã nguồn Backend Microservices**: [`flashdeal-api/`](./flashdeal-api) — [Tài liệu Backend](./flashdeal-api/README.md)
* 🎨 **Giao diện Người dùng Frontend React 19**: [`flashdeal-fe/`](./flashdeal-fe) — [Tài liệu Frontend](./flashdeal-fe/README.md)

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY NHANH

### 1. Khởi chạy Backend Microservices (Docker)
```powershell
cd flashdeal-api
.\mvnw clean package -DskipTests
docker compose up -d --build
```

### 2. Khởi chạy Frontend
```powershell
cd flashdeal-fe
npm run dev
```

### 3. Các cổng truy cập kiểm thử
* 🌐 **Website Ứng dụng**: [http://localhost:5173](http://localhost:5173)
* 📊 **Kafka UI Dashboard**: [http://localhost:8085](http://localhost:8085)
* 📖 **API Gateway Documentation**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
* 👤 **Admin**: `admin@flashdeal.vn` / `Admin@123`
* 👤 **Customer**: `customer@flashdeal.vn` / `Password@123`
