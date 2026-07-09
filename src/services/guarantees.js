import { supabase } from "./supabase";

const normalizeGuaranteeForDb = (item = {}) => ({
  guarantee_id: String(item.guarantee_id || item.id || `G-${Date.now()}`).trim(),
  employee_id: String(item.employee_id || item.employeeId || "").trim(),
  employee_name: String(item.employee_name || item.employeeName || ""),
  branch: String(item.branch || ""),
  job: String(item.job || ""),
  guarantor_name: String(item.guarantor_name || item.guarantorName || "").trim(),
  guarantor_id_number: String(item.guarantor_id_number || item.guarantorIdNumber || "").trim(),
  guarantor_phone: String(item.guarantor_phone || item.guarantorPhone || ""),
  commercial_shop_name: String(item.commercial_shop_name || item.commercialShopName || ""),
  commercial_shop_location: String(item.commercial_shop_location || item.commercialShopLocation || ""),
  commercial_register_number: String(item.commercial_register_number || item.commercialRegisterNumber || "").trim(),
  guarantee_date: item.guarantee_date || item.guaranteeDate || null,
  guarantee_expiry_date: item.guarantee_expiry_date || item.guaranteeExpiryDate || null,
  guarantee_status: String(item.guarantee_status || item.guaranteeStatus || "سارية"),
  notes: String(item.notes || ""),
  created_at: item.created_at || item.createdAt || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const fromDb = (row = {}) => ({
  guarantee_id: row.guarantee_id,
  employee_id: row.employee_id || "",
  employee_name: row.employee_name || "",
  branch: row.branch || "",
  job: row.job || "",
  guarantor_name: row.guarantor_name || "",
  guarantor_id_number: row.guarantor_id_number || "",
  guarantor_phone: row.guarantor_phone || "",
  commercial_shop_name: row.commercial_shop_name || "",
  commercial_shop_location: row.commercial_shop_location || "",
  commercial_register_number: row.commercial_register_number || "",
  guarantee_date: row.guarantee_date || "",
  guarantee_expiry_date: row.guarantee_expiry_date || "",
  guarantee_status: row.guarantee_status || "سارية",
  notes: row.notes || "",
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

export const guaranteesService = {
  async list() {
    try {
      const rows = await supabase.select("employee_guarantees", "select=*&order=guarantee_date.desc");
      return (rows || []).map(fromDb);
    } catch (error) {
      console.error("Supabase employee_guarantees load/save error:", error);
      throw new Error("فشل تحميل بيانات ضمانات الموظفين من Supabase: " + error.message);
    }
  },
  async upsert(guarantee) {
    try {
      const payload = normalizeGuaranteeForDb(guarantee);
      const { data, error } = await supabase
        .from("employee_guarantees")
        .upsert(payload, { onConflict: "guarantee_id" })
        .select()
        .single();
      if (error) throw error;
      return fromDb(data);
    } catch (error) {
      console.error("Supabase employee_guarantees load/save error:", error);
      throw new Error("فشل حفظ بيانات الضمانة في Supabase: " + error.message);
    }
  },
  async remove(id) {
    try {
      return await supabase.request(`/rest/v1/employee_guarantees?guarantee_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
    } catch (error) {
      console.error("Supabase employee_guarantees load/save error:", error);
      throw new Error("فشل حذف الضمانة من Supabase: " + error.message);
    }
  },
  subscribe(onChange) {
    return supabase.subscribeToTable("employee_guarantees", onChange);
  },
};
