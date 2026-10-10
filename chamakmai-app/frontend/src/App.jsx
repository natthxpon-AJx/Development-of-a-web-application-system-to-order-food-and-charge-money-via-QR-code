import { useEffect, useState } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Customer from "./pages/customer";
import Kitchen from "./pages/kitchen";
import Cashier from "./pages/cashier";
import Owner from "./pages/owner";
import { fetchCurrentUser, getCurrentUser } from "./services/api";

function staffHome(user) {
  if (user?.role === "admin") return "/owner";
  if (user?.position === "เจ้าของร้าน") return "/owner";
  if (user?.position === "ครัว") return "/kitchen";
  if (user?.position === "แคชเชียร์") return "/cashier";
  return "/";
}

function ProtectedRoute({ access, children }) {
  const [user, setUser] = useState(getCurrentUser);
  const [checking, setChecking] = useState(!!user);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const onChange = () => setUser(getCurrentUser());
    window.addEventListener("cm-auth-change", onChange);
    return () => window.removeEventListener("cm-auth-change", onChange);
  }, []);
  useEffect(() => {
    if (!user?.expiresAt) return;
    const timer = setTimeout(() => setUser(null), Math.max(0, user.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [user?.expiresAt]);
  useEffect(() => {
    let cancelled = false;
    if (!getCurrentUser()) { setChecking(false); return; }
    setChecking(true);
    setError(null);
    fetchCurrentUser().catch((err) => {
      if (!cancelled && err.status !== 401) setError(err.message);
    }).finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [attempt]);
  if (!user) return <Navigate to="/" replace />;
  if (checking) return <div className="access-state" role="status">กำลังตรวจสอบสิทธิ์...</div>;
  if (error) return <div className="access-state" role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>ลองใหม่</button></div>;
  const allowed = user.role === "admin" || access === "owner" && user.position === "เจ้าของร้าน" || access === "kitchen" && user.position === "ครัว" || access === "cashier" && user.position === "แคชเชียร์";
  if (!allowed) return <Navigate to={staffHome(user)} replace />;
  return typeof children === "function" ? children(user) : children;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/customer/:tableNumber" element={<Customer />} />
    <Route path="/kitchen" element={<ProtectedRoute access="kitchen"><Kitchen /></ProtectedRoute>} />
    <Route path="/cashier" element={<ProtectedRoute access="cashier"><Cashier /></ProtectedRoute>} />
    <Route path="/owner" element={<ProtectedRoute access="owner">{(user) => <Owner canManageStaff={user.role === "admin"} />}</ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
