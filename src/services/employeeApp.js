import { supabase } from "./supabase";
import { normalizeCompany, normalizeTenantUser } from "./tenant";
import { normalizeEmployee } from "./employees";
import { attendanceGeoService, calculateDistanceMeters, getTodayDateOnly, validateEmployeeLocation } from "./attendanceGeo";
import { defaultEmployeeAppSettings, defaultEmployeeRequestTypes } from "./employeeAppAdmin";

export const EMPLOYEE_APP_SESSION_KEY = "tamyuz_employee_app_session";

const clean = (value) => String(value ?? "").trim();
const pad = (value) => String(value).padStart(2, "0");
export const dateOnly = (value = new Date()) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return getTodayDateOnly();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const normalizeRequest = (row = {}) => ({
  request_id: row.request_id || row.id || `REQ-${Date.now()}`,
  company_id: row.company_id || "",
  employee_id: row.employee_id || "",
  request_type: row.request_type || "طلب عام",
  title: row.title || row.request_type || "طلب عام",
  description: row.description || "",
  from_date: row.from_date || null,
  to_date: row.to_date || null,
  from_time: row.from_time || "",
  to_time: row.to_time || "",
  attachment_url: row.attachment_url || "",
  status: row.status || "pending",
  current_approver: row.current_approver || "",
  rejection_reason: row.rejection_reason || "",
  created_at: row.created_at || new Date().toISOString(),
  updated_at: row.updated_at || new Date().toISOString(),
});

const normalizeNotification = (row = {}) => ({
  notification_id: row.notification_id || row.id || "",
  company_id: row.company_id || "",
  employee_id: row.employee_id || "",
  title: row.title || "إشعار",
  body: row.body || row.message || "",
  type: row.type || "general",
  is_read: row.is_read === true,
  created_at: row.created_at || "",
});

export const employeeAppService = {
  saveSession(session) {
    localStorage.setItem(EMPLOYEE_APP_SESSION_KEY, JSON.stringify(session || {}));
  },
  getSession() {
    try {
      return JSON.parse(localStorage.getItem(EMPLOYEE_APP_SESSION_KEY) || "null");
    } catch {
      return null;
    }
  },
  clearSession() {
    localStorage.removeItem(EMPLOYEE_APP_SESSION_KEY);
  },

  async loginEmployee(companyCode, login, password) {
    const normalizedCompanyCode = clean(companyCode).toUpperCase();
    const loginValue = clean(login);
    const passwordValue = clean(password);
    if (!normalizedCompanyCode) throw new Error("كود الشركة مطلوب");
    if (!loginValue) throw new Error("اسم المستخدم أو الرقم الوظيفي مطلوب");
    if (!passwordValue) throw new Error("كلمة المرور مطلوبة");

    const companyRows = await supabase.select("companies", `company_code=eq.${encodeURIComponent(normalizedCompanyCode)}&select=*&limit=1`);
    const company = normalizeCompany(companyRows?.[0] || {});
    if (!company.company_id) throw new Error("الشركة غير موجودة");
    if (!company.is_active) throw new Error("هذه الشركة غير مفعلة");

    const rpcData = await supabase.rpc("verify_app_login", {
      p_company_code: normalizedCompanyCode,
      p_login: loginValue,
      p_password: passwordValue,
    });
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    const payload = row?.user || row?.user_data || row?.data || row;
    if (!payload || payload.success === false || payload.valid === false || payload.authenticated === false) {
      throw new Error(payload?.message || "بيانات الدخول غير صحيحة");
    }
    const user = normalizeTenantUser({ ...payload, company_id: payload.company_id || company.company_id, company_code: normalizedCompanyCode }, company);
    if (!user.employee_id && user.role !== "الموظف") throw new Error("هذا الحساب غير مرتبط برقم موظف");
    const settings = await this.loadEmployeeAppSettings(company.company_id).catch(() => defaultEmployeeAppSettings);
    if (settings.app_enabled === false) throw new Error("تم إيقاف تطبيق الموظف مؤقتًا من قبل الإدارة.");
    if (settings.employee_login_enabled === false) throw new Error("تم إيقاف تسجيل دخول الموظفين مؤقتًا من قبل الإدارة.");
    const permissions = await this.loadEmployeeAppPermissions(company.company_id, user.role, user.employee_id || user.employeeId || user.id).catch(() => []);
    const requestTypes = await this.loadEmployeeRequestTypes(company.company_id).catch(() => []);
    const session = { user, company, settings, permissions, requestTypes, loggedAt: new Date().toISOString() };
    this.saveSession(session);
    return session;
  },

  async loadEmployeeProfile(companyId, employeeId) {
    const rows = await supabase.select("employees", `select=*&company_id=eq.${encodeURIComponent(companyId || "")}&id=eq.${encodeURIComponent(employeeId || "")}&limit=1`);
    return normalizeEmployee(rows?.[0] || {});
  },

  async loadEmployeeHomeSummary(companyId, employeeId) {
    const [profile, status, requests, notifications] = await Promise.all([
      this.loadEmployeeProfile(companyId, employeeId),
      this.getTodayAttendanceStatus(companyId, employeeId).catch(() => ({ events: [] })),
      this.loadEmployeeRequests(companyId, employeeId).catch(() => []),
      this.loadEmployeeNotifications(companyId, employeeId).catch(() => []),
    ]);
    return {
      profile,
      todayAttendance: status,
      pendingRequests: requests.filter((request) => request.status === "pending").length,
      latestNotification: notifications[0] || null,
      leaveBalance: "غير محدد",
    };
  },

  getAllowedAttendanceLocation(companyId, employeeId, branch) {
    return attendanceGeoService.getEmployeeAllowedLocation(companyId, employeeId, branch);
  },
  getAllowedAttendanceLocations(companyId, employeeId, branch) {
    return attendanceGeoService.getEmployeeAllowedLocations(companyId, employeeId, branch);
  },
  calculateDistanceMeters,
  validateGeofence(currentLocation, allowedLocation, options = {}) {
    const result = validateEmployeeLocation(currentLocation, allowedLocation);
    if (result.status === "unavailable" && options.allowWithoutLocation !== true) {
      return { ...result, allowed: false, message: "لم يتم إعداد موقع حضور لهذا الموظف أو الفرع" };
    }
    return result;
  },
  validateGeofenceForEvent(currentLocation, allowedLocations, eventType, options = {}) {
    return attendanceGeoService.validateEmployeeLocationForEvent(currentLocation, allowedLocations, eventType, options);
  },
  saveEmployeeAttendanceEvent(payload) {
    return attendanceGeoService.saveEmployeeAttendanceEvent(payload);
  },
  getTodayAttendanceStatus(companyId, employeeId) {
    return attendanceGeoService.getTodayEmployeeAttendanceStatus(companyId, employeeId);
  },
  loadEmployeeAttendanceHistory(companyId, employeeId, fromDate, toDate) {
    return attendanceGeoService.loadEmployeeAttendanceEvents({ companyId, employeeId, from: fromDate, to: toDate });
  },

  async loadEmployeeRequests(companyId, employeeId) {
    const rows = await supabase.select("employee_requests", `select=*&company_id=eq.${encodeURIComponent(companyId || "")}&employee_id=eq.${encodeURIComponent(employeeId || "")}&order=created_at.desc`);
    return (rows || []).map(normalizeRequest);
  },
  async createEmployeeRequest(payload) {
    const row = normalizeRequest(payload);
    const { data, error } = await supabase.from("employee_requests").upsert(row, { onConflict: "request_id" }).select().single();
    if (error) {
      console.error("Supabase employee_requests save error:", error);
      throw new Error("تعذر حفظ طلب الموظف: " + error.message);
    }
    return normalizeRequest(data);
  },
  async uploadEmployeeRequestAttachment(file, requestId, companyId = "") {
    if (!file) return "";
    const { url, anonKey } = supabase.config();
    const safeName = encodeURIComponent(String(file.name || "attachment").replace(/[^\w.\-ء-ي]/g, "_"));
    const path = `${encodeURIComponent(companyId || "company")}/employee-requests/${encodeURIComponent(requestId)}/${Date.now()}_${safeName}`;
    const response = await fetch(`${url}/storage/v1/object/employee-request-attachments/${path}`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${localStorage.getItem("ep_supabase_access_token") || anonKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: file,
    });
    if (!response.ok) throw new Error("تعذر رفع المرفق، تأكد من إعداد التخزين");
    return `${url}/storage/v1/object/public/employee-request-attachments/${path}`;
  },
  async loadEmployeeNotifications(companyId, employeeId) {
    const query = `select=*&company_id=eq.${encodeURIComponent(companyId || "")}&or=(employee_id.is.null,employee_id.eq.${encodeURIComponent(employeeId || "")})&order=created_at.desc`;
    const rows = await supabase.select("employee_notifications", query);
    return (rows || []).map(normalizeNotification);
  },
  async loadEmployeeAppSettings(companyId) {
    try {
      const rows = await supabase.select("employee_app_settings", `select=*&company_id=eq.${encodeURIComponent(companyId || "")}&limit=1`);
      return { ...defaultEmployeeAppSettings, ...(rows?.[0] || {}) };
    } catch (error) {
      console.error("Supabase employee_app_settings load error:", error);
      return { ...defaultEmployeeAppSettings };
    }
  },
  async saveEmployeeAppSettings(companyId, settings) {
    const payload = {
      setting_id: settings?.setting_id || `employee_app_settings_${companyId || "default"}`,
      company_id: companyId || settings?.company_id || "",
      ...defaultEmployeeAppSettings,
      ...(settings || {}),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("employee_app_settings").upsert(payload, { onConflict: "setting_id" }).select().single();
    if (error) {
      console.error("Supabase employee app settings save error:", error);
      throw new Error("تعذر حفظ إعدادات تطبيق الموظف: " + error.message);
    }
    return data || payload;
  },
  async loadEmployeeAppPermissions(companyId, roleName = "الموظف", employeeId = "") {
    try {
      const rows = await supabase.select("employee_app_permissions", `select=*&company_id=eq.${encodeURIComponent(companyId || "")}&order=employee_id.desc`);
      const relevant = (rows || []).filter((row) => (!row.employee_id && row.role_name === roleName) || row.employee_id === employeeId);
      const byModule = new Map();
      relevant.forEach((row) => byModule.set(row.module_key, { ...(byModule.get(row.module_key) || {}), ...row }));
      return Array.from(byModule.values());
    } catch (error) {
      console.error("Supabase employee_app_permissions load error:", error);
      return [];
    }
  },
  hasPermission(permissions = [], moduleKey, action = "can_view") {
    const row = permissions.find((item) => item.module_key === moduleKey);
    return row ? row[action] === true : true;
  },
  async loadEmployeeRequestTypes(companyId) {
    try {
      const rows = await supabase.select("employee_app_request_types", `select=*&company_id=eq.${encodeURIComponent(companyId || "")}&is_enabled=eq.true&order=request_label.asc`);
      return rows?.length ? rows : defaultEmployeeRequestTypes.map(([request_key, request_label, module_key]) => ({ request_key, request_label, module_key, is_enabled: true }));
    } catch (error) {
      console.error("Supabase employee_app_request_types load error:", error);
      return defaultEmployeeRequestTypes.map(([request_key, request_label, module_key]) => ({ request_key, request_label, module_key, is_enabled: true }));
    }
  },
};
