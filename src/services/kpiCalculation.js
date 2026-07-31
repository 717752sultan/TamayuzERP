import { supabase } from "./supabase";
import { dailyOperationsService, isApprovedDailyOperation } from "./dailyOperations";
import { performanceCriteriaService } from "./performanceCriteria";
import { getCurrentCompanyId } from "./tenant";

const scoreByThreshold = (actual, criterion) => {
  const max = Math.max(0, Math.min(100, Number(criterion.max_score || 100)));
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

const normalizeEmployeeIdValue = (value = "") => String(value || "").trim();

const loadEmployeeIdAliasMap = async (companyId) => {
  if (!companyId) return new Map();
  try {
    const rows = await supabase.select("employee_id_aliases", [
      "select=company_id,alias_employee_id,canonical_employee_id,is_active",
      `company_id=eq.${encodeURIComponent(companyId)}`,
      "is_active=eq.true",
    ].join("&"));
    const aliasToCanonical = new Map();
    (rows || []).forEach((row) => {
      const alias = normalizeEmployeeIdValue(row.alias_employee_id);
      const canonical = normalizeEmployeeIdValue(row.canonical_employee_id);
      if (alias && canonical) aliasToCanonical.set(alias, canonical);
    });
    return aliasToCanonical;
  } catch (error) {
    console.error("KPI calculation employee_id_aliases load error:", error);
    return new Map();
  }
};

export const kpiCalculationService = {
  async calculateEmployeeKpiScores(employee, month, companyId = "") {
    try {
      const cid = companyId || employee.company_id || getCurrentCompanyId();
      if (!cid) throw new Error("لم يتم تحديد الشركة الحالية");
      const aliasToCanonical = await loadEmployeeIdAliasMap(cid);
      const operations = await dailyOperationsService.loadDailyOperations({ companyId: cid, month, approvedOnly: true, includedInKpiOnly: true });
      const employeeOps = operations.filter((op) => {
        const effectiveEmployeeId = aliasToCanonical.get(normalizeEmployeeIdValue(op.employee_id)) || normalizeEmployeeIdValue(op.employee_id);
        return effectiveEmployeeId === normalizeEmployeeIdValue(employee.id) && isApprovedDailyOperation(op);
      });
      const criteria = await performanceCriteriaService.loadKpiCriteria(employee.job);
      const scores = criteria.filter((c) => c.is_active).map((criterion) => {
        const actual = employeeOps.reduce((sum, op) => {
          const criterionName = String(criterion.criterion_name || "");
          if (criterionName.includes("خطأ") || criterionName.includes("الأخطاء")) return sum + Number(op.error_count || 0);
          if (criterionName.includes("شكوى")) return sum + Number(op.customer_complaints || 0);
          if (criterionName.includes("منجزة") || criterionName.includes("مغلقة")) return sum + Number(op.completed_count || 0);
          return sum + Number(op.operation_count || 0);
        }, 0);
        const score = scoreByThreshold(actual, criterion);
        return {
          score_id: `KS-${employee.id}-${month}-${criterion.criterion_id}`,
          company_id: cid,
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
  async loadKpiScores(month = "", companyId = "") {
    try {
      const cid = companyId || getCurrentCompanyId();
      if (!cid) throw new Error("لم يتم تحديد الشركة الحالية");
      const query = [
        "select=*",
        `company_id=eq.${encodeURIComponent(cid)}`,
        ...(month ? [`month=eq.${encodeURIComponent(month)}`] : []),
        `order=${month ? "employee_name.asc" : "month.desc"}`,
      ].join("&");
      const rows = await supabase.select("performance_kpi_scores", query);
      return (rows || []).map(scoreFromDb);
    } catch (error) {
      console.error("KPI calculation error:", error);
      throw new Error("فشل تحميل درجات KPI: " + error.message);
    }
  },
  async recalculateMonthKpis(employees, month, companyId = "") {
    const all = [];
    for (const employee of employees) {
      const rows = await this.calculateEmployeeKpiScores(employee, month, companyId || employee.company_id);
      all.push(...rows);
    }
    return all;
  },
};
