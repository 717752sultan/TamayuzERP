import { supabase } from "./supabase";

const required = (companyId) => { if (!String(companyId || "").trim()) throw new Error("company_id is required."); };
const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const now = () => new Date().toISOString();

const payloadForDb = (payload = {}) => ({
  exclusion_id: payload.exclusion_id || `exclusion-${Date.now()}`,
  company_id: payload.company_id,
  period_month: num(payload.period_month || payload.month),
  period_year: num(payload.period_year || payload.year),
  employee_id: String(payload.employee_id || "").trim(),
  employee_name: payload.employee_name || "",
  branch: payload.branch || "",
  job_title: payload.job_title || payload.job || "",
  action_type: payload.action_type || "exclude",
  reduction_percent: num(payload.reduction_percent || payload.percentage),
  deduction_amount: num(payload.deduction_amount || payload.amount),
  adjustment_amount: num(payload.adjustment_amount),
  reason: payload.reason || "",
  approved_by: payload.approved_by || "",
  approval_status: payload.approval_status || "قيد المراجعة",
  notes: payload.notes || "",
  updated_at: now(),
});

export const incentiveControlsService = {
  async loadIncentiveExclusions(companyId, filters = {}) {
    try {
      required(companyId);
      const params = ["select=*", `company_id=eq.${encodeURIComponent(companyId)}`];
      if (filters.period_month || filters.month) params.push(`period_month=eq.${encodeURIComponent(filters.period_month || filters.month)}`);
      if (filters.period_year || filters.year) params.push(`period_year=eq.${encodeURIComponent(filters.period_year || filters.year)}`);
      if (filters.employee_id || filters.employeeId) params.push(`employee_id=eq.${encodeURIComponent(filters.employee_id || filters.employeeId)}`);
      return await supabase.select("performance_incentive_exclusions", `${params.join("&")}&order=updated_at.desc`);
    } catch (error) {
      console.error("performance_incentive_exclusions load error:", error);
      return [];
    }
  },
  loadExclusions(companyId, filters = {}) {
    return this.loadIncentiveExclusions(companyId, filters);
  },
  async saveIncentiveExclusion(payload) {
    required(payload.company_id);
    if (!String(payload.reason || "").trim()) throw new Error("لا يمكن استثناء موظف بدون تحديد السبب.");
    const row = payloadForDb(payload);
    const { data, error } = await supabase.from("performance_incentive_exclusions").upsert(row, { onConflict: "exclusion_id" }).select().single();
    if (error) throw error;
    return data;
  },
  saveExclusion(payload) {
    return this.saveIncentiveExclusion(payload);
  },
  deleteIncentiveExclusion(id, companyId) {
    required(companyId);
    return supabase.request(`/rest/v1/performance_incentive_exclusions?exclusion_id=eq.${encodeURIComponent(id)}&company_id=eq.${encodeURIComponent(companyId)}`, { method: "DELETE", prefer: "return=minimal" });
  },
  deleteExclusion(id, companyId) {
    return this.deleteIncentiveExclusion(id, companyId);
  },
  applyIncentiveExclusions(rows = [], exclusions = []) {
    return rows.map((row) => {
      const exclusion = exclusions.find((item) => String(item.employee_id) === String(row.employee_id) && ["approved", "معتمد"].includes(item.approval_status));
      if (!exclusion) return row;
      let value = Number(row.final_incentive ?? row.suggested_bonus ?? 0);
      if (exclusion.action_type === "exclude") value = 0;
      if (exclusion.action_type === "reduce_percent") value *= Math.max(0, 1 - Number(exclusion.reduction_percent || 0) / 100);
      if (exclusion.action_type === "fixed_deduction") value -= Number(exclusion.deduction_amount || 0);
      if (exclusion.action_type === "manual_adjustment") value += Number(exclusion.adjustment_amount || 0);
      return { ...row, final_incentive: Math.max(0, value), incentive_exclusion: exclusion, audit_note: exclusion.reason };
    });
  },
};

export const { loadIncentiveExclusions, saveIncentiveExclusion, deleteIncentiveExclusion, applyIncentiveExclusions } = incentiveControlsService;
