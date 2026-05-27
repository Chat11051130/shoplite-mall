CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY,
  category ENUM('electronics', 'fashion', 'home', 'beauty', 'grocery', 'sports') NOT NULL,
  title VARCHAR(255) NOT NULL,
  rating DECIMAL(3,2) NULL,
  reviews INT DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  old_price DECIMAL(10,2) NULL,
  discount VARCHAR(64) NULL,
  shipping VARCHAR(255) NULL,
  image TEXT NOT NULL,
  alt VARCHAR(255) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  badge VARCHAR(64) NULL,
  tag VARCHAR(64) NULL,
  tags_json JSON NULL,
  short_description TEXT NULL,
  details_json JSON NULL,
  highlights_json JSON NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  INDEX idx_products_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS carts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  INDEX idx_carts_user_id (user_id),
  CONSTRAINT fk_carts_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id VARCHAR(64) PRIMARY KEY,
  cart_id VARCHAR(64) NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  UNIQUE KEY uq_cart_items_cart_product (cart_id, product_id),
  INDEX idx_cart_items_cart_id (cart_id),
  CONSTRAINT fk_cart_items_cart_id FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product_id FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  status ENUM('processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'processing',
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  shipping_address TEXT NOT NULL,
  city VARCHAR(128) NOT NULL,
  state VARCHAR(128) NOT NULL,
  zip VARCHAR(32) NOT NULL,
  delivery_option VARCHAR(64) NOT NULL,
  payment_method VARCHAR(64) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  savings DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  item_count INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at),
  CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  product_id INT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(64) NULL,
  image TEXT NULL,
  alt VARCHAR(255) NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  INDEX idx_order_items_order_id (order_id),
  CONSTRAINT fk_order_items_order_id FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product_id FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
