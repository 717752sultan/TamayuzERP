import { supabase } from "./supabase";
import { attendanceGeoService } from "./attendanceGeo";

const bool = (value, fallback = false) => value === undefined || value === null ? fallback : value === true;
const clean = (value) => String(value ?? "").trim();

export const employeePortalPermissionModules = [
  ["profile_basic", "الملف الشخصي الأساسي"],
  ["profile_salary", "بيانات الراتب"],
  ["attendance_checkin", "تسجيل الحضور والانصراف"],
  ["attendance_history", "سجل الحضور"],
  ["requests_leave", "طلب إجازة"],
  ["requests_permission", "طلب استئذان"],
  ["requests_advance", "طلب سلفة"],
  ["requests_assistance", "طلب مساعدة"],
  ["requests_custody", "طلب عهدة"],
  ["requests_attendance_correction", "طلب تعديل حضور"],
  ["requests_hr_letter", "طلب خطاب HR"],
  ["notifications", "الإشعارات"],
  ["schedule", "جدول الدوام"],
  ["documents_upload", "رفع المرفقات"],
];

export const defaultEmployeeRequestTypes = [
  ["leave", "طلب إجازة", "requests_leave"],
  ["permission", "طلب استئذان", "requests_permission"],
  ["advance", "طلب سلفة", "requests_advance"],
  ["assistance", "طلب مساعدة", "requests_assistance"],
  ["custody", "طلب عهدة", "requests_custody"],
  ["attendance_correction", "طلب تعديل حضور", "requests_attendance_correction"],
  ["hr_letter", "طلب خطاب HR", "requests_hr_letter"],
  ["general", "طلب عام", "profile_basic"],
];

export const defaultEmployeeAppSettings = {
  app_enabled: true,
  employee_login_enabled: true,
  geofence_required: true,
  max_gps_accuracy_meters: 100,
  allow_attendance_without_location: false,
  allow_checkout_outside_geofence: false,
  allow_attachments: true,
  show_schedule: true,
  show_attendance_history: true,
  show_salary: false,
  show_leave_balance: true,
  notifications_enabled: true,
  device_registration_enabled: false,
  single_device_only: false,
  employee_notice: "",
};

export const normalizeEmployeeAppSettings = (row = {}) => ({
  setting_id: row.setting_id || `employee_app_settings_${row.company_id || "default"}`,
  company_id: row.company_id || "",
  app_enabled: bool(row.app_enabled, true),
  employee_login_enabled: bool(row.employee_login_enabled, true),
  geofence_required: bool(row.geofence_required, true),
  max_gps_accuracy_meters: Number(row.max_gps_accuracy_meters || 100),
  allow_attendance_without_location: bool(row.allow_attendance_without_location, false),
  allow_checkout_outside_geofence: bool(row.allow_checkout_outside_geofence, false),
  allow_attachments: bool(row.allow_attachments, true),
  show_schedule: bool(row.show_schedule, true),
  show_attendance_history: bool(row.show_attendance_history, true),
  show_salary: bool(row.show_salary, false),
  show_leave_balance: bool(row.show_leave_balance, true),
  notifications_enabled: bool(row.notifications_enabled, true),
  device_registration_enabled: bool(row.device_registration_enabled, false),
  single_device_only: bool(row.single_device_only, false),
  employee_notice: row.employee_notice || "",
  updated_at: new Date().toISOString(),
});

export const normalizeEmployeeAppPermission = (row = {}, index = 0) => ({
  permission_id: row.permission_id || `${row.company_id || "company"}_${row.role_name || "الموظف"}_${row.employee_id || "role"}_${row.module_key || index}`.replace(/\s+/g, "_"),
  company_id: row.company_id || "",
  role_name: clean(row.role_name || "الموظف"),
  employee_id: clean(row.employee_id || ""),
  module_key: clean(row.module_key),
  can_view: bool(row.can_view, false),
  can_create: bool(row.can_create, false),
  can_upload: bool(row.can_upload, false),
  can_cancel: bool(row.can_cancel, false),
  can_approve: bool(row.can_approve, false),
  notes: row.notes || "",
  updated_at: new Date().toISOString(),
});

export const normalizeEmployeeRequestType = (row = {}) => ({
  request_type_id: row.request_type_id || `${row.company_id || "company"}_${row.request_key || Date.now()}`.replace(/\s+/g, "_"),
  company_id: row.company_id || "",
  request_key: clean(row.request_key),
  request_label: clean(row.request_label),
  is_enabled: bool(row.is_enabled, true),
  requires_attachment: bool(row.requires_attachment, false),
  requires_date_range: bool(row.requires_date_range, false),
  requires_time_range: bool(row.requires_time_range, false),
  approval_role: row.approval_role || "",
  notes: row.notes || "",
  updated_at: new Date().toISOString(),
});

export const employeeAppAdminService = {
  async loadEmployeeAppSettings(companyId) {
    try {
      const rows = await supabase.select("employee_app_settings", `select=*&company_id=eq.${encodeURIComponent(companyId || "")}&limit=1`);
      return normalizeEmployeeAppSettings(rows?.[0] || { ...defaultEmployeeAppSettings, company_id: companyId });
    } catch (error) {
      console.error("Supabase employee_app_settings load error:", error);
      throw new Error("تعذر تحميل إعدادات تطبيق الموظف: " + error.message);
    }
  },

  async saveEmployeeAppSettings(settings) {
    const payload = normalizeEmployeeAppSettings(settings);
    payload.setting_id = payload.setting_id || `employee_app_settings_${payload.company_id}`;
    const { data, error } = await supabase.from("employee_app_settings").upsert(payload, { onConflict: "setting_id" }).select().single();
    if (error) {
      console.error("Supabase employee_app_settings save error:", error);
      throw new Error("تعذر حفظ إعدادات تطبيق الموظف: " + error.message);
    }
    return normalizeEmployeeAppSettings(data);
  },

  async loadEmployeeAppPermissions(companyId) {
    try {
      const rows = await supabase.select("employee_app_permissions", `select=*&company_id=eq.${encodeURIComponent(companyId || "")}&order=module_key.asc`);
      return (rows || []).map(normalizeEmployeeAppPermission);
    } catch (error) {
      console.error("Supabase employee_app_permissions load error:", error);
      throw new Error("تعذر تحميل صلاحيات بوابة الموظف: " + error.message);
    }
  },

  async saveEmployeeAppPermissions(companyId, rows = []) {
    const payload = rows.map((row, index) => normalizeEmployeeAppPermission({ ...row, company_id: companyId }, index)).filter((row) => row.company_id && row.module_key);
    if (!payload.length) return [];
    const { data, error } = await supabase.from("employee_app_permissions").upsert(payload, { onConflict: "permission_id" }).select();
    if (error) {
      console.error("Supabase employee_app_permissions save error:", error);
      throw new Error("تعذر حفظ صلاحيات بوابة الموظف: " + error.message);
    }
    return (data || []).map(normalizeEmployeeAppPermission);
  },

  loadAttendanceLocations(companyId) {
    return attendanceGeoService.loadAttendanceLocations(companyId);
  },
  saveAttendanceLocation(payload) {
    return attendanceGeoService.saveAttendanceLocation(payload);
  },
  async deleteOrDisableAttendanceLocation(companyId, locationId) {
    try {
      await supabase.request(`/rest/v1/attendance_locations?company_id=eq.${encodeURIComponent(companyId || "")}&location_id=eq.${encodeURIComponent(locationId || "")}`, {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() }),
      });
      return true;
    } catch (error) {
      console.error("Supabase attendance_locations disable error:", error);
      throw new Error("تعذر تعطيل موقع الحضور: " + error.message);
    }
  },

  async loadEmployeeDevices(companyId) {
    try {
      return await supabase.select("employee_device_registry", `select=*&company_id=eq.${encodeURIComponent(companyId || "")}&order=updated_at.desc`);
    } catch (error) {
      console.error("Supabase employee_device_registry load error:", error);
      throw new Error("تعذر تحميل أجهزة الموظفين: " + error.message);
    }
  },
  async disableEmployeeDevice(companyId, deviceId) {
    try {
      await supabase.request(`/rest/v1/employee_device_registry?company_id=eq.${encodeURIComponent(companyId || "")}&device_id=eq.${encodeURIComponent(deviceId || "")}`, {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() }),
      });
      return true;
    } catch (error) {
      console.error("Supabase employee_device_registry disable error:", error);
      throw new Error("تعذر تعطيل الجهاز: " + error.message);
    }
  },

  async loadEmployeeRequestTypes(companyId) {
    try {
      const rows = await supabase.select("employee_app_request_types", `select=*&company_id=eq.${encodeURIComponent(companyId || "")}&order=request_label.asc`);
      return (rows || []).map(normalizeEmployeeRequestType);
    } catch (error) {
      console.error("Supabase employee_app_request_types load error:", error);
      throw new Error("تعذر تحميل أنواع الطلبات: " + error.message);
    }
  },
  async saveEmployeeRequestType(payload) {
    const row = normalizeEmployeeRequestType(payload);
    const { data, error } = await supabase.from("employee_app_request_types").upsert(row, { onConflict: "request_type_id" }).select().single();
    if (error) {
      console.error("Supabase employee_app_request_types save error:", error);
      throw new Error("تعذر حفظ نوع الطلب: " + error.message);
    }
    return normalizeEmployeeRequestType(data);
  },

  seedDefaultEmployeeAppPermissions(companyId) {
    const rows = employeePortalPermissionModules.map(([module_key]) => ({
      company_id: companyId,
      role_name: "الموظف",
      employee_id: "",
      module_key,
      can_view: true,
      can_create: ["attendance_checkin", "requests_leave", "requests_permission", "requests_advance", "requests_assistance", "requests_custody", "requests_attendance_correction", "requests_hr_letter"].includes(module_key),
      can_upload: module_key === "documents_upload",
      can_cancel: module_key.startsWith("requests_"),
    }));
    return this.saveEmployeeAppPermissions(companyId, rows);
  },
  async seedDefaultRequestTypes(companyId) {
    const rows = await Promise.all(defaultEmployeeRequestTypes.map(([request_key, request_label]) => this.saveEmployeeRequestType({
      company_id: companyId,
      request_key,
      request_label,
      is_enabled: true,
      requires_attachment: false,
      requires_date_range: ["leave"].includes(request_key),
      requires_time_range: ["permission", "attendance_correction"].includes(request_key),
    })));
    return rows;
  },
};
