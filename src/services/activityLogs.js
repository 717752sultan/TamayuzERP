import { supabase } from "./supabase";
import { getCurrentCompany, getCurrentUser } from "./tenant";

export const activityTypes = [
  "login",
  "logout",
  "view",
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "export",
  "print",
  "password_reset",
  "permission_change",
  "platform_setting_update",
  "employee_status_change",
  "salary_view",
  "financial_view",
  "navigation",
];

export const activitySeverities = ["منخفض", "متوسط", "مرتفع", "حساس"];

const clean = (value) => String(value ?? "").trim();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sensitiveKeyPattern = /(password|secret|token|anon.?key|authorization|salary|wage|payroll_amount)/i;

const sanitizeMetadata = (value, depth = 0) => {
  if (depth > 3 || value == null) return value == null ? null : String(value);
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeMetadata(item, depth + 1));
  if (typeof value !== "object") return typeof value === "string" ? value.slice(0, 500) : value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !sensitiveKeyPattern.test(key))
      .slice(0, 50)
      .map(([key, item]) => [key, sanitizeMetadata(item, depth + 1)]),
  );
};

export const normalizeActivityLog = (row = {}) => ({
  id: row.id || "",
  company_id: row.company_id || "",
  user_id: row.user_id || "",
  username: row.username || "",
  user_name: row.user_name || "",
  user_role: row.user_role || "",
  branch: row.branch || row.metadata?.branch || "",
  module_key: row.module_key || "",
  module_name: row.module_name || "",
  page_key: row.page_key || "",
  page_name: row.page_name || "",
  action_type: row.action_type || "",
  action_label: row.action_label || "",
  description: row.description || "",
  entity_type: row.entity_type || "",
  entity_id: row.entity_id || "",
  severity: row.severity || "منخفض",
  metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
  user_agent: row.user_agent || "",
  created_at: row.created_at || "",
});

const normalizeForDb = (payload = {}) => {
  const currentUser = getCurrentUser() || {};
  const currentCompany = getCurrentCompany() || {};
  const rawUserId = clean(payload.user_id || currentUser.id || currentUser.user_id);
  return {
    company_id: clean(payload.company_id || currentCompany.company_id || currentUser.company_id) || null,
    user_id: uuidPattern.test(rawUserId) ? rawUserId : null,
    username: clean(payload.username || currentUser.username),
    user_name: clean(payload.user_name || currentUser.name || currentUser.username),
    user_role: clean(payload.user_role || currentUser.role),
    module_key: clean(payload.module_key),
    module_name: clean(payload.module_name),
    page_key: clean(payload.page_key),
    page_name: clean(payload.page_name),
    action_type: activityTypes.includes(payload.action_type) ? payload.action_type : "view",
    action_label: clean(payload.action_label),
    description: clean(payload.description).slice(0, 1000),
    entity_type: clean(payload.entity_type),
    entity_id: clean(payload.entity_id),
    severity: activitySeverities.includes(payload.severity) ? payload.severity : "منخفض",
    metadata: sanitizeMetadata(payload.metadata || {}),
    user_agent: clean(payload.user_agent || (typeof navigator !== "undefined" ? navigator.userAgent : "")).slice(0, 500),
  };
};

const queryPart = (key, operator, value) =>
  value ? `${key}=${operator}.${encodeURIComponent(value)}` : "";

export async function loadUserActivityLogs(filters = {}) {
  const currentCompany = getCurrentCompany() || {};
  const companyId = clean(filters.company_id || filters.companyId || currentCompany.company_id);
  const query = [
    queryPart("company_id", "eq", companyId),
    filters.from ? `created_at=gte.${encodeURIComponent(`${filters.from}T00:00:00`)}` : "",
    filters.to ? `created_at=lte.${encodeURIComponent(`${filters.to}T23:59:59.999`)}` : "",
    queryPart("username", "eq", clean(filters.user)),
    queryPart("module_key", "eq", clean(filters.module)),
    queryPart("page_key", "eq", clean(filters.page)),
    queryPart("action_type", "eq", clean(filters.action_type || filters.action)),
    queryPart("severity", "eq", clean(filters.severity)),
    "select=*",
    "order=created_at.desc",
    `limit=${Math.min(Math.max(Number(filters.limit || 500), 1), 2000)}`,
  ].filter(Boolean);
  try {
    const rows = await supabase.select("user_activity_logs", query.join("&"));
    const normalized = (Array.isArray(rows) ? rows : []).map(normalizeActivityLog);
    const search = clean(filters.q).toLowerCase();
    if (!search) return normalized;
    return normalized.filter((row) =>
      [
        row.username,
        row.user_name,
        row.user_role,
        row.module_name,
        row.page_name,
        row.action_label,
        row.description,
        row.entity_type,
        row.entity_id,
      ].some((value) => clean(value).toLowerCase().includes(search)),
    );
  } catch (error) {
    console.error("Supabase user_activity_logs load error:", error);
    throw new Error("تعذر تحميل سجلات المستخدمين: " + error.message);
  }
}

export async function logUserActivity(payload = {}) {
  const row = normalizeForDb(payload);
  if (!row.action_type) return null;
  try {
    const data = await supabase.request("/rest/v1/user_activity_logs", {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify(row),
    });
    return normalizeActivityLog(Array.isArray(data) ? data[0] : data);
  } catch (error) {
    // Logging is deliberately fail-safe so a missing optional audit table never blocks core ERP work.
    console.warn("Supabase user_activity_logs write skipped:", error.message);
    return null;
  }
}

export const activityLogsService = {
  logUserActivity,
  loadUserActivityLogs,
  normalizeActivityLog,
  subscribe(onChange) {
    return supabase.subscribeToTable("user_activity_logs", onChange);
  },
};

// TODO(activity-audit): wire the remaining legacy report export/print buttons to
// logUserActivity as those pages are modularized; never include exported row values.
