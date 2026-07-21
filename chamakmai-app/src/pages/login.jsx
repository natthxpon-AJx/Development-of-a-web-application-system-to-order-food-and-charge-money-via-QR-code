import React, { useEffect, useRef, useState } from "react";

const styles = `
  :root{
    --brown-900:#3B2A1B; --brown-800:#5B4530; --brown-700:#6E5237;
    --cream-100:#F3F4F6; --cream-050:#FFFFFF; --paper:#FFFFFF;
    --amber:#D97706; --amber-dark:#B45F04; --amber-bg:#FEF3C7;
    --jade:#16A34A; --jade-bg:#DCFCE7;
    --clay:#DC2626; --clay-bg:#FEE2E2;
    --ink:#111827; --ink-soft:#6B7280; --line:#E5E7EB;
    --navy-900:#111827; --navy-800:#1F2937; --navy-700:#374151;
    font-family:'Sarabun', sans-serif;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--cream-100);color:var(--ink);min-height:100vh;}
  body{-webkit-font-smoothing:antialiased;}
  h1,h2,h3{font-family:'Sarabun', sans-serif;font-weight:700;}
  button{font-family:inherit;cursor:pointer;}

  #app{min-height:100vh;display:flex;flex-direction:column;background:var(--cream-100);}
  .stage{flex:1;padding:0;display:flex;justify-content:center;}
  .stage-inner{width:100%;max-width:100%;}

  /* ===== Desktop app titlebar ===== */
  .app-window{background:transparent;overflow:hidden;display:flex;flex-direction:column;min-height:100vh;}
  .app-titlebar{background:var(--navy-800);color:#F3F4F6;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;}
  .app-titlebar .tleft{display:flex;align-items:center;gap:10px;font-weight:600;font-size:14.5px;}
  .app-titlebar .dot{width:9px;height:9px;border-radius:50%;background:var(--amber);}
  .app-titlebar .online{font-size:11px;background:var(--jade);color:#fff;padding:3px 9px;border-radius:20px;font-weight:600;display:flex;align-items:center;gap:5px;}
  .app-titlebar .online::before{content:'';width:6px;height:6px;border-radius:50%;background:#fff;}
  
  .app-flex{display:flex;flex:1;justify-content:center;align-items:center;background:var(--cream-100);padding:20px;}

  /* ===== Login Card Design ===== */
  .login-card{
    background:var(--paper);
    border:1px solid var(--line);
    border-radius:20px;
    padding:36px 32px;
    width:100%;
    max-width:400px;
    box-shadow:0 10px 25px -5px rgba(60,40,20,0.1);
  }
  .brand-header{text-align:center;margin-bottom:28px;}
  .brand-logo{
    width:54px;
    height:54px;
    background:var(--amber-bg);
    color:var(--amber);
    font-size:24px;
    display:flex;
    align-items:center;
    justify-content:center;
    border-radius:50%;
    margin:0 auto 12px;
  }
  .brand-title{font-size:18px;color:var(--brown-900);margin:0;}
  .brand-subtitle{font-size:12px;color:var(--ink-soft);margin-top:4px;}

  /* ===== Form Styling ===== */
  .form-group{
    margin-bottom:18px;
    text-align:left;
  }
  .form-group label{
    display:block;
    font-size:13px;
    font-weight:700;
    color:var(--brown-800);
    margin-bottom:6px;
  }
  .form-input{
    width:100%;
    padding:12px 16px;
    border:1px solid var(--line);
    border-radius:12px;
    font-size:14px;
    font-family:inherit;
    background:var(--cream-100);
    color:var(--navy-900);
    transition:all 0.15s ease;
  }
  .form-input:focus{
    outline:none;
    border-color:var(--amber);
    background:var(--cream-050);
    box-shadow:0 0 0 3px rgba(217, 119, 6, 0.15);
  }

  .btn{
    border:none;
    border-radius:12px;
    padding:14px 16px;
    font-weight:700;
    font-size:14.5px;
    transition:transform .08s ease;
    width:100%;
  }
  .btn:active{transform:scale(0.97);}
  .btn-primary{background:var(--amber);color:#fff;}
  .btn-primary:hover{background:var(--amber-dark);}

  .toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:var(--brown-900);color:#fff;padding:12px 22px;border-radius:30px;font-size:13.5px;font-weight:600;box-shadow:0 10px 25px -10px rgba(0,0,0,0.4);z-index:200;}
`;

// ข้อมูลพนักงานจำลองพร้อมระบบตรวจจับบทบาทหน้าที่โดยอัตโนมัติ
const USERS = [
  { username: 'owner', password: '3333', role: 'owner' },
  { username: 'cashier', password: '1111', role: 'cashier' },
  { username: 'kitchen', password: '2222', role: 'kitchen' }
];

export default function Login() {
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    // load fonts (preserve original UI)
    const id = 'cm-google-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@500;600;700&family=Sarabun:wght@400;500;600;700&family=Space+Mono&display=swap';
      document.head.appendChild(link);
    }
    document.title = 'ร้านชาแมกไม้ — เข้าสู่ระบบ';
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const uVal = usernameRef.current.value.trim();
    const pVal = passwordRef.current.value;
    const matchedUser = USERS.find(user => user.username === uVal && user.password === pVal);

    if (matchedUser) {
      showToast('เข้าสู่ระบบสำเร็จ! กำลังนำทางไปยังหน้าระบบงาน...');
      setTimeout(() => {
        window.location.href = matchedUser.role + '.html';
      }, 1200);
    } else {
      showToast('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหมี่อีกครั้ง');
      passwordRef.current.value = '';
      passwordRef.current.focus();
    }
  }

  return (
    <div id="app">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="app-window">
        <div className="app-titlebar">
          <div className="tleft"><span className="dot"></span>CM · เข้าสู่ระบบพนักงาน</div>
          <div className="online">Online</div>
        </div>

        <div className="app-flex">
          <div className="login-card">
            <div className="brand-header">
              <div className="brand-logo">🍵</div>
              <h2 className="brand-title">ร้านชาแมกไม้</h2>
              <p className="brand-subtitle">ระบบบริหารจัดการพนักงานหลังบ้าน</p>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="username">ชื่อผู้ใช้งาน (Username)</label>
                <input ref={usernameRef} type="text" id="username" className="form-input" placeholder="ป้อนชื่อผู้ใช้งาน" required autoComplete="username" />
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="password">รหัสผ่าน (Password)</label>
                <input ref={passwordRef} type="password" id="password" className="form-input" placeholder="ป้อนรหัสผ่าน" required autoComplete="current-password" />
              </div>

              <button type="submit" className="btn btn-primary">เข้าสู่ระบบ</button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: 20, lineHeight: 1.6, borderTop: '1px dashed var(--line)', paddingTop: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--brown-800)' }}>ข้อมูลจำลองสำหรับใช้ทดสอบเข้าระบบ:</div>
              <div>เจ้าของร้าน: <span className="mono">owner</span> / รหัส: <span className="mono">3333</span></div>
              <div>แคชเชียร์: <span className="mono">cashier</span> / รหัส: <span className="mono">1111</span></div>
              <div>พนักงานครัว: <span className="mono">kitchen</span> / รหัส: <span className="mono">2222</span></div>
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}