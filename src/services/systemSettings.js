import { supabase } from "./supabase";

const requireCompany = (companyId) => {
  const id = String(companyId || "").trim();
  if (!id) throw new Error("لم يتم تحديد الشركة الحالية");
  return id;
};

const defaults = {
  company_display_name: "",
  default_language: "ar",
  default_currency: "YER",
  date_format: "YYYY-MM-DD",
  time_zone: "Asia/Riyadh",
  report_header_title: "",
  report_footer_note: "",
  logo_url: "",
  primary_color: "#7f1d1d",
  secondary_color: "#374151",
  enable_notifications: true,
};

export const systemSettingsService = {
  async loadSystemSettings(companyId) {
    try {
      requireCompany(companyId);
      const rows = await supabase.select("company_settings", `company_id=eq.${encodeURIComponent(companyId)}&select=*`);
      return { ...defaults, ...(rows?.[0]?.settings || {}) };
    } catch (error) {
      console.error("Settings CRUD error:", error);
      throw new Error("تعذر تحميل البيانات: " + error.message);
    }
  },

  async saveSystemSettings(companyId, settings = {}) {
    try {
      const payload = {
        company_id: requireCompany(companyId),
        settings: { ...defaults, ...(settings || {}) },
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("company_settings").upsert(payload, { onConflict: "company_id" }).select().single();
      if (error) throw error;
      return { ...defaults, ...(data?.settings || payload.settings) };
    } catch (error) {
      console.error("Settings CRUD error:", error);
      throw new Error("تعذر حفظ البيانات: " + error.message);
    }
  },
};
