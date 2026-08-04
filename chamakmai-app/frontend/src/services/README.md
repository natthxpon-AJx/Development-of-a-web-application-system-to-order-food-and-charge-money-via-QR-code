# ชาแมกไม้ — Backend API (ตาม Database Design ที่อาจารย์แนะนำ + เพิ่ม sku)

REST API (Express + mysql2) ที่ implement ตามสคีมาในเอกสาร `Database_Design__SQL_.docx`
ของคุณเป๊ะๆ (5 ตาราง: `menu_items`, `orders`, `order_items`, `tables`, `users`)
โดยเพิ่มคอลัมน์ **`sku`** ใน `menu_items` ตามที่อาจารย์แนะนำ

## ขั้นตอนติดตั้ง

### 1) เปิด XAMPP แล้วสตาร์ท Apache + MySQL

### 2) สร้างฐานข้อมูลด้วย schema.sql
1. เปิด `http://localhost/phpmyadmin`
2. แท็บ **Import** → เลือกไฟล์ `schema.sql` ที่แนบมา → กด **Go**
   จะได้ฐานข้อมูล `chamakmai` พร้อม 5 ตารางและข้อมูลตัวอย่างตามในเอกสารของคุณ

### 3) ตั้งค่าการเชื่อมต่อฐานข้อมูล
```bash
cd backend
cp .env.example .env
```
ค่าเริ่มต้นตรงกับ XAMPP มาตรฐาน (`root` / ไม่มีรหัสผ่าน / พอร์ต 3306) ถ้าต่างจากนี้ให้แก้ในไฟล์ `.env`

### 4) ติดตั้งแพ็กเกจและรัน
```bash
npm install
npm start
```
รันที่ `http://localhost:4000`

## โครงสร้างตาราง (ตรงตามเอกสารที่ออกแบบไว้ + sku)

- **menu_items** — `menu_id` (PK), **`sku`** (ใหม่), `name`, `type` (food/drink), `category`, `price`, `image_url`, `is_available`, `options_config` (JSON)
- **orders** — หัวบิล: `order_id` (PK), `table_number`, `total_price`, `status` (waiting/cooking/served/completed/cancelled), `payment_method`, `is_paid`, `created_at`
- **order_items** — รายการย่อย: `order_item_id` (PK), `order_id` (FK), `menu_id` (FK), `item_name`, `price_at_order`, `quantity`, `selected_options` (JSON), `item_status`
- **tables** — สถานะโต๊ะ: `table_id` (PK, เช่น T05), `status`, `current_order_id` (FK), `last_active`
- **users** — พนักงาน/เจ้าของร้าน: `user_id` (PK), `username`, `password_hash`, `display_name`, `role`

## Endpoints

| Method | Path                       | คำอธิบาย |
|--------|----------------------------|----------|
| GET    | `/api/menu`                 | เมนูทั้งหมด (รวม sku) |
| GET    | `/api/categories`           | หมวดหมู่ (คำนวณจากเมนูจริง) |
| GET    | `/api/orders?table=T05`     | ออเดอร์ของโต๊ะ พร้อมรายการสินค้า (join order_items) |
| POST   | `/api/orders`                | สร้างออเดอร์ `{ table, items:[{menuId, sku, name, price, qty, options}] }` — insert ทั้ง orders + order_items และเปิดสถานะโต๊ะเป็น occupied |
| PATCH  | `/api/orders/:id/status`     | อัปเดตสถานะออเดอร์ `{status}` — ต้องเป็นค่าใน ENUM: waiting, cooking, served, completed, cancelled |
| GET    | `/api/payments?table=T05`   | ประวัติการชำระเงินของโต๊ะ (ออเดอร์ที่ is_paid=1) |
| POST   | `/api/payments`              | ปิดบิล `{ table, method }` — จ่ายออเดอร์ที่ค้างอยู่ **ทั้งหมด** ของโต๊ะนั้นในครั้งเดียว แล้วเปลี่ยนสถานะโต๊ะกลับเป็น available |

## จุดสำคัญที่ต่างจากดีไซน์เดิม (Note ไว้เผื่อทำสไลด์/รายงาน)

1. **table_number ใช้รูปแบบ `T05`** (ตรงกับ `table_id` ในตาราง `tables`) ไม่ใช่เลขล้วนเหมือนโค้ดเดิม —
   ฝั่ง frontend (`customer.jsx`) มีฟังก์ชัน `tableCode()` แปลงเลขโต๊ะเป็นรหัสนี้ให้อัตโนมัติ
2. **ไม่มีตาราง payments แยก** ตามดีไซน์ของคุณ — ใช้ `payment_method` + `is_paid` ใน `orders` เอง
   ประวัติการจ่ายเงินคือ query ออเดอร์ที่ `is_paid = 1`
3. **options_config / selected_options เป็น JSON แบบยืดหยุ่น** (เช่น `{"sweetness":"50%"}`)
   แทนฟิลด์ boolean ตายตัวอย่าง `sweet`/`spicy`/`sauce` ที่โค้ดเดิมใช้ — ฝั่ง frontend ปรับ
   `CustomerDetailModal.jsx` ให้ render ตัวเลือกแบบ dynamic ตามคีย์ใน `options_config` แล้ว
4. **ราคารวม (`total_price`) คำนวณตอนสร้างออเดอร์ฝั่ง backend** จาก items ที่ส่งมา
5. **`sku` ถูกส่งกลับมาพร้อมกับข้อมูลเมนู** และแนบไปกับ item ตอนสั่งออเดอร์ (เก็บไว้เผื่อใช้อ้างอิง/ตรวจสอบสต็อกในอนาคต)

## หมายเหตุ

- `password_hash` ต้องเป็น bcrypt hash จริงสำหรับผู้ใช้งาน login
  ระบบ front-end จะเรียก backend `/api/login` โดยตรง
- เปิด CORS ให้ทุก origin ไว้เพื่อความสะดวกตอนพัฒนา ก่อน production ควรจำกัด origin
