-- ================================================================
-- ชาแมกไม้ — Database Schema (ตามการออกแบบใน Database_Design__SQL_.docx)
-- + เพิ่ม sku ใน menu_items ตามคำแนะนำของอาจารย์
-- + เพิ่ม phone, position ใน users (นอกเหนือจากดีไซน์เดิม) เพื่อรองรับ
--   หน้าจัดการพนักงานของ Owner ที่มีอยู่แล้วในโปรเจกต์ (ชื่อ/เบอร์โทร/ตำแหน่ง)
--
-- ไฟล์นี้ import ซ้ำได้อย่างปลอดภัย (DROP ตารางเดิมแล้วสร้างใหม่ทุกครั้ง)
-- วิธีใช้: phpMyAdmin -> Import -> เลือกไฟล์นี้ -> Go
-- ================================================================

CREATE DATABASE IF NOT EXISTS chamakmai
  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE chamakmai;

-- ล้างของเดิมก่อน (เรียงตามลำดับ FK ที่พึ่งพากัน)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS `tables`;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS users;

-- ----------------------------------------------------------------
-- 1) ตารางเมนูอาหารและเครื่องดื่ม (menu_items)
-- ----------------------------------------------------------------
CREATE TABLE menu_items (
  menu_id         INT PRIMARY KEY AUTO_INCREMENT,
  sku             VARCHAR(50) UNIQUE,                     -- เพิ่มตามคำแนะนำอาจารย์
  name            VARCHAR(100) NOT NULL,
  type            ENUM('food','drink') NOT NULL,
  category        VARCHAR(50),
  price           DECIMAL(10,2) NOT NULL,
  image_url       TEXT,
  is_available    BOOLEAN DEFAULT 1,
  options_config  JSON NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- 2) ตารางหมวดหมู่อาหารและเครื่องดื่ม (categories)
-- ----------------------------------------------------------------
CREATE TABLE categories (
  category_id     INT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(50) NOT NULL UNIQUE,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- 3) ตารางข้อมูลการสั่งซื้อ — หัวบิล (orders)
-- ----------------------------------------------------------------
CREATE TABLE orders (
  order_id        INT PRIMARY KEY AUTO_INCREMENT,
  table_number    VARCHAR(10) NOT NULL,
  total_price     DECIMAL(10,2) NOT NULL DEFAULT 0,
  status          ENUM('waiting','cooking','served','completed','cancelled') DEFAULT 'waiting',
  payment_method  VARCHAR(20) NULL,
  is_paid         BOOLEAN DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- 4) ตารางรายละเอียดการสั่งซื้อ (order_items)
-- ----------------------------------------------------------------
CREATE TABLE order_items (
  order_item_id     INT PRIMARY KEY AUTO_INCREMENT,
  order_id          INT NOT NULL,
  menu_id           INT NULL,
  item_name         VARCHAR(100) NOT NULL,
  price_at_order    DECIMAL(10,2) NOT NULL,
  quantity          INT NOT NULL DEFAULT 1,
  selected_options  JSON NULL,
  item_status       VARCHAR(20) DEFAULT 'waiting',
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (menu_id) REFERENCES menu_items(menu_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- 5) ตารางสถานะโต๊ะ (tables)
-- ----------------------------------------------------------------
CREATE TABLE `tables` (
  table_id          VARCHAR(10) PRIMARY KEY,
  status            ENUM('available','occupied') DEFAULT 'available',
  current_order_id  INT NULL,
  last_active       DATETIME NULL,
  FOREIGN KEY (current_order_id) REFERENCES orders(order_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- 6) ตารางผู้ใช้งานระบบ (users)
--    เพิ่ม phone, position (นอกเหนือดีไซน์เดิม) เพื่อรองรับหน้า "จัดการพนักงาน"
--    ที่มี UI อยู่แล้ว (role = สิทธิ์การเข้าถึง, position = ตำแหน่งงาน)
-- ----------------------------------------------------------------
CREATE TABLE users (
  user_id         INT PRIMARY KEY AUTO_INCREMENT,
  username        VARCHAR(50) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  display_name    VARCHAR(100),
  role            ENUM('admin','staff') DEFAULT 'staff',
  phone           VARCHAR(20) NULL,       -- ส่วนขยาย: เบอร์โทรศัพท์
  position        VARCHAR(50) NULL        -- ส่วนขยาย: ตำแหน่งงาน เช่น แคชเชียร์, ครัว
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- ข้อมูลตัวอย่าง (seed)
-- ================================================================

INSERT INTO menu_items (sku, name, type, category, price, image_url, is_available, options_config) VALUES
('TEA001', 'ชาชัก (เย็น)', 'drink', 'Tea',   35.00, NULL, 1, JSON_OBJECT('sweetness', JSON_ARRAY('0%','50%','100%'))),
('ROTI001','โรตีกรอบ',      'food',  'Roti',  25.00, NULL, 1, JSON_OBJECT('topping', JSON_ARRAY('นมข้น','ช็อกโกแลต'))),
('SNK001', 'นักเก็ตไก่',     'food',  'Snack', 49.00, NULL, 1, NULL),
('TEA002', 'ชามะนาว',       'drink', 'Tea',   40.00, NULL, 0, JSON_OBJECT('sweetness', JSON_ARRAY('0%','50%','100%')));

INSERT INTO orders (table_number, total_price, status, payment_method, is_paid, created_at) VALUES
('T05', 60.00,  'cooking',   'qr_code', 0, '2024-01-15 19:42:00'),
('T02', 145.00, 'served',    'cash',    0, '2024-01-15 19:15:00'),
('T08', 98.00,  'completed', 'qr_code', 1, '2024-01-15 18:30:00');

INSERT INTO order_items (order_id, menu_id, item_name, price_at_order, quantity, selected_options, item_status) VALUES
(1, 1, 'ชาชัก (เย็น)', 35.00, 1, JSON_OBJECT('sweetness','50%'), 'cooking'),
(1, 2, 'โรตีกรอบ',      25.00, 1, JSON_OBJECT('topping','นมข้น'), 'waiting'),
(2, 3, 'นักเก็ตไก่',     49.00, 2, NULL, 'served'),
(3, 3, 'นักเก็ตไก่',     49.00, 2, NULL, 'completed');

INSERT INTO `tables` (table_id, status, current_order_id, last_active) VALUES
('T01', 'available', NULL, '2024-01-15 18:00:00'),
('T02', 'occupied',  2,    '2024-01-15 19:15:00'),
('T05', 'occupied',  1,    '2024-01-15 19:42:00'),
('T08', 'available', NULL, '2024-01-15 18:30:00');

-- ไม่มี seed users สำหรับ login ที่เป็น placeholder ใน schema นี้
-- ให้สร้างผู้ใช้งานจริงผ่าน POST /api/staff หรือแทรกข้อมูลพร้อม bcrypt hash ลงฐานข้อมูลเองหลัง import schema