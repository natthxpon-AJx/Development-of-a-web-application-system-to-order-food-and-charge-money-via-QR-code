import bcrypt from "bcryptjs";
import pool from "../db.js";
import { ensureOperationalColumns } from "../server.js";

try {
  const username = process.env.INITIAL_ADMIN_USERNAME?.trim();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!username || username.length > 50 || !password || password.length < 8 || password.length > 72) throw new Error("ตั้งค่า INITIAL_ADMIN_USERNAME และ INITIAL_ADMIN_PASSWORD (8 ถึง 72 ตัวอักษร) ใน backend/.env ก่อน");
  await ensureOperationalColumns();
  const [admins] = await pool.query("SELECT user_id FROM users WHERE role = 'admin' AND is_active = 1");
  if (admins.length) throw new Error("มีบัญชีเจ้าของร้านแล้ว กรุณาจัดการพนักงานผ่านหน้าเจ้าของร้าน");
  await pool.query("INSERT INTO users (username, password_hash, display_name, role, position, is_active) VALUES (?, ?, ?, 'admin', 'เจ้าของร้าน', 1)", [username, await bcrypt.hash(password, 10), process.env.INITIAL_ADMIN_NAME || "เจ้าของร้าน"]);
  console.log("สร้างบัญชีเจ้าของร้านแล้ว กรุณาลบค่า INITIAL_ADMIN_PASSWORD ออกจากไฟล์ .env");
} catch (err) { console.error(err.message); process.exitCode = 1; }
finally { await pool.end(); }
