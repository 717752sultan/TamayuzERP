import { supabase } from "./supabase";
import { employeesService } from "./employees";
import { APP_BRAND_NAME } from "../constants/branding";

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}-${Date.now()}`;

export const recruitmentTabs = [
  ["job_postings", "قائمة الوظائف", "recruitment_job_postings"],
  ["applications", "طلبات التوظيف", "recruitment_applications"],
  ["candidate_evaluations", "تقييم المرشحين", "recruitment_candidate_evaluations"],
  ["offer_templates", "خطاب عرض العمل", "recruitment_offer_templates"],
  ["job_offers", "عروض العمل", "recruitment_job_offers"],
  ["contracts", "عقود العمل", "recruitment_contracts"],
  ["manpower_plans", "خطة الاحتياجات الوظيفية", "recruitment_manpower_plans"],
  ["tests", "اختبارات التوظيف", "recruitment_tests"],
  ["probation_employees", "الموظفون تحت التجربة", "recruitment_probation_employees"],
  ["welcome_messages", "رسائل الترحيب", "recruitment_welcome_messages"],
  ["reports", "تقارير التوظيف", "recruitment_reports"],
  ["settings", "إعدادات التوظيف", "recruitment_settings"],
];

const configs = {
  job_postings: { table: "recruitment_job_postings", pk: "job_posting_id", prefix: "JOB", defaults: { job_type: "دوام كامل", status: "مفتوحة", vacancies_count: 1 } },
  applications: { table: "recruitment_applications", pk: "application_id", prefix: "APP", defaults: { status: "جديد", application_source: "مباشر" } },
  candidate_evaluations: { table: "recruitment_candidate_evaluations", pk: "evaluation_id", prefix: "EVAL", defaults: { recommendation: "تحت الانتظار" } },
  offer_templates: { table: "recruitment_offer_templates", pk: "template_id", prefix: "TPL", defaults: { is_active: true, probation_period: "90 يوم" } },
  job_offers: { table: "recruitment_job_offers", pk: "offer_id", prefix: "OFFER", defaults: { status: "مسودة" } },
  contracts: { table: "recruitment_contracts", pk: "contract_id", prefix: "CON", defaults: { status: "مسودة" } },
  manpower_plans: { table: "recruitment_manpower_plans", pk: "manpower_plan_id", prefix: "PLAN", defaults: { priority: "عادي", status: "مسودة" } },
  tests: { table: "recruitment_tests", pk: "test_id", prefix: "TEST", defaults: { test_type: "تحريري", max_score: 100, pass_score: 60, is_active: true } },
  test_results: { table: "recruitment_test_results", pk: "result_id", prefix: "RES", defaults: { passed: false } },
  probation_evaluations: { table: "recruitment_probation_evaluations", pk: "probation_evaluation_id", prefix: "PROB", defaults: { recommendation: "تثبيت" } },
  welcome_messages: { table: "recruitment_welcome_messages", pk: "welcome_message_id", prefix: "WEL", defaults: { status: "مسودة" } },
};

const numericKeys = new Set([
  "vacancies_count", "salary_range_from", "salary_range_to", "experience_years", "expected_salary", "salary",
  "allowances", "appearance_score", "communication_score", "technical_score", "experience_score", "culture_fit_score",
  "honesty_score", "pressure_handling_score", "computer_skills_score", "customer_service_score", "total_score",
  "required_count", "current_count", "shortage_count", "max_score", "pass_score", "score", "discipline_score",
  "performance_score", "learning_score", "behavior_score", "accuracy_score",
]);

const normalize = (type, item = {}) => {
  const cfg = configs[type];
  const row = { ...cfg.defaults, ...item };
  row[cfg.pk] = String(row[cfg.pk] || id(cfg.prefix));
  Object.keys(row).forEach((key) => {
    if (numericKeys.has(key)) row[key] = Number(row[key] || 0);
    else if (row[key] === undefined) row[key] = "";
  });
  row.updated_at = now();
  row.created_at = row.created_at || now();
  if (type === "candidate_evaluations") {
    const keys = ["appearance_score", "communication_score", "technical_score", "experience_score", "culture_fit_score", "honesty_score", "pressure_handling_score", "computer_skills_score", "customer_service_score"];
    row.total_score = Math.round(keys.reduce((sum, key) => sum + Number(row[key] || 0), 0) / keys.length);
  }
  if (type === "manpower_plans") row.shortage_count = Math.max(0, Number(row.required_count || 0) - Number(row.current_count || 0));
  return row;
};

const list = async (type) => {
  const cfg = configs[type];
  try {
    return await supabase.select(cfg.table, `select=*&order=created_at.desc`);
  } catch (error) {
    console.error(`Recruitment ${cfg.table} error:`, error);
    throw new Error("فشل تحميل بيانات التوظيف: " + error.message);
  }
};

const save = async (type, item) => {
  const cfg = configs[type];
  try {
    const payload = normalize(type, item);
    const { data, error } = await supabase.from(cfg.table).upsert(payload, { onConflict: cfg.pk }).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Recruitment ${cfg.table} error:`, error);
    throw new Error("فشل حفظ بيانات التوظيف: " + error.message);
  }
};

const remove = async (type, key) => {
  const cfg = configs[type];
  try {
    await supabase.request(`/rest/v1/${cfg.table}?${cfg.pk}=eq.${encodeURIComponent(key)}`, { method: "DELETE", prefer: "return=minimal" });
  } catch (error) {
    console.error(`Recruitment ${cfg.table} error:`, error);
    throw new Error("فشل حذف بيانات التوظيف: " + error.message);
  }
};

export const generateOfferLetter = (template = {}, application = {}) =>
  String(template.template_body || "الأخ/ {{applicant_name}}\nيسرنا تقديم عرض عمل لوظيفة {{job_title}} في فرع {{branch}} براتب {{salary}} اعتبارًا من {{start_date}}.")
    .replaceAll("{{applicant_name}}", application.applicant_name || template.applicant_name || "")
    .replaceAll("{{job_title}}", application.job_title || template.job_title || "")
    .replaceAll("{{branch}}", application.branch || template.branch || "")
    .replaceAll("{{salary}}", template.salary || application.expected_salary || "")
    .replaceAll("{{start_date}}", template.start_date || "")
    .replaceAll("{{probation_period}}", template.probation_period || "")
    .replaceAll("{{company_name}}", APP_BRAND_NAME);

export const generateWelcomeMessage = (employee = {}) =>
  `الأخ/ ${employee.employee_name || employee.name || ""}\n\nنرحب بك ضمن فريق ${APP_BRAND_NAME}، ونتمنى لك بداية موفقة في وظيفة ${employee.job || ""} بفرع ${employee.branch || ""} اعتبارًا من تاريخ ${employee.start_date || employee.hire_date || ""}.\n\nإدارة الموارد البشرية`;

export const recruitmentService = {
  list,
  save,
  remove,
  subscribe(type, onChange) {
    return supabase.subscribeToTable(configs[type].table, onChange);
  },
  loadJobPostings: () => list("job_postings"),
  saveJobPosting: (row) => save("job_postings", row),
  deleteJobPosting: (key) => remove("job_postings", key),
  loadApplications: () => list("applications"),
  saveApplication: (row) => save("applications", row),
  deleteApplication: (key) => remove("applications", key),
  updateApplicationStatus: (row, status) => save("applications", { ...row, status }),
  loadCandidateEvaluations: () => list("candidate_evaluations"),
  saveCandidateEvaluation: (row) => save("candidate_evaluations", row),
  deleteCandidateEvaluation: (key) => remove("candidate_evaluations", key),
  loadOfferTemplates: () => list("offer_templates"),
  saveOfferTemplate: (row) => save("offer_templates", row),
  generateOfferLetter,
  loadJobOffers: () => list("job_offers"),
  saveJobOffer: (row) => save("job_offers", row),
  convertOfferToContract: (offer) => save("contracts", { offer_id: offer.offer_id, application_id: offer.application_id, applicant_name: offer.applicant_name, employee_name: offer.applicant_name, job_title: offer.job_title, branch: offer.branch, salary: offer.salary, contract_start_date: offer.start_date, probation_period: offer.probation_period, status: "مسودة" }),
  loadRecruitmentContracts: () => list("contracts"),
  saveRecruitmentContract: (row) => save("contracts", row),
  async convertContractToEmployee(contract) {
    return employeesService.upsert([{
      id: contract.employee_id || `EMP-${Date.now()}`,
      name: contract.employee_name || contract.applicant_name,
      branch: contract.branch,
      job: contract.job_title,
      hire_date: contract.contract_start_date,
      salary: contract.salary,
      phone: contract.phone || "",
      status: "تحت التجربة",
      manager: contract.manager || "",
    }]);
  },
  loadManpowerPlans: () => list("manpower_plans"),
  saveManpowerPlan: (row) => save("manpower_plans", row),
  approveManpowerPlan: (row, approved_by = "") => save("manpower_plans", { ...row, status: "معتمدة", approved_by }),
  convertPlanToJobPosting: (plan) => save("job_postings", { job_title: plan.job_title, department: plan.department, branch: plan.branch, vacancies_count: plan.shortage_count || plan.required_count, status: "مفتوحة", notes: plan.reason }),
  loadRecruitmentTests: () => list("tests"),
  saveRecruitmentTest: (row) => save("tests", row),
  loadRecruitmentTestResults: () => list("test_results"),
  saveRecruitmentTestResult: (row) => save("test_results", { ...row, passed: Number(row.score || 0) >= Number(row.pass_score || 60) }),
  async loadProbationEmployees() {
    const rows = await employeesService.list();
    return rows.filter((e) => e.status === "تحت التجربة");
  },
  saveProbationEvaluation: (row) => save("probation_evaluations", row),
  async confirmProbationEmployee(employee) {
    return employeesService.upsert([{ ...employee, status: "نشط" }]);
  },
  async terminateProbationEmployee(employee) {
    return employeesService.upsert([{ ...employee, status: "موقوف" }]);
  },
  loadWelcomeMessages: () => list("welcome_messages"),
  saveWelcomeMessage: (row) => save("welcome_messages", row),
  generateWelcomeMessage,
};
