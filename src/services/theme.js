import { supabase } from "./supabase";

export const defaultTheme = {
  primary_color: "#8b1e1e",
  secondary_color: "#374151",
  accent_color: "#991b1b",
  sidebar_bg_color: "#111827",
  sidebar_text_color: "#ffffff",
  button_color: "#991b1b",
  button_text_color: "#ffffff",
  card_accent_color: "#fee2e2",
  table_header_color: "#f8fafc",
  report_header_color: "#8b1e1e",
  theme_mode: "light",
  theme_name: "default",
};

export const themePresets = [
  ["أحمر مؤسسي", { primary_color: "#8b1e1e", secondary_color: "#374151", accent_color: "#991b1b", sidebar_bg_color: "#111827", sidebar_text_color: "#ffffff", theme_mode: "light", theme_name: "corporate-red" }],
  ["أزرق إداري", { primary_color: "#0f4c81", secondary_color: "#1f2937", accent_color: "#2563eb", sidebar_bg_color: "#0f172a", sidebar_text_color: "#ffffff", theme_mode: "light", theme_name: "admin-blue" }],
  ["أخضر مالي", { primary_color: "#047857", secondary_color: "#064e3b", accent_color: "#10b981", sidebar_bg_color: "#052e16", sidebar_text_color: "#ffffff", theme_mode: "light", theme_name: "financial-green" }],
  ["بنفسجي احترافي", { primary_color: "#6d28d9", secondary_color: "#312e81", accent_color: "#8b5cf6", sidebar_bg_color: "#1e1b4b", sidebar_text_color: "#ffffff", theme_mode: "light", theme_name: "professional-purple" }],
  ["ذهبي فاخر", { primary_color: "#b45309", secondary_color: "#422006", accent_color: "#f59e0b", sidebar_bg_color: "#1c1917", sidebar_text_color: "#ffffff", theme_mode: "light", theme_name: "luxury-gold" }],
  ["داكن", { primary_color: "#991b1b", secondary_color: "#111827", accent_color: "#ef4444", sidebar_bg_color: "#020617", sidebar_text_color: "#ffffff", theme_mode: "dark", theme_name: "dark" }],
];

export const validateThemeColor = (color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(color || "").trim());

const colorOrDefault = (value, fallback) => validateThemeColor(value) ? String(value).trim() : fallback;

export const normalizeThemePayload = (payload = {}) => ({
  primary_color: colorOrDefault(payload.primary_color, defaultTheme.primary_color),
  secondary_color: colorOrDefault(payload.secondary_color, defaultTheme.secondary_color),
  accent_color: colorOrDefault(payload.accent_color, defaultTheme.accent_color),
  sidebar_bg_color: colorOrDefault(payload.sidebar_bg_color, defaultTheme.sidebar_bg_color),
  sidebar_text_color: colorOrDefault(payload.sidebar_text_color, defaultTheme.sidebar_text_color),
  button_color: colorOrDefault(payload.button_color, payload.primary_color || defaultTheme.button_color),
  button_text_color: colorOrDefault(payload.button_text_color, defaultTheme.button_text_color),
  card_accent_color: colorOrDefault(payload.card_accent_color, defaultTheme.card_accent_color),
  table_header_color: colorOrDefault(payload.table_header_color, defaultTheme.table_header_color),
  report_header_color: colorOrDefault(payload.report_header_color, payload.primary_color || defaultTheme.report_header_color),
  theme_mode: payload.theme_mode === "dark" ? "dark" : "light",
  theme_name: String(payload.theme_name || defaultTheme.theme_name),
});

export const getDefaultTheme = () => ({ ...defaultTheme });

export const getThemeCssVariables = (theme = {}) => {
  const t = normalizeThemePayload(theme);
  return {
    "--company-primary": t.primary_color,
    "--company-secondary": t.secondary_color,
    "--company-accent": t.accent_color,
    "--company-sidebar-bg": t.sidebar_bg_color,
    "--company-sidebar-text": t.sidebar_text_color,
    "--company-button": t.button_color,
    "--company-button-text": t.button_text_color,
    "--company-card-accent": t.card_accent_color,
    "--company-table-header": t.table_header_color,
    "--company-report-header": t.report_header_color,
  };
};

export const applyCompanyTheme = (theme = {}) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  Object.entries(getThemeCssVariables(theme)).forEach(([key, value]) => root.style.setProperty(key, value));
  root.dataset.companyThemeMode = normalizeThemePayload(theme).theme_mode;
};

export const themeService = {
  getDefaultTheme,
  getThemeCssVariables,
  validateThemeColor,
  normalizeThemePayload,
  applyCompanyTheme,

  async loadCompanyTheme(companyId) {
    if (!companyId) return getDefaultTheme();
    try {
      const rows = await supabase.select("companies", `company_id=eq.${encodeURIComponent(companyId)}&select=primary_color,secondary_color,accent_color,sidebar_bg_color,sidebar_text_color,button_color,button_text_color,card_accent_color,table_header_color,report_header_color,theme_mode,theme_name&limit=1`);
      return normalizeThemePayload(rows?.[0] || {});
    } catch (error) {
      console.error("Theme colors error:", error);
      throw new Error("فشل تحميل ألوان الثيم: " + error.message);
    }
  },

  async saveCompanyTheme(companyId, themePayload) {
    if (!companyId) throw new Error("يجب اختيار الشركة أولاً");
    const theme = normalizeThemePayload(themePayload);
    try {
      const data = await supabase.request(`/rest/v1/companies?company_id=eq.${encodeURIComponent(companyId)}&select=primary_color,secondary_color,accent_color,sidebar_bg_color,sidebar_text_color,button_color,button_text_color,card_accent_color,table_header_color,report_header_color,theme_mode,theme_name`, {
        method: "PATCH",
        prefer: "return=representation",
        body: JSON.stringify({ ...theme, updated_at: new Date().toISOString() }),
      });
      return normalizeThemePayload(data?.[0] || theme);
    } catch (error) {
      console.error("Theme colors error:", error);
      throw new Error("فشل حفظ ألوان الثيم: " + error.message);
    }
  },

  async resetCompanyTheme(companyId) {
    return this.saveCompanyTheme(companyId, getDefaultTheme());
  },
};
