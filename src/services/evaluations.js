import { supabase } from "./supabase";

const normalizeEvaluationForDb = (item = {}) => ({
  id: String(item.id || `${item.employee_id || item.employeeId || ""}-${item.month || ""}`).trim(),
  employee_id: String(item.employee_id || item.employeeId || "").trim(),
  month: String(item.month || ""),
  scores: Array.isArray(item.scores) ? item.scores : [],
  total: Number(item.total || item.final_score || 0),
  status: String(item.status || "قيد المراجعة"),
  notes: String(item.notes || ""),
});

const fromDb = (row = {}) => ({
  id: row.id,
  employeeId: row.employee_id || row.employeeId,
  month: row.month,
  job: row.job || "",
  scores: row.scores || [],
  criteriaSnapshot: row.criteria_snapshot || row.criteriaSnapshot || null,
  total: Number(row.total || row.final_score || 0),
  status: row.status || "قيد المراجعة",
  notes: row.notes || "",
});

const normalizeEvaluationRows = (evaluationOrEvaluations) =>
  (Array.isArray(evaluationOrEvaluations) ? evaluationOrEvaluations : [evaluationOrEvaluations])
    .map(normalizeEvaluationForDb)
    .filter((row) => row.id && row.employee_id && row.month);

export const evaluationsService = {
  async list() {
    try {
      const rows = await supabase.select("evaluations", "select=*&order=month.desc");
      return (rows || []).map(fromDb);
    } catch (error) {
      console.error("Supabase evaluations load/save error:", error);
      throw new Error("فشل تحميل بيانات التقييمات من Supabase: " + error.message);
    }
  },
  async upsert(evaluationOrEvaluations) {
    const rows = normalizeEvaluationRows(evaluationOrEvaluations);
    if (!rows.length) return [];
    try {
      const { data, error } = await supabase.from("evaluations").upsert(rows, { onConflict: "id" }).select();
      if (error) throw error;
      return (data || []).map(fromDb);
    } catch (error) {
      console.error("Supabase evaluations load/save error:", error);
      throw new Error("فشل حفظ بيانات التقييمات في Supabase: " + error.message);
    }
  },
  async remove(id) {
    try {
      return await supabase.remove("evaluations", id);
    } catch (error) {
      console.error("Supabase evaluations load/save error:", error);
      throw new Error("فشل حذف بيانات التقييم من Supabase: " + error.message);
    }
  },
  subscribe(onChange) {
    return supabase.subscribeToTable("evaluations", onChange);
  },
};
