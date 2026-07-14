import { getCurrentCompanyId } from "./tenant";
import { supabase } from "./supabase";

export const guaranteeTableCandidates = ["guarantees", "employee_guarantees"];

const isMissingTableError = (error = {}) => {
  const message = String(error.message || error || "").toLowerCase();
  return (
    message.includes("could not find") ||
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("schema cache") ||
    message.includes("404")
  );
};

const cleanStatus = (value, fallback = "سارية") => String(value || fallback);

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
  guarantee_type: String(item.guarantee_type || item.guaranteeType || "ضمان تجاري"),
  guarantee_date: item.guarantee_date || item.guaranteeDate || null,
  guarantee_expiry_date: item.guarantee_expiry_date || item.guaranteeExpiryDate || null,
  guarantee_status: cleanStatus(item.guarantee_status || item.guaranteeStatus),
  approval_status: cleanStatus(item.approval_status || item.approvalStatus, "مسودة"),
  approved_by: String(item.approved_by || item.approvedBy || ""),
  approved_at: item.approved_at || item.approvedAt || null,
  rejection_reason: String(item.rejection_reason || item.rejectionReason || ""),
  approval_notes: String(item.approval_notes || item.approvalNotes || ""),
  notes: String(item.notes || ""),
  created_at: item.created_at || item.createdAt || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const guaranteeFromDb = (row = {}) => ({
  guarantee_id: row.guarantee_id || row.id || "",
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
  guarantee_type: row.guarantee_type || "ضمان تجاري",
  guarantee_date: row.guarantee_date || "",
  guarantee_expiry_date: row.guarantee_expiry_date || "",
  guarantee_status: row.guarantee_status || "سارية",
  approval_status: row.approval_status || "مسودة",
  approved_by: row.approved_by || "",
  approved_at: row.approved_at || "",
  rejection_reason: row.rejection_reason || "",
  approval_notes: row.approval_notes || "",
  notes: row.notes || "",
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

let activeGuaranteesTable = null;

async function selectFromTable(table) {
  const companyId = getCurrentCompanyId();
  if (!companyId) return [];
  const query = `select=*&company_id=eq.${encodeURIComponent(companyId)}&order=guarantee_date.desc`;
  return supabase.select(table, query);
}

async function resolveTableForWrite() {
  if (activeGuaranteesTable) return activeGuaranteesTable;
  for (const table of guaranteeTableCandidates) {
    try {
      await selectFromTable(table);
      activeGuaranteesTable = table;
      return table;
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }
  return null;
}

export const guaranteesService = {
  get activeTable() {
    return activeGuaranteesTable;
  },
  async list() {
    const companyId = getCurrentCompanyId();
    if (!companyId) return [];

    for (const table of guaranteeTableCandidates) {
      try {
        const rows = await selectFromTable(table);
        activeGuaranteesTable = table;
        return (Array.isArray(rows) ? rows : []).map(guaranteeFromDb);
      } catch (error) {
        console.error("Guarantees load error:", error);
        if (!isMissingTableError(error)) {
          throw new Error("تعذر تحميل ضمانات الموظفين");
        }
      }
    }

    return [];
  },
  async upsert(guarantee) {
    const table = await resolveTableForWrite();
    if (!table) {
      throw new Error("لم يتم ربط بيانات ضمانات الموظفين بقاعدة البيانات بعد");
    }

    const payload = normalizeGuaranteeForDb(guarantee);
    const { data, error } = await supabase
      .from(table)
      .upsert(payload, { onConflict: "guarantee_id" })
      .select()
      .single();

    if (error) {
      console.error("Guarantees save error:", error);
      throw new Error("تعذر حفظ بيانات الضمانة");
    }

    return guaranteeFromDb(data);
  },
  async remove(id) {
    const table = await resolveTableForWrite();
    if (!table) {
      throw new Error("لم يتم ربط بيانات ضمانات الموظفين بقاعدة البيانات بعد");
    }

    try {
      return await supabase.request(`/rest/v1/${table}?guarantee_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
    } catch (error) {
      console.error("Guarantees delete error:", error);
      throw new Error("تعذر حذف الضمانة");
    }
  },
  subscribe(onChange) {
    try {
      const unsubs = guaranteeTableCandidates.map((table) => {
        try {
          return supabase.subscribeToTable(table, onChange);
        } catch (error) {
          console.error("Guarantees realtime error:", error);
          return null;
        }
      });
      return () => unsubs.forEach((unsubscribe) => unsubscribe?.());
    } catch (error) {
      console.error("Guarantees realtime error:", error);
      return () => {};
    }
  },
};
