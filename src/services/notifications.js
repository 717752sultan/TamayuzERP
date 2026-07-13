import { supabase } from "./supabase";

const fromDb = (row = {}) => ({
  id: row.notification_id || row.id,
  notification_id: row.notification_id || row.id,
  title: row.title || "",
  message: row.message || "",
  type: row.notification_type || row.type || "تنبيه نظام",
  notification_type: row.notification_type || row.type || "تنبيه نظام",
  module_name: row.module_name || row.related_module || "",
  record_id: row.record_id || row.related_record_id || "",
  record_number: row.record_number || "",
  target_role: row.target_role || "",
  target_user_id: row.target_user_id || row.user_id || "",
  branch: row.branch || "",
  priority: row.priority || "عادي",
  is_read: row.is_read === true,
  read_at: row.read_at || null,
  created_by: row.created_by || "",
  created_at: row.created_at || "",
});

const toDb = (notification = {}) => {
  const id = String(notification.notification_id || notification.id || `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`).trim();
  return {
    id,
    notification_id: id,
    title: String(notification.title || ""),
    message: String(notification.message || ""),
    type: String(notification.notification_type || notification.type || "تنبيه نظام"),
    notification_type: String(notification.notification_type || notification.type || "تنبيه نظام"),
    related_module: String(notification.module_name || notification.related_module || ""),
    related_record_id: String(notification.record_id || notification.related_record_id || ""),
    module_name: String(notification.module_name || notification.related_module || ""),
    record_id: String(notification.record_id || notification.related_record_id || ""),
    record_number: String(notification.record_number || ""),
    target_role: String(notification.target_role || ""),
    target_user_id: String(notification.target_user_id || notification.user_id || ""),
    user_id: String(notification.target_user_id || notification.user_id || ""),
    branch: String(notification.branch || ""),
    priority: String(notification.priority || "عادي"),
    is_read: notification.is_read === true,
    read_at: notification.read_at || null,
    created_by: String(notification.created_by || ""),
    created_at: notification.created_at || new Date().toISOString(),
  };
};

export const notificationsService = {
  async list(userId = "", role = "") {
    try {
      const rows = await supabase.select("notifications", "select=*&order=created_at.desc");
      return (rows || []).map(fromDb).filter((n) => !n.target_user_id || n.target_user_id === userId || !n.target_role || n.target_role === role);
    } catch (error) {
      console.error("Notifications module error:", error);
      throw new Error("فشل تحميل الإشعارات من Supabase: " + error.message);
    }
  },
  async create(notification) {
    try {
      const payload = toDb(notification);
      if (!payload.title) throw new Error("عنوان الإشعار مطلوب");
      const { data, error } = await supabase.from("notifications").upsert(payload, { onConflict: "id" }).select().single();
      if (error) throw error;
      return fromDb(data);
    } catch (error) {
      console.error("Notifications module error:", error);
      throw new Error("فشل حفظ الإشعار في Supabase: " + error.message);
    }
  },
  async markNotificationRead(notification) {
    return this.create({ ...notification, is_read: true, read_at: new Date().toISOString() });
  },
  async markRead(notification) {
    return this.markNotificationRead(notification);
  },
  async markAllNotificationsRead(rows = []) {
    const saved = [];
    for (const row of rows.filter((n) => !n.is_read)) saved.push(await this.markNotificationRead(row));
    return saved;
  },
  async deleteNotification(id) {
    try {
      return await supabase.request(`/rest/v1/notifications?notification_id=eq.${encodeURIComponent(id)}`, { method: "DELETE", prefer: "return=minimal" });
    } catch (error) {
      console.error("Notifications module error:", error);
      throw new Error("فشل حذف الإشعار: " + error.message);
    }
  },
  subscribe(onChange) {
    return supabase.subscribeToTable("notifications", onChange);
  },
};
