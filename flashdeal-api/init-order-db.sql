-- =====================================================================
-- SCRIPT KHOI TAO DATABASE & SCHEMA CHO FLASHSALE & ORDER SERVICE
-- Database: order_db (PostgreSQL 16)
-- Port: 5434 (Host) -> 5432 (Container)
-- Username: flashdeal_user / Password: flashdeal_password
-- =====================================================================

-- 1. Tao Database order_db neu chua co
SELECT 'CREATE DATABASE order_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'order_db')\gexec

\c order_db;

-- 2. Bang Chien Dich Flash Sale (flash_sale_campaigns)
CREATE TABLE IF NOT EXISTS flash_sale_campaigns (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaign_status_time ON flash_sale_campaigns (status, start_time, end_time);

-- 3. Bang San Pham Trong Chien Dich Flash Sale (flash_sale_products)
CREATE TABLE IF NOT EXISTS flash_sale_products (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    original_price NUMERIC(15, 2) NOT NULL,
    flash_sale_price NUMERIC(15, 2) NOT NULL,
    flash_sale_stock INT NOT NULL,
    available_stock INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fsp_campaign FOREIGN KEY (campaign_id) REFERENCES flash_sale_campaigns(id) ON DELETE CASCADE,
    CONSTRAINT uk_campaign_product UNIQUE (campaign_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_fsp_campaign_id ON flash_sale_products (campaign_id);
CREATE INDEX IF NOT EXISTS idx_fsp_product_id ON flash_sale_products (product_id);

-- 4. Bang Don Hang (orders)
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_code VARCHAR(100) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    campaign_id BIGINT NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    shipping_address VARCHAR(500),
    phone VARCHAR(20),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON orders (order_code);
CREATE INDEX IF NOT EXISTS idx_orders_campaign_id ON orders (campaign_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_expires ON orders (status, expires_at);

-- 5. Bang Chi Tiet Don Hang (order_items)
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price NUMERIC(15, 2) NOT NULL,
    total_price NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
