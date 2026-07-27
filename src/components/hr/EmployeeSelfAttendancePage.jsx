import React, { useEffect, useMemo, useState } from "react";
import { MapPin, RefreshCw, UserCheck, UserMinus } from "lucide-react";
import { attendanceService } from "../../services/attendance";
import { attendanceGeoService } from "../../services/attendanceGeo";

const clean = (value) => String(value ?? "").trim();
const timeOnly = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 5) : date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
};

export default function EmployeeSelfAttendancePage({ employees = [], currentUser, currentCompany }) {
  const companyId = currentCompany?.company_id || currentUser?.company_id || "";
  const employeeId = currentUser?.employee_id || currentUser?.employeeId || currentUser?.id || "";
  const employee = useMemo(() => employees.find((item) => item.id === employeeId || item.employee_id === employeeId) || {}, [employees, employeeId]);
  const [status, setStatus] = useState({ hasCheckIn: false, hasCheckOut: false, events: [] });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!companyId || !employeeId) return;
    try {
      setStatus(await attendanceGeoService.getTodayEmployeeAttendanceStatus(companyId, employeeId));
    } catch (error) {
      setMessage(error.message || "تعذر تحميل حالة الحضور لهذا اليوم");
    }
  };

  useEffect(() => { load(); }, [companyId, employeeId]);

  const getPosition = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("المتصفح لا يدعم تحديد الموقع"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });

  const saveEvent = async (eventType) => {
    if (!companyId || !employeeId) return setMessage("لا يمكن تحديد الشركة أو الموظف الحالي");
    if (eventType === "check_in" && status.hasCheckIn) return setMessage("تم تسجيل الحضور مسبقاً لهذا اليوم");
    if (eventType === "check_out" && !status.hasCheckIn) return setMessage("يجب تسجيل الحضور أولاً");
    if (eventType === "check_out" && status.hasCheckOut) return setMessage("تم تسجيل الخروج مسبقاً لهذا اليوم");
    setSaving(true);
    setMessage("");
    try {
      const position = await getPosition();
      const currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
      const allowedLocation = await attendanceGeoService.getEmployeeAllowedLocation(companyId, employeeId, employee.branch || currentUser?.branch || "");
      const validation = attendanceGeoService.validateEmployeeLocation(currentLocation, allowedLocation);
      if (validation.status === "outside") {
        setMessage(validation.message);
        return;
      }
      const attendanceDate = attendanceGeoService.getTodayDateOnly();
      const now = new Date();
      await attendanceGeoService.saveEmployeeAttendanceEvent({
        company_id: companyId,
        employee_id: employeeId,
        employee_name: employee.name || currentUser?.name || currentUser?.username || "",
        branch: employee.branch || currentUser?.branch || "",
        attendance_date: attendanceDate,
        event_type: eventType,
        event_time: now.toISOString(),
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        allowed_latitude: allowedLocation?.latitude || null,
        allowed_longitude: allowedLocation?.longitude || null,
        allowed_radius_meters: allowedLocation?.allowed_radius_meters || null,
        distance_from_allowed_location: validation.distance,
        geofence_status: validation.status,
        device_info: navigator.userAgent,
        notes: validation.status === "unavailable" ? validation.message : "",
      });
      const time = now.toTimeString().slice(0, 5);
      if (eventType === "check_in") {
        await attendanceService.checkInEmployee(employee, attendanceDate, time, {}, { company_id: companyId, created_by: currentUser?.username || "employee_app" });
      } else {
        const existing = await attendanceService.loadAttendanceRecords({ companyId, employeeId, date: attendanceDate }).then((rows) => rows[0] || {});
        await attendanceService.checkOutEmployee(employee, attendanceDate, time, {}, existing, { company_id: companyId, updated_by: currentUser?.username || "employee_app" });
      }
      setMessage(eventType === "check_in" ? "تم تسجيل الحضور بنجاح" : "تم تسجيل الخروج بنجاح");
      await load();
    } catch (error) {
      console.error("Employee self attendance error:", error);
      setMessage(error.message || "تعذر حفظ الحضور الذاتي");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4" dir="rtl">
      <section className="mx-auto max-w-3xl space-y-5">
        <div className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold">بوابة الحضور الذاتي</h1>
              <p className="mt-1 text-sm text-slate-500">تسجيل الحضور والانصراف مع التحقق من موقع العمل</p>
            </div>
            <button onClick={load} className="btn-secondary"><RefreshCw size={17} /> تحديث</button>
          </div>
          <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm md:grid-cols-2">
            <p><b>الموظف:</b> {employee.name || currentUser?.name || currentUser?.username || "غير محدد"}</p>
            <p><b>الرقم الوظيفي:</b> {employeeId || "غير محدد"}</p>
            <p><b>الفرع:</b> {employee.branch || currentUser?.branch || "غير محدد"}</p>
            <p><b>التاريخ:</b> {attendanceGeoService.getTodayDateOnly()}</p>
          </div>
        </div>
        {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{message}</div>}
        <div className="grid gap-4 md:grid-cols-2">
          <button disabled={saving || status.hasCheckIn} onClick={() => saveEvent("check_in")} className="panel flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-green-700 disabled:opacity-50">
            <UserCheck size={34} />
            <b className="text-xl">تسجيل الحضور</b>
            <span className="text-xs text-slate-500">يتطلب السماح بتحديد الموقع</span>
          </button>
          <button disabled={saving || !status.hasCheckIn || status.hasCheckOut} onClick={() => saveEvent("check_out")} className="panel flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-brand-700 disabled:opacity-50">
            <UserMinus size={34} />
            <b className="text-xl">تسجيل الخروج</b>
            <span className="text-xs text-slate-500">بعد انتهاء الدوام</span>
          </button>
        </div>
        <div className="panel p-5">
          <h2 className="mb-3 flex items-center gap-2 font-extrabold"><MapPin size={18} /> أحداث اليوم</h2>
          {status.events?.length ? (
            <div className="space-y-2">
              {status.events.map((event) => (
                <div key={event.event_id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                  <b>{event.event_type === "check_in" ? "حضور" : "خروج"}</b>
                  <span>{timeOnly(event.event_time)}</span>
                  <span>{event.geofence_status === "inside" ? "داخل النطاق" : event.geofence_status === "outside" ? "خارج النطاق" : "بدون موقع محدد"}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">لا توجد أحداث حضور لهذا اليوم</p>}
        </div>
      </section>
    </main>
  );
}
