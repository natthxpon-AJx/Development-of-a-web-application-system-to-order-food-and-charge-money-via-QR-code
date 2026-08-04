# ชาแมกไม้ — Backend API (ใช้ร่วมกันทุกบทบาท: ลูกค้า / ครัว / แคชเชียร์ / เจ้าของร้าน)

REST API (Express + mysql2 + bcryptjs) ที่ implement ตามสคีมาในเอกสาร `Database_Design__SQL_.docx`
(5 ตาราง: `menu_items`, `orders`, `order_items`, `tables`, `users`) เพิ่ม `sku` ใน `menu_items`
และเพิ่ม `phone`/`position` ใน `users` เพื่อรองรับหน้าจัดการพนักงานที่มีอยู่แล้ว

## ขั้นตอนติดตั้ง

### 1) เปิด XAMPP แล้วสตาร์ท Apache + MySQL

### 2) สร้างฐานข้อมูลด้วย schema.sql
1. เปิด `http://localhost/phpmyadmin`
2. แท็บ **Import** → เลือกไฟล์ `schema.sql` → กด **Go**
   (ไฟล์นี้ import ซ้ำได้ปลอดภัย จะลบตารางเดิมแล้วสร้างใหม่ทุกครั้ง)

### 3) ตั้งค่าการเชื่อมต่อฐานข้อมูล
```bash
cd backend
cp .env.example .env
```
ค่าเริ่มต้นตรงกับ XAMPP มาตรฐาน (`root` / ไม่มีรหัสผ่าน / พอร์ต 3306)

### 4) ติดตั้งแพ็กเกจและรัน
```bash
npm install
npm start
```
รันที่ `http://localhost:4000`

### 5) สร้างผู้ใช้งานจริง
Schema นี้ไม่มีผู้ใช้งานตัวอย่างสำหรับ login
สามารถสร้างผู้ใช้งานใหม่ได้ผ่านหน้า "จัดการพนักงาน" ของ Owner หรือเรียก POST /api/staff
ซึ่งจะ hash password ให้อัตโนมัติ หากต้องการ insert ด้วย SQL เอง ให้รัน:
```bash
npm run hash-password 3333
```
แล้วนำ hash ที่ได้ไปใช้กับ INSERT/UPDATE ในคอลัมน์ `users.password_hash`

## โครงสร้างตาราง

- **menu_items** — `menu_id` (PK), **`sku`**, `name`, `type` (food/drink), `category`, `price`, `image_url`, `is_available`, `options_config` (JSON)
- **orders** — หัวบิล: `order_id` (PK), `table_number`, `total_price`, `status` (waiting/cooking/served/completed/cancelled), `payment_method`, `is_paid`, `created_at`
- **order_items** — รายการย่อย: `order_item_id` (PK), `order_id` (FK), `menu_id` (FK), `item_name`, `price_at_order`, `quantity`, `selected_options` (JSON), `item_status`
- **tables** — สถานะโต๊ะ: `table_id` (PK, เช่น T05), `status`, `current_order_id` (FK), `last_active`
- **users** — พนักงาน: `user_id` (PK), `username`, `password_hash`, `display_name`, `role` (admin/staff), **`phone`**, **`position`** (2 คอลัมน์หลังเป็นส่วนขยาย)

## Endpoints

### เมนู
| Method | Path                    | ใช้ที่หน้า | คำอธิบาย |
|--------|-------------------------|-----------|----------|
| GET    | `/api/menu`              | Customer, Owner | เมนูทั้งหมด (รวม sku) |
| GET    | `/api/categories`        | Customer, Owner | หมวดหมู่ (คำนวณจากเมนูจริง) |
| POST   | `/api/menu`               | Owner | เพิ่มเมนูใหม่ `{sku, name, type, category, price, imageUrl, optionsConfig}` |
| PATCH  | `/api/menu/:id`           | Owner | เปิด/ปิดขาย `{isAvailable: true\|false}` |

### ออเดอร์
| Method | Path                       | ใช้ที่หน้า | คำอธิบาย |
|--------|----------------------------|-----------|----------|
| GET    | `/api/orders?table=T05`    | Customer, Cashier | ออเดอร์ของโต๊ะ (ไม่ใส่ `table` = ทั้งหมด ใช้โดย Kitchen/Cashier) |
| POST   | `/api/orders`                | Customer | สร้างออเดอร์ `{table, items:[{menuId, sku, name, price, qty, options}]}` |
| PATCH  | `/api/orders/:id/status`     | Kitchen | อัปเดตสถานะ `{status}` — waiting → cooking → served |

### การชำระเงิน (ไม่มีตาราง payments แยก ใช้ orders.is_paid/payment_method)
| Method | Path                       | ใช้ที่หน้า | คำอธิบาย |
|--------|----------------------------|-----------|----------|
| GET    | `/api/payments?table=T05`  | Customer | ประวัติออเดอร์ที่จ่ายแล้วของโต๊ะ (ไม่ใส่ table = ทั้งหมด ใช้โดย Owner dashboard) |
| POST   | `/api/payments`              | Cashier | ปิดบิลออเดอร์ที่ค้างอยู่ทั้งหมดของโต๊ะ `{table, method}` ในครั้งเดียว แล้วเปิดโต๊ะว่างคืน |

### พนักงาน
| Method | Path            | ใช้ที่หน้า | คำอธิบาย |
|--------|-----------------|-----------|----------|
| GET    | `/api/staff`     | Owner | รายชื่อพนักงานทั้งหมด (ไม่ส่ง password กลับ) |
| POST   | `/api/staff`     | Owner | เพิ่มพนักงานใหม่ `{username, password, displayName, role, phone, position}` — hash รหัสผ่านให้อัตโนมัติด้วย bcrypt |

## Flow สถานะออเดอร์ (ตาม ENUM ใน orders.status)

```
waiting --(ครัวกดรับออเดอร์)--> cooking --(ครัวกดเสร็จสิ้น)--> served --(แคชเชียร์คิดเงิน)--> completed
                                                                              └--(ยกเลิก)--> cancelled
```

- **Kitchen** เปลี่ยนสถานะได้แค่ waiting→cooking→served (ผ่าน `PATCH /api/orders/:id/status`)
- **Cashier** ไม่ได้แก้ทีละออเดอร์ แต่ปิดบิล "ทั้งโต๊ะ" ผ่าน `POST /api/payments` ซึ่งจะตั้ง
  ทุกออเดอร์ที่ยังไม่จ่ายของโต๊ะนั้นเป็น `completed` + `is_paid=1` พร้อมกัน (เหมือน flow เดิม
  ที่คิดเงินรวมทั้งบิลของโต๊ะ ไม่ใช่ทีละออเดอร์)

## หมายเหตุ

- สำหรับ login จริง ให้สร้างผู้ใช้งานผ่าน backend หรือ insert bcrypt hash ลงฐานข้อมูลให้เรียบร้อย
- Owner dashboard ยังใช้ตัวคูณโดยประมาณ (mock multiplier) สำหรับมุมมอง "สัปดาห์นี้/เดือนนี้"
  เพราะฐานข้อมูลตัวอย่างยังไม่มีข้อมูลย้อนหลังจริง — ถ้าต้องการ query ตามช่วงวันที่จริง
  สามารถเพิ่มพารามิเตอร์ `?from=&to=` ใน `/api/payments` ได้ในอนาคต
- เปิด CORS ให้ทุก origin ไว้เพื่อความสะดวกตอนพัฒนา ก่อน production ควรจำกัด origin
