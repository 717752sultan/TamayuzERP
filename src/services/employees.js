import { supabase } from "./supabase";

const EMPLOYEE_PHOTOS_BUCKET = "employee-photos";
const SUPPORTED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

const photoExtension = (file = {}) => {
  const byName = String(file.name || "").split(".").pop();
  if (byName && byName !== file.name) return byName.toLowerCase();
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
};

export const normalizeEmployeeForDb = (item = {}) => ({
  id: String(item.id || item.employee_id || item.employeeId || "").trim(),
  name: String(item.name || item.employee_name || item.employeeName || "").trim(),
  branch: String(item.branch || ""),
  job: String(item.job || ""),
  hire_date: item.hire_date || item.hireDate || null,
  salary: Number(item.salary || 0),
  phone: String(item.phone || ""),
  status: String(item.status || "???"),
  manager: String(item.manager || ""),
  gender: String(item.gender || item.sex || "غير محدد"),
  profile_image_url: String(item.profile_image_url || item.profileImageUrl || item.profile_image || item.avatar_url || item.photo_url || "").trim(),
  profile_image_path: String(item.profile_image_path || item.profileImagePath || item.photo_path || "").trim(),
});

const fromDb = (row = {}) => ({
  id: row.id,
  company_id: row.company_id || "",
  name: row.name || "",
  branch: row.branch || "",
  job: row.job || row.job_title || "",
  hireDate: row.hire_date || row.hireDate || "",
  salary: Number(row.salary || 0),
  phone: row.phone || "",
  status: row.status || "???",
  manager: row.manager || row.direct_manager || "",
  gender: row.gender || row.sex || "غير محدد",
  profile_image_url: row.profile_image_url || row.profile_image || row.avatar_url || row.photo_url || "",
  profileImageUrl: row.profile_image_url || row.profile_image || row.avatar_url || row.photo_url || "",
  profile_image_path: row.profile_image_path || row.photo_path || "",
  profileImagePath: row.profile_image_path || row.photo_path || "",
});

const normalizeEmployeeRows = (employeeOrEmployees) =>
  (Array.isArray(employeeOrEmployees) ? employeeOrEmployees : [employeeOrEmployees])
    .map(normalizeEmployeeForDb)
    .filter((row) => row.id && row.name);

export const employeesService = {
  normalizeEmployee: fromDb,

  async uploadEmployeePhoto(file, employee = {}, currentCompanyId = "") {
    if (!file) return null;
    if (!SUPPORTED_PHOTO_TYPES.has(file.type)) throw new Error("نوع الملف غير مدعوم");
    if (file.size > MAX_PHOTO_SIZE) throw new Error("حجم الصورة يجب ألا يتجاوز 2 ميجابايت");

    const { url, anonKey } = supabase.config();
    if (!url || !anonKey) throw new Error("لم يتم إعداد تخزين الصور بعد");

    const employeeId = String(employee.id || employee.employee_id || "").trim();
    const companyId = String(currentCompanyId || employee.company_id || "unknown-company").trim();
    if (!employeeId) throw new Error("رقم الموظف مطلوب قبل رفع الصورة");

    const safeCompanyId = encodeURIComponent(companyId);
    const safeEmployeeId = encodeURIComponent(employeeId.replace(/[^\w.-]/g, "_"));
    const path = `${safeCompanyId}/employees/${safeEmployeeId}_${Date.now()}.${photoExtension(file)}`;
    const uploadUrl = `${url}/storage/v1/object/${EMPLOYEE_PHOTOS_BUCKET}/${path}`;
    const token = localStorage.getItem("ep_supabase_access_token") || anonKey;

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": file.type,
        "x-upsert": "true",
      },
      body: file,
    });

    if (!response.ok) {
      let message = "لم يتم إعداد تخزين الصور بعد";
      try {
        const data = await response.json();
        message = data?.message || data?.error || message;
      } catch {
        // Keep the safe Arabic fallback.
      }
      throw new Error(message);
    }

    return {
      profile_image_path: path,
      profile_image_url: `${url}/storage/v1/object/public/${EMPLOYEE_PHOTOS_BUCKET}/${path}`,
    };
  },

  async removeEmployeePhoto(path) {
    const cleanPath = String(path || "").trim();
    if (!cleanPath) return;
    const { url, anonKey } = supabase.config();
    if (!url || !anonKey) throw new Error("لم يتم إعداد تخزين الصور بعد");
    const token = localStorage.getItem("ep_supabase_access_token") || anonKey;
    const response = await fetch(`${url}/storage/v1/object/${EMPLOYEE_PHOTOS_BUCKET}`, {
      method: "DELETE",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: [cleanPath] }),
    });
    if (!response.ok) {
      console.error("Supabase employee photo delete error:", await response.text().catch(() => ""));
    }
  },

  async list() {
    try {
      const rows = await supabase.select("employees", "select=*&order=id.asc");
      return (rows || []).map(fromDb);
    } catch (error) {
      console.error("Supabase employees load/save error:", error);
      throw new Error("فشل تحميل بيانات الموظفين من Supabase: " + error.message);
    }
  },

  async upsert(employeeOrEmployees) {
    const rows = normalizeEmployeeRows(employeeOrEmployees);
    if (!rows.length) return [];
    try {
      const { data, error } = await supabase.from("employees").upsert(rows, { onConflict: "id" }).select();
      if (error) throw error;
      return (data || []).map(fromDb);
    } catch (error) {
      console.error("Supabase employees load/save error:", error);
      throw new Error("فشل حفظ بيانات الموظفين في Supabase: " + error.message);
    }
  },

  async remove(id) {
    try {
      return await supabase.remove("employees", id);
    } catch (error) {
      console.error("Supabase employees load/save error:", error);
      throw new Error("فشل حذف بيانات الموظف من Supabase: " + error.message);
    }
  },

  subscribe(onChange) {
    return supabase.subscribeToTable("employees", onChange);
  },
};

export const normalizeEmployee = (row = {}) => fromDb(row);
export const uploadEmployeePhoto = (file, employee, currentCompanyId) =>
  employeesService.uploadEmployeePhoto(file, employee, currentCompanyId);
export const removeEmployeePhoto = (path) => employeesService.removeEmployeePhoto(path);
