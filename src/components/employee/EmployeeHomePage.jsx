import React, { useEffect, useState } from "react";
import { BadgeCheck, Bell, CalendarDays, ClipboardList, Clock3, UserRound } from "lucide-react";
import { employeeAppService } from "../../services/employeeApp";

const toneClasses = {
  violet: "bg-violet-50 text-violet-700",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  slate: "bg-slate-100 text-slate-700",
};
function Card({ title, value, icon: Icon, tone = "violet" }) {
  return <div className="rounded-3xl border border-white bg-white p-4 shadow-sm"><div className={`mb-3 grid h-11 w-11 place-items-center rounded-2xl ${toneClasses[tone] || toneClasses.violet}`}><Icon size={20} /></div><p className="text-xs font-bold text-slate-400">{title}</p><b className="mt-1 block text-lg">{value || "—"}</b></div>;
}

export default function EmployeeHomePage({ company, employeeId, go, settings = {}, allowed = () => true }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    employeeAppService.loadEmployeeHomeSummary(company.company_id, employeeId).then(setSummary).catch((err) => setError(err.message));
  }, [company.company_id, employeeId]);
  const profile = summary?.profile || {};
  const status = summary?.todayAttendance || {};
  const lastIn = status.events?.find((event) => event.event_type === "check_in");
  const lastOut = status.events?.find((event) => event.event_type === "check_out");
  return <div className="space-y-5"><section className="rounded-[2rem] bg-gradient-to-l from-violet-800 to-slate-800 p-5 text-white shadow-xl"><p className="text-sm text-violet-200">مرحباً بك</p><h2 className="mt-1 text-2xl font-black">{profile.name || "الموظف"}</h2><p className="mt-2 text-sm text-violet-100">{profile.job || "غير محدد"} • {profile.branch || "غير محدد"}</p>{allowed("attendance_checkin", "can_create") && <button onClick={() => go("/employee/attendance")} className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm font-black text-violet-800">تسجيل الحضور الآن</button>}</section>{error && <div className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}{settings.employee_notice && <div className="rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{settings.employee_notice}</div>}<section className="grid grid-cols-2 gap-3 md:grid-cols-4"><Card title="الرقم الوظيفي" value={profile.id || employeeId} icon={UserRound} /><Card title="حالة اليوم" value={status.hasCheckOut ? "تم تسجيل الخروج" : status.hasCheckIn ? "تم تسجيل الدخول" : "لم يسجل دخول"} icon={BadgeCheck} tone="green" /><Card title="آخر حضور" value={lastIn?.event_time ? new Date(lastIn.event_time).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : "—"} icon={Clock3} tone="amber" /><Card title="آخر خروج" value={lastOut?.event_time ? new Date(lastOut.event_time).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : "—"} icon={Clock3} tone="slate" />{settings.show_leave_balance !== false && <Card title="رصيد الإجازات" value={summary?.leaveBalance || "غير محدد"} icon={CalendarDays} tone="violet" />}<Card title="طلبات معلقة" value={summary?.pendingRequests || 0} icon={ClipboardList} tone="amber" />{settings.notifications_enabled !== false && <Card title="آخر إشعار" value={summary?.latestNotification?.title || "لا توجد إشعارات"} icon={Bell} tone="violet" />}</section></div>;
}
