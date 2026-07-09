import { supabase } from "./supabase";

const SETTINGS_ID = "default";

export const settingsService = {
  async get(fallback) {
    const rows = await supabase.select("hrms_settings", `id=eq.${SETTINGS_ID}&select=*`);
    const row = rows?.[0];
    return row?.settings || row?.value || fallback;
  },
  async save(settings) {
    await supabase.upsert("hrms_settings", {
      id: SETTINGS_ID,
      settings,
      updated_at: new Date().toISOString(),
    });
    return settings;
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
