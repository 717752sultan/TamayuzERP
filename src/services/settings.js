import { supabase } from "./supabase";

const SETTINGS_ID = "default";

export const settingsService = {
  async get(fallback) {
    try {
      const rows = await supabase.select("hrms_settings", `id=eq.${SETTINGS_ID}&select=*`);
      const row = rows?.[0];
      return row?.settings || row?.value || fallback;
    } catch (error) {
      console.error("Supabase settings load/save error:", error);
      throw new Error("فشل تحميل إعدادات النظام من Supabase: " + error.message);
    }
  },
  async save(settings) {
    try {
      const payload = {
        id: SETTINGS_ID,
        settings: settings || {},
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("hrms_settings").upsert(payload, { onConflict: "id" }).select().single();
      if (error) throw error;
      return settings;
    } catch (error) {
      console.error("Supabase settings load/save error:", error);
      throw new Error("فشل حفظ إعدادات النظام في Supabase: " + error.message);
    }
  },
  async saveObjections(objections, settings) {
    const next = { ...settings, objections };
    await this.save(next);
    return next;
  },
  subscribe(onChange) {
    return supabase.subscribeToTable("hrms_settings", onChange);
  },
};
