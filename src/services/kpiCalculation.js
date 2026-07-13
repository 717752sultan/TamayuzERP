import { supabase } from "./supabase";
import { dailyOperationsService } from "./dailyOperations";
import { performanceCriteriaService } from "./performanceCriteria";

const scoreByThreshold = (actual, criterion) => {
  const max = Number(criterion.max_score || 100);
  if (actual >= Number(criterion.excellent_threshold || criterion.target_value || 0)) return max;
  if (actual >= Number(criterion.good_threshold || 0)) return max * 0.8;
  if (actual >= Number(criterion.acceptable_threshold || 0)) return max * 0.6;
  return Math.max(0, max * 0.4);
};

const scoreFromDb = (row = {}) => ({
  score_id: row.score_id,
  employee_id: row.employee_id || "",
  employee_name: row.employee_name || "",
  job_name: row.job_name || "",
  branch: row.branch || "",
  month: row.month || "",
  criterion_id: row.criterion_id || "",
  criterion_name: row.criterion_name || "",
  actual_value: Number(row.actual_value || 0),
  target_value: Number(row.target_value || 0),
  score: Number(row.score || 0),
  weighted_score: Number(row.weighted_score || 0),
  source_module: row.source_module || "",
  notes: row.notes || "",
});

export const kpiCalculationService = {
  async calculateEmployeeKpiScores(employee, month) {
    try {
      const operations = await dailyOperationsService.loadDailyOperations({ month });
      const employeeOps = operations.filter((op) => op.employee_id === employee.id && op.status === "معتمدة");
      const criteria = await performanceCriteriaService.loadKpiCriteria(employee.job);
      const scores = criteria.filter((c) => c.is_active).map((criterion) => {
        const actual = employeeOps.reduce((sum, op) => {
          if (criterion.criterion_name.includes("خطأ") || criterion.criterion_name.includes("الأخطاء")) return sum + Number(op.error_count || 0);
          if (criterion.criterion_name.includes("شكوى")) return sum + Number(op.customer_complaints || 0);
          if (criterion.criterion_name.includes("منجزة") || criterion.criterion_name.includes("مغلقة")) return sum + Number(op.completed_count || 0);
          return sum + Number(op.operation_count || 0);
        }, 0);
        const score = scoreByThreshold(actual, criterion);
        return {
          score_id: `KS-${employee.id}-${month}-${criterion.criterion_id}`,
          employee_id: employee.id,
          employee_name: employee.name,
          job_name: employee.job,
          branch: employee.branch,
          month,
          criterion_id: criterion.criterion_id,
          criterion_name: criterion.criterion_name,
          actual_value: actual,
          target_value: criterion.target_value,
          score,
          weighted_score: score * Number(criterion.weight || 0) / 100,
          source_module: criterion.scoring_type,
          notes: "",
        };
      });
      return this.saveKpiScores(scores);
    } catch (error) {
      console.error("KPI calculation error:", error);
      throw new Error("فشل حساب مؤشرات الأداء: " + error.message);
    }
  },
  async saveKpiScores(scores) {
    try {
      if (!scores.length) return [];
      const payload = scores.map((row) => ({ ...row, created_at: new Date().toISOString() }));
      const { data, error } = await supabase.from("performance_kpi_scores").upsert(payload, { onConflict: "score_id" }).select();
      if (error) throw error;
      return (data || []).map(scoreFromDb);
    } catch (error) {
      console.error("KPI calculation error:", error);
      throw new Error("فشل حفظ درجات KPI: " + error.message);
    }
  },
  async loadKpiScores(month = "") {
    try {
      const query = month ? `month=eq.${encodeURIComponent(month)}&select=*&order=employee_name.asc` : "select=*&order=month.desc";
      const rows = await supabase.select("performance_kpi_scores", query);
      return (rows || []).map(scoreFromDb);
    } catch (error) {
      console.error("KPI calculation error:", error);
      throw new Error("فشل تحميل درجات KPI: " + error.message);
    }
  },
  async recalculateMonthKpis(employees, month) {
    const all = [];
    for (const employee of employees) {
      const rows = await this.calculateEmployeeKpiScores(employee, month);
      all.push(...rows);
    }
    return all;
  },
};
