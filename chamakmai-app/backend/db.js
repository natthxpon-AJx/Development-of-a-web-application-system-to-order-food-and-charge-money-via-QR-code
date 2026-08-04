import mysql from "mysql2/promise";
import "dotenv/config";

// ค่าเริ่มต้นตรงกับการตั้งค่า XAMPP มาตรฐาน (MySQL ที่พอร์ต 3306, user root, ไม่มีรหัสผ่าน)
// ถ้าตั้งรหัสผ่านหรือพอร์ตไว้ต่างจากนี้ ให้แก้ในไฟล์ .env แทน
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chamakmai",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;