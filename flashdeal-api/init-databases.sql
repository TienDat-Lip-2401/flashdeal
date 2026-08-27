-- Tao cac database doc lap cho tung microservice
CREATE DATABASE product_db;
CREATE DATABASE auth_db;
CREATE DATABASE order_db;
CREATE DATABASE payment_db;

-- Cap quyen cho user flashdeal_user
GRANT ALL PRIVILEGES ON DATABASE product_db TO flashdeal_user;
GRANT ALL PRIVILEGES ON DATABASE auth_db TO flashdeal_user;
GRANT ALL PRIVILEGES ON DATABASE order_db TO flashdeal_user;
GRANT ALL PRIVILEGES ON DATABASE payment_db TO flashdeal_user;
