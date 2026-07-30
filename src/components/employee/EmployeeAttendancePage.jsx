import React, { useEffect, useState } from "react";
import { MapPin, ShieldCheck } from "lucide-react";
import { attendanceService } from "../../services/attendance";
import { employeeAppService, dateOnly } from "../../services/employeeApp";

const timeLabel = (value) => value ? new Date(value).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : "—";
const minutesOf = (time = "00:00") => {
  const [h, m] = String(time || "00:00").slice(0, 5).split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

export default function EmployeeAttendancePage({ company, employeeId, user, settings = {}, allowed = () => true }) {
  const [profile, setProfile] = useState({});
  const [appSettings, setAppSettings] = useState({ geofence_required: true, allow_attendance_without_location: false });
  const [status, setStatus] = useState({ events: [] });
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const today = dateOnly();
  const load = async () => {
    const employee = await employeeAppService.loadEmployeeProfile(company.company_id, employeeId).catch(() => ({}));
    setProfile(employee);
    setAppSettings(settings?.setting_id || settings?.company_id ? settings : await employeeAppService.loadEmployeeAppSettings(company.company_id).catch(() => ({ geofence_required: true, allow_attendance_without_location: false })));
    setStatus(await employeeAppService.getTodayAttendanceStatus(company.company_id, employeeId).catch(() => ({ events: [] })));
    setHistory(await employeeAppService.loadEmployeeAttendanceHistory(company.company_id, employeeId, today.slice(0, 8) + "01", today).catch(() => []));
  };
  useEffect(() => { load(); }, [company.company_id, employeeId]);
  const getPosition = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("المتصفح لا يدعم تحديد الموقع"));
    navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error("يرجى السماح بالوصول إلى الموقع لتسجيل الحضور.")), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });
  const submit = async (eventType) => {
    if (!allowed("attendance_checkin", "can_create")) return setMessage("لا تملك صلاحية تسجيل الحضور من البوابة");
    if (eventType === "check_in" && status.hasCheckIn) return setMessage("تم تسجيل الدخول مسبقاً، لا يمكن تكرار تسجيل الدخول قبل الخروج.");
    if (eventType === "check_out" && !status.hasCheckIn) return setMessage("أول إجراء لهذا اليوم هو تسجيل الدخول.");
    if (eventType === "check_out" && status.hasCheckOut) return setMessage("تم تسجيل الخروج لهذا اليوم.");
    setSaving(true);
    setMessage("");
    try {
      const position = await getPosition();
      const currentLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy };
      if (appSettings.max_gps_accuracy_meters && currentLocation.accuracy > Number(appSettings.max_gps_accuracy_meters)) {
        return setMessage(`دقة GPS الحالية (${Math.round(currentLocation.accuracy)} م) أعلى من الحد المسموح (${appSettings.max_gps_accuracy_meters} م).`);
      }
      const allowedLocations = await employeeAppService.getAllowedAttendanceLocations(company.company_id, employeeId, profile.branch || user.branch || "");
      const validation = employeeAppService.validateGeofenceForEvent(currentLocation, allowedLocations, eventType, {
        allowWithoutLocation: appSettings.geofence_required === false || appSettings.allow_attendance_without_location === true,
      });
      if (eventType === "check_out" && validation.status === "outside" && appSettings.allow_checkout_outside_geofence === true) validation.allowed = true;
      const now = new Date();
      const matchedLocation = validation.matchedLocation || null;
      const scheduledStart = minutesOf(appSettings.default_check_in_time || "08:00") + Number(appSettings.grace_period_minutes || 0);
      const actualMinutes = now.getHours() * 60 + now.getMinutes();
      const lateMinutes = eventType === "check_in" && appSettings.count_late_after_grace !== false ? Math.max(0, actualMinutes - scheduledStart) : 0;
      const eventPayload = {
        event_id: crypto.randomUUID?.() || `EVT-${Date.now()}`,
        company_id: company.company_id,
        employee_id: employeeId,
        employee_name: profile.name || user.name || "",
        branch: profile.branch || user.branch || "",
        attendance_date: today,
        event_type: eventType,
        event_time: now.toISOString(),
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        allowed_latitude: matchedLocation?.latitude || null,
        allowed_longitude: matchedLocation?.longitude || null,
        allowed_radius_meters: matchedLocation?.allowed_radius_meters || null,
        distance_from_allowed_location: validation.distance,
        geofence_status: validation.status,
        matched_location_id: matchedLocation?.location_id || "",
        matched_location_name: matchedLocation?.location_name || "",
        matched_location_purpose: matchedLocation?.location_purpose || "",
        event_status: validation.allowed ? "accepted" : "rejected",
        rejection_reason: validation.allowed ? "" : (validation.message || "أنت خارج نطاق موقع العمل المسموح."),
        is_late: lateMinutes > 0,
        late_minutes: lateMinutes,
        source: "employee_app",
        device_info: navigator.userAgent,
        notes: "",
      };
      if (!validation.allowed) {
        if (appSettings.save_rejected_attendance_attempts !== false) await employeeAppService.saveEmployeeAttendanceEvent(eventPayload);
        return setMessage(validation.message || "أنت خارج نطاق موقع العمل المسموح.");
      }
      await employeeAppService.saveEmployeeAttendanceEvent(eventPayload);
      const clock = now.toTimeString().slice(0, 5);
      if (eventType === "check_in") await attendanceService.checkInEmployee(profile, today, clock, {}, { company_id: company.company_id, created_by: user.username || "employee_app" });
      else {
        const existing = await attendanceService.loadAttendanceRecords({ companyId: company.company_id, employeeId, date: today }).then((rows) => rows[0] || {});
        await attendanceService.checkOutEmployee(profile, today, clock, {}, existing, { company_id: company.company_id, updated_by: user.username || "employee_app" });
      }
      setMessage(eventType === "check_in" ? "تم تسجيل الدخول بنجاح" : "تم تسجيل الخروج بنجاح");
      await load();
    } catch (error) {
      console.error("Employee app attendance error:", error);
      setMessage(error.message || "تعذر تسجيل الحضور");
    } finally {
      setSaving(false);
    }
  };
  const currentStatus = status.hasCheckOut ? "تم تسجيل الخروج" : status.hasCheckIn ? "تم تسجيل الدخول" : "لم يسجل دخول";
  if (appSettings.enabled === false) return <div className="rounded-[2rem] bg-white p-8 text-center text-sm font-bold text-slate-500">تم تعطيل تطبيق الموظف لهذه الشركة مؤقتاً.</div>;
  return <div className="space-y-4"><section className="rounded-[2rem] bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700"><MapPin /></div><div><h2 className="text-xl font-black">تسجيل الحضور بالموقع</h2><p className="text-sm text-slate-500">{today} • {currentStatus}</p></div></div><div className="rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-800">{appSettings.employee_notice || "تسجيل الحضور بالموقع يعتمد على إذن الموقع ودقة GPS، ويتم حفظ بيانات الموقع لأغراض التحقق الإداري."}</div>{message && <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">{message}</div>}{allowed("attendance_checkin", "can_create") && <div className="mt-5 grid gap-3 md:grid-cols-2"><button disabled={saving || status.hasCheckIn} onClick={() => submit("check_in")} className="rounded-3xl bg-violet-700 p-5 text-lg font-black text-white disabled:opacity-50">تسجيل دخول</button><button disabled={saving || !status.hasCheckIn || status.hasCheckOut} onClick={() => submit("check_out")} className="rounded-3xl bg-slate-800 p-5 text-lg font-black text-white disabled:opacity-50">تسجيل خروج</button></div>}</section>{appSettings.show_attendance_history !== false && allowed("attendance_history", "can_view") && <section className="rounded-[2rem] bg-white p-5 shadow-sm"><h3 className="mb-3 flex items-center gap-2 font-black"><ShieldCheck size={18} /> سجل الحضور</h3>{history.length ? <div className="space-y-2">{history.map((event) => <div key={event.event_id} className="flex flex-wrap justify-between gap-2 rounded-2xl bg-slate-50 p-3 text-sm"><b>{event.event_type === "check_in" ? "دخول" : "خروج"}</b><span>{event.attendance_date}</span><span>{timeLabel(event.event_time)}</span><span>{event.geofence_status === "inside" ? "داخل النطاق" : event.geofence_status === "outside" ? "خارج النطاق" : "غير متاح"}</span></div>)}</div> : <p className="text-sm text-slate-400">لا توجد أحداث حضور</p>}</section>}</div>;
}
