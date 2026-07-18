import { supabase } from "./supabase";

const requireCompany = (companyId) => {
  const id = String(companyId || "").trim();
  if (!id) throw new Error("لم يتم تحديد الشركة الحالية");
  return id;
};

const branchFromDb = (row = {}) => ({
  id: row.id || row.branch_id || row.branch_code || "",
  company_id: row.company_id || "",
  branch_code: row.branch_code || row.code || "",
  branch_name: row.branch_name || row.name || "",
  branch_type: row.branch_type || "فرع",
  manager_name: row.manager_name || row.manager || "",
  phone: row.phone || "",
  address: row.address || "",
  city: row.city || "",
  status: row.status || (row.is_active === false ? "معطل" : "نشط"),
  is_active: row.is_active !== false,
  notes: row.notes || "",
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

const branchToDb = (companyId, branch = {}) => ({
  id: branch.id || undefined,
  company_id: requireCompany(companyId),
  branch_code: String(branch.branch_code || branch.code || "").trim(),
  branch_name: String(branch.branch_name || branch.name || "").trim(),
  branch_type: String(branch.branch_type || "فرع").trim(),
  manager_name: String(branch.manager_name || branch.manager || "").trim(),
  phone: String(branch.phone || "").trim(),
  address: String(branch.address || "").trim(),
  city: String(branch.city || "").trim(),
  status: branch.status || (branch.is_active === false ? "معطل" : "نشط"),
  is_active: branch.is_active !== false,
  notes: String(branch.notes || ""),
  updated_at: new Date().toISOString(),
});

const assertBranch = (payload) => {
  if (!payload.branch_code) throw new Error("كود الفرع مطلوب");
  if (!payload.branch_name) throw new Error("اسم الفرع مطلوب");
};

export const settingsBranchesService = {
  async loadBranches(companyId) {
    try {
      requireCompany(companyId);
      const rows = await supabase.select("branches", `company_id=eq.${encodeURIComponent(companyId)}&select=*&order=branch_name.asc`);
      return (rows || []).map(branchFromDb);
    } catch (error) {
      console.error("Settings CRUD error:", error);
      throw new Error("تعذر تحميل الفروع: " + error.message);
    }
  },

  async saveBranch(companyId, branch) {
    try {
      const payload = branchToDb(companyId, branch);
      assertBranch(payload);
      if (!payload.id) delete payload.id;
      const { data, error } = await supabase.from("branches").upsert(payload, { onConflict: "company_id,branch_code" }).select().single();
      if (error) throw error;
      return branchFromDb(data);
    } catch (error) {
      console.error("Settings CRUD error:", error);
      if (String(error.message || "").toLowerCase().includes("duplicate")) throw new Error("لا يمكن تكرار كود الفرع داخل نفس الشركة");
      throw new Error("تعذر حفظ الفرع: " + error.message);
    }
  },

  async createBranch(companyId, branch) {
    return this.saveBranch(companyId, branch);
  },

  async updateBranch(companyId, branchId, branch) {
    return this.saveBranch(companyId, { ...branch, id: branchId || branch.id });
  },

  async toggleBranchStatus(companyId, branchId, isActive, branch = {}) {
    return this.saveBranch(companyId, { ...branch, id: branchId || branch.id, is_active: isActive, status: isActive ? "نشط" : "معطل" });
  },

  async deleteBranch(companyId, branchId, branch = {}) {
    return this.toggleBranchStatus(companyId, branchId, false, branch);
  },
};
