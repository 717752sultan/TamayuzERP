import { supabase } from "./supabase";

export const approvalStatuses = ["مسودة", "قيد المراجعة", "معتمد", "مرفوض", "ملغي"];

const logFromDb = (row = {}) => ({
  id: row.id,
  module_name: row.module_name || "",
  record_id: row.record_id || "",
  action: row.action || "",
  old_status: row.old_status || "",
  new_status: row.new_status || "",
  performed_by: row.performed_by || "",
  performed_at: row.performed_at || "",
  notes: row.notes || "",
});

export const approvalService = {
  async listLogs() {
    try {
      const rows = await supabase.select("approval_logs", "select=*&order=performed_at.desc");
      return (rows || []).map(logFromDb);
    } catch (error) {
      console.error("Supabase approval_logs load/save error:", error);
      throw new Error("فشل تحميل سجل الاعتمادات من Supabase: " + error.message);
    }
  },
  async log({ module_name, record_id, action, old_status, new_status, performed_by, notes }) {
    try {
      const payload = {
        id: `APR-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        module_name,
        record_id,
        action,
        old_status,
        new_status,
        performed_by,
        performed_at: new Date().toISOString(),
        notes: notes || "",
      };
      const { data, error } = await supabase.from("approval_logs").upsert(payload, { onConflict: "id" }).select().single();
      if (error) throw error;
      return logFromDb(data);
    } catch (error) {
      console.error("Supabase approval_logs load/save error:", error);
      throw new Error("فشل حفظ سجل الاعتماد في Supabase: " + error.message);
    }
  },
  subscribe(onChange) {
    return supabase.subscribeToTable("approval_logs", onChange);
  },
};
