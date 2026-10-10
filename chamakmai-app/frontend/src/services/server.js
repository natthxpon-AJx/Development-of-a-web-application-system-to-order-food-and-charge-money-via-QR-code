import { startServer } from "../../../backend/server.js";
startServer().catch((error) => { console.error("เริ่มระบบหลังบ้านไม่สำเร็จ:", error); process.exitCode = 1; });
