import { supabase } from "./supabase";

const now = () => new Date().toISOString();
const safeId = () => `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const n = (value) => Number(value || 0) || 0;

export const defaultIncentiveProposalContent = {
  intro: "يهدف نظام التقييم والحوافز إلى ربط المكافآت الشهرية بنتائج فعلية قابلة للقياس، بما يضمن العدالة، ورفع الإنتاجية، وتحسين الانضباط، وتقليل الأخطاء، وتعزيز التنافس الإيجابي بين الموظفين والفروع.",
  goals: ["عدالة موحدة وشفافة", "إنتاجية مرتبطة بالنتائج", "جودة وتقليل الأخطاء", "استدامة وتحسين مستمر"],
  incentiveTypes: [
    { name: "حافز الأداء", description: "تحقيق المستهدفات وجودة التنفيذ." },
    { name: "حافز الانضباط", description: "الالتزام بالحضور والسياسات." },
    { name: "حافز التميز", description: "المبادرات والتحسينات المؤثرة." },
  ],
  criteria: [
    { name: "الأداء والإنتاجية", weight: 40, source: "العمليات اليومية المعتمدة" },
    { name: "الجودة وتقليل الأخطاء", weight: 25, source: "المراجعة والتقييم" },
    { name: "الحضور والانضباط", weight: 20, source: "سجل الحضور والغياب" },
    { name: "السلوك والتعاون", weight: 15, source: "تقييم الإدارة والموارد البشرية" },
  ],
  cycleSteps: [
    { step: 1, title: "تحديد المستهدفات واعتمادها" },
    { step: 2, title: "قياس النتائج والتحقق من البيانات" },
    { step: 3, title: "احتساب النقاط ومراجعة الاستحقاق" },
    { step: 4, title: "اعتماد الإدارة وصرف الحوافز" },
  ],
  rules: [
    "اعتماد المستهدفات قبل بداية الفترة.",
    "الاعتماد على بيانات موثقة قابلة للمراجعة.",
    "عدم وجود مخالفة جوهرية خلال فترة الاستحقاق.",
    "مراجعة النتائج من الموارد البشرية والإدارة المعنية.",
    "إتاحة الاعتراض خلال مدة محددة.",
    "مراجعة الأوزان دوريًا وفق أولويات الشركة.",
  ],
  impact: [
    { title: "على الموظفين", before: 60, after: 85, description: "وضوح التوقعات وعدالة التقدير وتعزيز الدافعية." },
    { title: "على الفروع", before: 55, after: 82, description: "رفع التنافس الإيجابي وتبادل الممارسات الأفضل." },
    { title: "على الشركة", before: 65, after: 90, description: "تحسين الإنتاجية والجودة والانضباط وربط التكلفة بعائد فعلي." },
  ],
  example: { incentivePool: 500000, employeePoints: 93, totalEligiblePoints: 1000, calculatedAmount: 46500 },
  recommendation: "توصي الموارد البشرية بتطبيق النظام بصورة تجريبية لمدة ثلاثة أشهر، مع مراجعة النتائج شهريًا وقياس أثره، ثم اعتماد النسخة النهائية بناءً على بيانات التجربة وملاحظات الإدارة.",
  approvals: [
    { role: "المدير العام", name: "", signature: "", date: "" },
    { role: "مدير الموارد البشرية", name: "", signature: "", date: "" },
  ],
};

export const defaultIncentiveProposal = () => ({
  proposal_id: safeId(),
  title: "تصور نظام التقييم والحوافز",
  subtitle: "إطار إداري يحوّل الأداء القابل للقياس إلى استحقاق عادل ومحفز",
  proposal_status: "مسودة",
  approval_status: "غير معتمد",
  is_default: false,
  version_no: 1,
  content: defaultIncentiveProposalContent,
  notes: "",
});

const normalizeContent = (content = {}) => ({
  ...defaultIncentiveProposalContent,
  ...(content || {}),
  goals: Array.isArray(content?.goals) ? content.goals : defaultIncentiveProposalContent.goals,
  incentiveTypes: Array.isArray(content?.incentiveTypes) ? content.incentiveTypes : defaultIncentiveProposalContent.incentiveTypes,
  criteria: Array.isArray(content?.criteria) ? content.criteria : defaultIncentiveProposalContent.criteria,
  cycleSteps: Array.isArray(content?.cycleSteps) ? content.cycleSteps : defaultIncentiveProposalContent.cycleSteps,
  rules: Array.isArray(content?.rules) ? content.rules : defaultIncentiveProposalContent.rules,
  impact: Array.isArray(content?.impact) ? content.impact : defaultIncentiveProposalContent.impact,
  example: { ...defaultIncentiveProposalContent.example, ...(content?.example || {}) },
  approvals: Array.isArray(content?.approvals) ? content.approvals : defaultIncentiveProposalContent.approvals,
});

export const normalizeIncentiveProposal = (row = {}) => ({
  proposal_id: row.proposal_id || safeId(),
  company_id: row.company_id || "",
  title: row.title || "تصور نظام التقييم والحوافز",
  subtitle: row.subtitle || "",
  proposal_status: row.proposal_status || "مسودة",
  approval_status: row.approval_status || "غير معتمد",
  is_default: row.is_default === true,
  version_no: Number(row.version_no || 1),
  content: normalizeContent(row.content),
  created_by: row.created_by || "",
  updated_by: row.updated_by || "",
  approved_by: row.approved_by || "",
  approved_at: row.approved_at || null,
  notes: row.notes || "",
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

const payloadForDb = (companyId, payload = {}) => {
  const content = normalizeContent(payload.content);
  const total = n(content.example.totalEligiblePoints);
  content.example.calculatedAmount = total ? Number(((n(content.example.incentivePool) * n(content.example.employeePoints)) / total).toFixed(2)) : 0;
  return {
    proposal_id: payload.proposal_id || safeId(),
    company_id: companyId,
    title: payload.title || "تصور نظام التقييم والحوافز",
    subtitle: payload.subtitle || "",
    proposal_status: payload.proposal_status || "مسودة",
    approval_status: payload.approval_status || "غير معتمد",
    is_default: payload.is_default === true,
    version_no: Number(payload.version_no || 1),
    content,
    created_by: payload.created_by || "",
    updated_by: payload.updated_by || "",
    approved_by: payload.approved_by || "",
    approved_at: payload.approved_at || null,
    notes: payload.notes || "",
    updated_at: now(),
  };
};

export const incentiveProposalsService = {
  async listIncentiveProposals(companyId) {
    try {
      if (!companyId) return [];
      const rows = await supabase.select("performance_incentive_proposals", `select=*&company_id=eq.${encodeURIComponent(companyId)}&order=updated_at.desc`);
      return (rows || []).map(normalizeIncentiveProposal);
    } catch (error) {
      console.error("performance_incentive_proposals list error:", error);
      return [];
    }
  },
  async getDefaultIncentiveProposal(companyId) {
    try {
      if (!companyId) return null;
      const rows = await supabase.select("performance_incentive_proposals", `select=*&company_id=eq.${encodeURIComponent(companyId)}&is_default=eq.true&limit=1`);
      return rows?.[0] ? normalizeIncentiveProposal(rows[0]) : null;
    } catch (error) {
      console.error("performance_incentive_proposals default error:", error);
      return null;
    }
  },
  async createIncentiveProposal(companyId, payload = {}) {
    const row = { ...payloadForDb(companyId, payload), created_at: now() };
    const { data, error } = await supabase.from("performance_incentive_proposals").upsert(row, { onConflict: "proposal_id" }).select().single();
    if (error) throw error;
    return normalizeIncentiveProposal(data);
  },
  async updateIncentiveProposal(companyId, proposalId, payload = {}) {
    return this.createIncentiveProposal(companyId, { ...payload, proposal_id: proposalId });
  },
  async deleteIncentiveProposal(companyId, proposalId) {
    try {
      await supabase.request(`/rest/v1/performance_incentive_proposals?proposal_id=eq.${encodeURIComponent(proposalId)}&company_id=eq.${encodeURIComponent(companyId)}`, { method: "DELETE", prefer: "return=minimal" });
      return true;
    } catch (error) {
      console.error("performance_incentive_proposals delete error:", error);
      throw error;
    }
  },
  async duplicateIncentiveProposal(companyId, proposalId) {
    const rows = await this.listIncentiveProposals(companyId);
    const source = rows.find((row) => row.proposal_id === proposalId);
    if (!source) throw new Error("لم يتم العثور على التصور المطلوب نسخه.");
    return this.createIncentiveProposal(companyId, {
      ...source,
      proposal_id: safeId(),
      title: `${source.title} - نسخة`,
      is_default: false,
      version_no: Number(source.version_no || 1) + 1,
    });
  },
  async setDefaultIncentiveProposal(companyId, proposalId) {
    const rows = await this.listIncentiveProposals(companyId);
    for (const row of rows) await this.updateIncentiveProposal(companyId, row.proposal_id, { ...row, is_default: row.proposal_id === proposalId });
    return true;
  },
};
