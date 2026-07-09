import { supabase } from "./supabase";

const fromDb = (row) => ({
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

const toDb = (evaluation) => ({
  id: evaluation.id,
  employee_id: evaluation.employeeId,
  month: evaluation.month,
  job: evaluation.job || "",
  scores: evaluation.scores || [],
  criteria_snapshot: evaluation.criteriaSnapshot || null,
  total: Number(evaluation.total || 0),
  final_score: Number(evaluation.total || 0),
  status: evaluation.status,
  notes: evaluation.notes || "",
});

export const evaluationsService = {
  async list() {
    return (await supabase.select("evaluations", "select=*&order=month.desc")).map(fromDb);
  },
  async upsert(evaluationOrEvaluations) {
    const rows = (Array.isArray(evaluationOrEvaluations) ? evaluationOrEvaluations : [evaluationOrEvaluations]).map(toDb);
    return (await supabase.upsert("evaluations", rows)).map(fromDb);
  },
  remove(id) {
    return supabase.remove("evaluations", id);
  },
  subscribe(onChange) {
    return supabase.subscribeToTable("evaluations", onChange);
  },
};
