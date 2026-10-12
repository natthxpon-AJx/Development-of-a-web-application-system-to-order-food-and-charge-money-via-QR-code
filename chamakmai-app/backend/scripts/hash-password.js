// วิธีใช้: node scripts/hash-password.js <รหัสผ่าน>
// จะพิมพ์ bcrypt hash ออกมา เอาไปแทนค่าใน users.password_hash
// เครื่องมือช่วยสร้าง hash สำหรับเตรียมข้อมูลผู้ใช้โดยไม่เก็บรหัสผ่านเป็นข้อความธรรมดา
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("ใช้งาน: node scripts/hash-password.js <รหัสผ่าน>");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log(hash);
