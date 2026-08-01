import { supabase } from "./supabase";

const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const required = (companyId) => { if (!String(companyId || "").trim()) throw new Error("company_id is required."); };
const now = () => new Date().toISOString();

export const defaultAttendanceKpiRules = {
  attendance_weight_percent: 15,
  max_late_minutes_without_penalty: 0,
  late_penalty_per_occurrence: 0,
  late_penalty_per_minute: 0,
  absence_penalty: 0,
  early_leave_penalty: 0,
  approved_leave_neutral_enabled: true,
  unauthorized_absence_exclusion_enabled: false,
  max_absence_days_before_incentive_block: 0,
  max_late_occurrences_before_incentive_reduction: 0,
  overtime_bonus_enabled: false,
  overtime_bonus_points: 0,
  minimum_attendance_score_for_incentive: 0,
};

const rulePayload = (payload = {}) => ({
  rule_id: payload.rule_id || `attendance-rule-${payload.company_id}`,
  company_id: payload.company_id,
  attendance_weight_percent: num(payload.attendance_weight_percent),
  max_late_minutes_without_penalty: num(payload.max_late_minutes_without_penalty),
  late_penalty_per_occurrence: num(payload.late_penalty_per_occurrence),
  late_penalty_per_minute: num(payload.late_penalty_per_minute),
  absence_penalty: num(payload.absence_penalty),
  early_leave_penalty: num(payload.early_leave_penalty),
  approved_leave_neutral_enabled: payload.approved_leave_neutral_enabled !== false,
  unauthorized_absence_exclusion_enabled: payload.unauthorized_absence_exclusion_enabled === true,
  max_absence_days_before_incentive_block: num(payload.max_absence_days_before_incentive_block),
  max_late_occurrences_before_incentive_reduction: num(payload.max_late_occurrences_before_incentive_reduction),
  overtime_bonus_enabled: payload.overtime_bonus_enabled === true,
  overtime_bonus_points: num(payload.overtime_bonus_points),
  minimum_attendance_score_for_incentive: num(payload.minimum_attendance_score_for_incentive),
  updated_at: now(),
});

export const calculateAttendanceScore = (records = [], rules = {}) => {
  const r = { ...defaultAttendanceKpiRules, ...rules };
  const late = records.filter((x) => num(x.late_minutes) > num(r.max_late_minutes_without_penalty));
  const absent = records.filter((x) => x.is_absent && !((x.is_approved_leave || x.status === "إجازة معتمدة") && r.approved_leave_neutral_enabled));
  const early = records.filter((x) => num(x.early_leave_minutes) > 0);
  const overtime = records.reduce((s, x) => s + num(x.overtime_minutes), 0);
  const penalty = late.length * num(r.late_penalty_per_occurrence)
    + late.reduce((s, x) => s + Math.max(0, num(x.late_minutes) - num(r.max_late_minutes_without_penalty)) * num(r.late_penalty_per_minute), 0)
    + absent.length * num(r.absence_penalty)
    + early.length * num(r.early_leave_penalty);
  const bonus = r.overtime_bonus_enabled && overtime > 0 ? num(r.overtime_bonus_points) : 0;
  return Math.max(0, Math.min(100, Number((100 - penalty + bonus).toFixed(2))));
};

const aggregate = (records, rules, month, year) => Object.values(records.reduce((acc, row) => {
  const key = String(row.employee_id || "");
  if (!key) return acc;
  if (!acc[key]) acc[key] = { company_id: row.company_id, period_month: num(month), period_year: num(year), employee_id: key, employee_name: row.employee_name, branch: row.branch, job_title: row.job_title, rows: [] };
  acc[key].rows.push(row);
  return acc;
}, {})).map((group) => ({
  ...group,
  score_id: `attendance-score-${group.company_id}-${year}-${month}-${group.employee_id}`,
  total_work_days: group.rows.length,
  present_days: group.rows.filter((x) => !x.is_absent && !x.is_rest_day).length,
  absent_days: group.rows.filter((x) => x.is_absent && !x.is_approved_leave).length,
  approved_leave_days: group.rows.filter((x) => x.is_approved_leave).length,
  late_occurrences: group.rows.filter((x) => num(x.late_minutes) > 0).length,
  total_late_minutes: group.rows.reduce((s, x) => s + num(x.late_minutes), 0),
  early_leave_occurrences: group.rows.filter((x) => num(x.early_leave_minutes) > 0).length,
  total_early_leave_minutes: group.rows.reduce((s, x) => s + num(x.early_leave_minutes), 0),
  overtime_minutes: group.rows.reduce((s, x) => s + num(x.overtime_minutes), 0),
  attendance_score: calculateAttendanceScore(group.rows, rules),
  max_score: 100,
  calculated_at: now(),
  rows: undefined,
  updated_at: now(),
}));

export const attendanceKpiService = {
  async loadAttendanceKpiRules(companyId) {
    try {
      required(companyId);
      const rows = await supabase.select("performance_attendance_kpi_rules", `select=*&company_id=eq.${encodeURIComponent(companyId)}&limit=1`);
      return rows[0] || null;
    } catch (error) {
      console.error("performance_attendance_kpi_rules load error:", error);
      return null;
    }
  },
  async loadRules(companyId) {
    const row = await this.loadAttendanceKpiRules(companyId);
    return row ? [row] : [];
  },
  async saveAttendanceKpiRules(payload) {
    required(payload.company_id);
    const row = rulePayload({ ...defaultAttendanceKpiRules, ...payload });
    const { data, error } = await supabase.from("performance_attendance_kpi_rules").upsert(row, { onConflict: "rule_id" }).select().single();
    if (error) throw error;
    return data;
  },
  saveRule(payload) {
    return this.saveAttendanceKpiRules(payload);
  },
  calculateAttendanceScore,
  async calculateMonthlyAttendanceScores(companyId, month, year) {
    required(companyId);
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const last = new Date(Number(year), Number(month), 0).getDate();
    const to = `${year}-${String(month).padStart(2, "0")}-${last}`;
    const [rules, records] = await Promise.all([
      this.loadAttendanceKpiRules(companyId),
      supabase.select("hr_attendance_daily_records", `select=*&company_id=eq.${encodeURIComponent(companyId)}&attendance_date=gte.${from}&attendance_date=lte.${to}&approval_status=eq.approved`).catch((error) => {
        console.error("hr_attendance_daily_records load error:", error);
        return [];
      }),
    ]);
    if (!rules) throw new Error("لم يتم ضبط قواعد الحضور والانضباط بعد.");
    return aggregate(records, rules, month, year);
  },
  async saveAttendanceScores(companyId, scores) {
    required(companyId);
    const rows = (scores || []).map((x) => ({ ...x, company_id: companyId }));
    return rows.length ? supabase.upsert("performance_attendance_scores", rows, { onConflict: "company_id,period_month,period_year,employee_id" }) : [];
  },
  async loadAttendanceScores(companyId, filters = {}) {
    try {
      required(companyId);
      const params = ["select=*", `company_id=eq.${encodeURIComponent(companyId)}`];
      for (const [key, value] of Object.entries(filters)) if (value !== "" && value != null) params.push(`${key}=eq.${encodeURIComponent(value)}`);
      return await supabase.select("performance_attendance_scores", params.join("&"));
    } catch (error) {
      console.error("performance_attendance_scores load error:", error);
      return [];
    }
  },
  async syncAttendanceScoresToKpi(companyId, month, year) {
    const scores = await this.loadAttendanceScores(companyId, { period_month: month, period_year: year });
    return { synced: scores.length, scores };
  },
};

export const { loadAttendanceKpiRules, saveAttendanceKpiRules, calculateMonthlyAttendanceScores, saveAttendanceScores, loadAttendanceScores, syncAttendanceScoresToKpi } = attendanceKpiService;
