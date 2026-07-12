import { supabase } from "./supabase";

const fromDb = (row = {}) => ({
  id: row.id,
  user_id: row.user_id || "",
  user_name: row.user_name || "",
  action: row.action || "",
  module_name: row.module_name || "",
  record_id: row.record_id || "",
  old_data: row.old_data || null,
  new_data: row.new_data || null,
  created_at: row.created_at || "",
});

export const auditService = {
  async list() {
    try {
      const rows = await supabase.select("audit_logs", "select=*&order=created_at.desc");
      return (rows || []).map(fromDb);
    } catch (error) {
      console.error("Supabase audit_logs load/save error:", error);
      throw new Error("فشل تحميل سجل العمليات من Supabase: " + error.message);
    }
  },
  async log({ user_id, user_name, action, module_name, record_id, old_data, new_data }) {
    try {
      const payload = {
        id: `AUD-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        user_id: String(user_id || ""),
        user_name: String(user_name || ""),
        action: String(action || ""),
        module_name: String(module_name || ""),
        record_id: String(record_id || ""),
        old_data: old_data || null,
        new_data: new_data || null,
        created_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("audit_logs").upsert(payload, { onConflict: "id" }).select().single();
      if (error) throw error;
      return fromDb(data);
    } catch (error) {
      console.error("Supabase audit_logs load/save error:", error);
      throw new Error("فشل حفظ سجل العملية في Supabase: " + error.message);
    }
  },
  subscribe(onChange) {
    return supabase.subscribeToTable("audit_logs", onChange);
  },
};
