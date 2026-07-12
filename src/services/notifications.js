import { supabase } from "./supabase";

const fromDb = (row = {}) => ({
  id: row.id,
  user_id: row.user_id || "",
  title: row.title || "",
  message: row.message || "",
  type: row.type || "info",
  is_read: row.is_read === true,
  related_module: row.related_module || "",
  related_record_id: row.related_record_id || "",
  created_at: row.created_at || "",
});

export const notificationsService = {
  async list(userId = "") {
    try {
      const filter = userId ? `user_id=eq.${encodeURIComponent(userId)}&` : "";
      const rows = await supabase.select("notifications", `${filter}select=*&order=created_at.desc`);
      return (rows || []).map(fromDb);
    } catch (error) {
      console.error("Supabase notifications load/save error:", error);
      throw new Error("فشل تحميل الإشعارات من Supabase: " + error.message);
    }
  },
  async create(notification) {
    try {
      const payload = {
        id: notification.id || `NTF-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        user_id: String(notification.user_id || ""),
        title: String(notification.title || ""),
        message: String(notification.message || ""),
        type: String(notification.type || "info"),
        is_read: notification.is_read === true,
        related_module: String(notification.related_module || ""),
        related_record_id: String(notification.related_record_id || ""),
        created_at: notification.created_at || new Date().toISOString(),
      };
      const { data, error } = await supabase.from("notifications").upsert(payload, { onConflict: "id" }).select().single();
      if (error) throw error;
      return fromDb(data);
    } catch (error) {
      console.error("Supabase notifications load/save error:", error);
      throw new Error("فشل حفظ الإشعار في Supabase: " + error.message);
    }
  },
  async markRead(notification) {
    return this.create({ ...notification, is_read: true });
  },
  subscribe(onChange) {
    return supabase.subscribeToTable("notifications", onChange);
  },
};
