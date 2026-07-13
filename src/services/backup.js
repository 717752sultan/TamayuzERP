import { supabase } from "./supabase";

const stamp = () => {
  const d = new Date();
  return `${d.toISOString().slice(0, 10)}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
};

const tableGroups = {
  full: [
    "employees", "app_users", "app_permissions", "app_permission_nodes", "app_role_node_permissions", "hrms_settings",
    "evaluations", "employees_evaluations", "inventory_items", "inventory_suppliers", "inventory_movements",
    "shift_types", "employee_shift_assignments", "daily_operations",
    "recruitment_job_postings", "recruitment_applications", "recruitment_candidate_evaluations", "recruitment_offer_templates",
    "recruitment_job_offers", "recruitment_contracts", "recruitment_manpower_plans", "recruitment_tests",
    "recruitment_test_results", "recruitment_probation_evaluations", "recruitment_welcome_messages",
  ],
  settings: ["hrms_settings", "app_permission_nodes", "app_role_node_permissions", "app_roles"],
  employees: ["employees", "app_users"],
  inventory: ["inventory_items", "inventory_suppliers", "inventory_movements"],
  recruitment: ["recruitment_job_postings", "recruitment_applications", "recruitment_candidate_evaluations", "recruitment_offer_templates", "recruitment_job_offers", "recruitment_contracts", "recruitment_manpower_plans", "recruitment_tests", "recruitment_test_results", "recruitment_probation_evaluations", "recruitment_welcome_messages"],
};

const downloadJson = (payload, fileName) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const backupService = {
  async createBackup({ type = "full", createdBy = "", notes = "", download = true } = {}) {
    const tables = tableGroups[type] || tableGroups.full;
    const payload = { version: 1, type, exported_at: new Date().toISOString(), tables: {} };
    for (const table of tables) {
      try {
        payload.tables[table] = await supabase.select(table, "select=*");
      } catch (error) {
        payload.tables[table] = { error: error.message };
      }
    }
    const fileName = `puremoney_backup_${stamp()}.json`;
    const row = {
      backup_id: `BKP-${Date.now()}`,
      backup_type: type,
      file_name: fileName,
      file_url: "",
      backup_payload: payload,
      sent_to_email: "",
      created_by: createdBy,
      created_at: new Date().toISOString(),
      status: "جاهزة",
      notes,
    };
    const { data, error } = await supabase.from("system_backups").upsert(row, { onConflict: "backup_id" }).select().single();
    if (error) {
      console.error("Supabase system_backups load/save error:", error);
      throw new Error("فشل حفظ سجل النسخة الاحتياطية: " + error.message);
    }
    if (download) downloadJson(payload, fileName);
    return data;
  },
  async sendBackupToEmail(backupFile) {
    const endpoint = import.meta.env.VITE_BACKUP_EMAIL_ENDPOINT;
    if (!endpoint) {
      return { sent: false, message: "تم إنشاء النسخة الاحتياطية، لكن إرسال البريد يحتاج إعداد خدمة بريد من الخادم." };
    }
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(backupFile) });
    if (!res.ok) throw new Error("فشل إرسال النسخة الاحتياطية إلى البريد.");
    return { sent: true };
  },
};

