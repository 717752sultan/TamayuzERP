import React, { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, ClipboardList, Home, LogOut, MapPin, UserRound } from "lucide-react";
import { employeeAppService } from "../../services/employeeApp";
import EmployeeHomePage from "./EmployeeHomePage";
import EmployeeProfilePage from "./EmployeeProfilePage";
import EmployeeAttendancePage from "./EmployeeAttendancePage";
import EmployeeRequestsPage from "./EmployeeRequestsPage";
import NewEmployeeRequestPage from "./NewEmployeeRequestPage";
import EmployeeNotificationsPage from "./EmployeeNotificationsPage";
import EmployeeSchedulePage from "./EmployeeSchedulePage";

const nav = [
  ["/employee", "الرئيسية", Home, "profile_basic"],
  ["/employee/attendance", "الحضور", MapPin, "attendance_checkin"],
  ["/employee/requests", "طلباتي", ClipboardList, "requests_leave"],
  ["/employee/schedule", "الدوام", CalendarDays, "schedule"],
  ["/employee/profile", "ملفي", UserRound, "profile_basic"],
];

const pathNow = () => window.location.pathname;

export function EmployeeLoginPage() {
  const [form, setForm] = useState({ company_code: "PUREMONEY", login: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await employeeAppService.loginEmployee(form.company_code, form.login, form.password);
      window.history.replaceState({}, "", "/employee");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (err) {
      setError(err.message || "تعذر تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };
  return <main className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-950 to-slate-800 p-5" dir="rtl"><section className="mx-auto flex min-h-[calc(100vh-40px)] max-w-md items-center"><form onSubmit={submit} className="w-full rounded-[2rem] border border-white/10 bg-white/95 p-6 shadow-2xl"><div className="mb-7 text-center"><div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-violet-700 text-2xl font-black text-white">ت</div><h1 className="text-2xl font-black text-slate-900">بوابة موظفي التميز</h1><p className="mt-2 text-sm text-slate-500">دخول الموظف للخدمات الذاتية والحضور بالموقع</p></div>{error && <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}<label className="mb-3 block text-sm font-bold">كود الشركة<input value={form.company_code} onChange={(e) => setForm({ ...form, company_code: e.target.value })} className="field mt-2" /></label><label className="mb-3 block text-sm font-bold">اسم المستخدم أو الرقم الوظيفي<input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} className="field mt-2" autoComplete="username" /></label><label className="mb-5 block text-sm font-bold">كلمة المرور<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="field mt-2" autoComplete="current-password" /></label><button disabled={loading} className="btn-primary w-full justify-center bg-violet-700 hover:bg-violet-800">{loading ? "جاري الدخول..." : "دخول الموظف"}</button></form></section></main>;
}

export default function EmployeePortalApp() {
  const [session, setSession] = useState(() => employeeAppService.getSession());
  const [path, setPath] = useState(pathNow());
  useEffect(() => {
    const handler = () => setPath(pathNow());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);
  const user = session?.user || {};
  const company = session?.company || {};
  const settings = session?.settings || {};
  const permissions = session?.permissions || [];
  const requestTypes = session?.requestTypes || [];
  const employeeId = user.employee_id || user.employeeId || user.id || "";
  const allowed = (moduleKey, action = "can_view") => employeeAppService.hasPermission(permissions, moduleKey, action);
  const visibleNav = nav.filter(([, , , moduleKey]) => {
    if (moduleKey === "schedule" && settings.show_schedule === false) return false;
    if (moduleKey === "attendance_checkin") return allowed("attendance_checkin", "can_create") || allowed("attendance_history", "can_view");
    if (moduleKey === "requests_leave") return requestTypes.some((type) => type.is_enabled !== false) || allowed("requests_leave", "can_create");
    return allowed(moduleKey, "can_view");
  });
  const go = (nextPath) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  };
  const logout = () => {
    employeeAppService.clearSession();
    setSession(null);
    go("/employee-login");
  };
  const title = useMemo(() => nav.find(([href]) => href === path)?.[1] || "بوابة الموظف", [path]);
  if (!session) return <EmployeeLoginPage />;
  if (settings.app_enabled === false) return <main className="grid min-h-screen place-items-center bg-slate-100 p-5" dir="rtl"><div className="rounded-[2rem] bg-white p-8 text-center font-bold text-slate-600 shadow-sm">تم إيقاف تطبيق الموظف مؤقتًا من قبل الإدارة.</div></main>;
  const blocked = (path === "/employee/attendance" && !allowed("attendance_checkin", "can_create") && !allowed("attendance_history", "can_view"))
    || (path === "/employee/profile" && !allowed("profile_basic", "can_view"))
    || (path === "/employee/schedule" && (settings.show_schedule === false || !allowed("schedule", "can_view")))
    || (path === "/employee/notifications" && (settings.notifications_enabled === false || !allowed("notifications", "can_view")))
    || (path.startsWith("/employee/requests") && !visibleNav.some(([href]) => href === "/employee/requests"));
  const common = { user, company, employeeId, go, settings, permissions, requestTypes, allowed };
  return <main className="min-h-screen bg-slate-100 pb-24 text-slate-900" dir="rtl"><header className="sticky top-0 z-30 border-b border-white/20 bg-violet-950/95 px-4 py-4 text-white shadow-lg backdrop-blur"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3"><div><p className="text-xs text-violet-200">{company.company_name || "التميز للأنظمة الذكية"}</p><h1 className="text-lg font-black">{title}</h1></div><button onClick={logout} className="rounded-2xl bg-white/10 p-3 hover:bg-white/20" title="تسجيل الخروج"><LogOut size={18} /></button></div></header><section className="mx-auto max-w-5xl p-4">{blocked && <div className="rounded-[2rem] bg-white p-8 text-center text-sm font-bold text-red-700 shadow-sm">لا تملك صلاحية الوصول إلى هذه الصفحة</div>}{!blocked && path === "/employee" && <EmployeeHomePage {...common} />}{!blocked && path === "/employee/profile" && <EmployeeProfilePage {...common} />}{!blocked && path === "/employee/attendance" && <EmployeeAttendancePage {...common} />}{!blocked && path === "/employee/requests" && <EmployeeRequestsPage {...common} />}{!blocked && path === "/employee/requests/new" && <NewEmployeeRequestPage {...common} />}{!blocked && path === "/employee/notifications" && <EmployeeNotificationsPage {...common} />}{!blocked && path === "/employee/schedule" && <EmployeeSchedulePage {...common} />}{!blocked && !["/employee", "/employee/profile", "/employee/attendance", "/employee/requests", "/employee/requests/new", "/employee/notifications", "/employee/schedule"].includes(path) && <EmployeeHomePage {...common} />}</section><nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-2xl backdrop-blur"><div className="mx-auto grid max-w-5xl grid-cols-5 gap-1 p-2">{visibleNav.map(([href, label, Icon]) => <button key={href} onClick={() => go(href)} className={`rounded-2xl px-1 py-2 text-[11px] font-extrabold ${path === href ? "bg-violet-700 text-white" : "text-slate-500 hover:bg-slate-100"}`}><Icon className="mx-auto mb-1" size={18} />{label}</button>)}{settings.notifications_enabled !== false && allowed("notifications", "can_view") && <button onClick={() => go("/employee/notifications")} className={`absolute left-4 -top-14 rounded-full p-4 shadow-xl ${path === "/employee/notifications" ? "bg-violet-700 text-white" : "bg-white text-violet-700"}`}><Bell size={20} /></button>}</div></nav></main>;
}
