import { findPageByArabicName, pageRegistry } from "../constants/pageRegistry";

const number = (value) => Number(value || 0);

const byBranch = (rows = [], scoreKey = "total") => {
  const groups = {};
  rows.forEach((row) => {
    const branch = row.branch || "غير محدد";
    groups[branch] ||= [];
    groups[branch].push(row);
  });
  return Object.entries(groups).map(([branch, list]) => ({
    branch,
    count: list.length,
    average: Math.round(list.reduce((sum, row) => sum + number(row[scoreKey]), 0) / Math.max(list.length, 1)),
  })).sort((a, b) => b.average - a.average);
};

export const buildAssistantBusinessContext = ({
  employees = [],
  evaluations = [],
  settings = {},
  inventoryItems = [],
  guarantees = [],
  filters = {},
  currentUser = {},
  currentCompany = {},
} = {}) => {
  const scopedEmployees = Array.isArray(employees) ? employees : [];
  const scopedEvaluations = Array.isArray(evaluations) ? evaluations : [];
  const branch = filters.branch && filters.branch !== "all" ? filters.branch : currentUser?.branch;
  const visibleEmployees = branch && currentUser?.role && String(currentUser.role).includes("مدير الفرع")
    ? scopedEmployees.filter((employee) => employee.branch === branch)
    : scopedEmployees;
  const visibleEvaluations = branch && currentUser?.role && String(currentUser.role).includes("مدير الفرع")
    ? scopedEvaluations.filter((evaluation) => evaluation.branch === branch)
    : scopedEvaluations;
  const branchStats = byBranch(visibleEvaluations);
  const topEmployees = [...visibleEvaluations].sort((a, b) => number(b.total) - number(a.total)).slice(0, 5);
  const lowEmployees = [...visibleEvaluations].sort((a, b) => number(a.total) - number(b.total)).slice(0, 5);
  const activeGuarantees = guarantees.filter((item) => item.guarantee_status === "سارية").length;
  const expiredGuarantees = guarantees.filter((item) => item.guarantee_status === "منتهية").length;

  return {
    companyName: currentCompany?.company_name || currentUser?.company_name || "الشركة الحالية",
    employeeCount: visibleEmployees.length,
    branchCount: new Set(visibleEmployees.map((employee) => employee.branch).filter(Boolean)).size || (settings.branches || []).length,
    activeEmployees: visibleEmployees.filter((employee) => employee.status === "نشط").length,
    bestBranches: branchStats.slice(0, 3),
    weakestBranches: [...branchStats].reverse().slice(0, 3),
    topEmployees,
    lowEmployees,
    averagePerformance: Math.round(visibleEvaluations.reduce((sum, row) => sum + number(row.total), 0) / Math.max(visibleEvaluations.length, 1)),
    inventoryCount: inventoryItems.length,
    lowStockCount: inventoryItems.filter((item) => number(item.current_balance) <= number(item.reorder_point)).length,
    activeGuarantees,
    expiredGuarantees,
    filters,
  };
};

export const detectUserIntent = (message = "") => {
  const text = String(message).trim();
  const page = findPageByArabicName(text);
  if (/افتح|انتقل|اذهب|اعرض|روح/.test(text) && page) return { type: "navigate", page };
  if (/تقرير|تقارير|أنشئ تقرير|انشئ تقرير/.test(text)) return { type: "report", page, reportType: page?.label || text };
  if (/استراتيجي|استراتيجية|خطة|برنامج|تشغيلية|تدريب|تحسين/.test(text)) return { type: "plan", topic: text };
  if (/خطاب|تعميم|صياغ|إنذار|نقل موظف|ملاحظة/.test(text)) return { type: "letter", topic: text };
  if (/kpi|KPI|مؤشر|معايير/.test(text)) return { type: "kpi", topic: text };
  if (/مخزون|أصناف|شراء/.test(text)) return { type: "inventory", topic: text };
  return { type: "analysis", topic: text };
};

export const generateReport = (reportType = "تقرير إداري", context = {}) => {
  const bestBranch = context.bestBranches?.[0];
  const weakBranch = context.weakestBranches?.[0];
  return [
    `# ${reportType}`,
    "",
    `الشركة: ${context.companyName}`,
    "الفترة: حسب الفلاتر المحددة داخل النظام",
    "",
    "## ملخص تنفيذي",
    `يضم نطاق التقرير ${context.employeeCount || 0} موظفًا و${context.branchCount || 0} فرعًا. متوسط الأداء الحالي ${context.averagePerformance || 0}%.`,
    "",
    "## مؤشرات رئيسية",
    `- الموظفون النشطون: ${context.activeEmployees || 0}`,
    `- أعلى فرع أداءً: ${bestBranch ? `${bestBranch.branch} (${bestBranch.average}%)` : "لا توجد بيانات كافية"}`,
    `- أقل فرع أداءً: ${weakBranch ? `${weakBranch.branch} (${weakBranch.average}%)` : "لا توجد بيانات كافية"}`,
    `- ضمانات نشطة: ${context.activeGuarantees || 0}`,
    `- ضمانات منتهية: ${context.expiredGuarantees || 0}`,
    `- أصناف منخفضة المخزون: ${context.lowStockCount || 0}`,
    "",
    "## جدول مختصر",
    "| البند | القيمة |",
    "|---|---:|",
    `| عدد الموظفين | ${context.employeeCount || 0} |`,
    `| عدد الفروع | ${context.branchCount || 0} |`,
    `| متوسط الأداء | ${context.averagePerformance || 0}% |`,
    "",
    "## التحليل",
    "يوصى بمراجعة الفروع والموظفين الأقل أداءً وربط خطط التحسين بمؤشرات قابلة للقياس.",
    "",
    "## التوصيات",
    "- إعداد خطة متابعة أسبوعية للفروع منخفضة الأداء.",
    "- مراجعة الضمانات المنتهية أو الناقصة.",
    "- ربط الحوافز بنتائج الأداء والانضباط.",
  ].join("\n");
};

export const generateStrategicPlan = (topic = "تطوير الأداء", context = {}) => [
  `# خطة استراتيجية: ${topic}`,
  "",
  "## الهدف الاستراتيجي",
  `رفع كفاءة ${context.companyName || "الشركة"} وتحسين جودة الأداء والالتزام التشغيلي.`,
  "## الوضع الحالي",
  `عدد الموظفين: ${context.employeeCount || 0}، متوسط الأداء: ${context.averagePerformance || 0}%.`,
  "## المشكلة أو الفرصة",
  "وجود فرصة لتحسين الأداء عبر توحيد المؤشرات، التدريب، المتابعة، وربط النتائج بالحوافز.",
  "## المحاور الاستراتيجية",
  "- تطوير مؤشرات KPI عادلة حسب الوظيفة.",
  "- رفع كفاءة الفروع الأقل أداءً.",
  "- تحسين الانضباط والالتزام بالإجراءات.",
  "- تعزيز التدريب والتحفيز.",
  "## المبادرات التنفيذية",
  "- برنامج تدريب شهري حسب نتائج التقييم.",
  "- اجتماعات مراجعة أداء أسبوعية.",
  "- تقارير متابعة للفروع والموظفين.",
  "## المسؤوليات",
  "الموارد البشرية، مدراء الفروع، الإدارة العليا.",
  "## الجدول الزمني",
  "30 يوم للتشخيص، 60 يوم للتنفيذ، 90 يوم للقياس والتحسين.",
  "## مؤشرات النجاح KPI",
  "- ارتفاع متوسط الأداء 10%.",
  "- انخفاض الأخطاء والشكاوى 15%.",
  "- إغلاق 90% من خطط التحسين في موعدها.",
  "## المخاطر",
  "ضعف الالتزام، نقص البيانات، مقاومة التغيير.",
  "## خطة المتابعة",
  "تقرير أسبوعي مختصر وتقرير شهري للإدارة العليا.",
].join("\n");

export const generateAdministrativeLetter = (topic = "تعميم إداري", context = {}) => [
  `# ${topic}`,
  "",
  "السادة/ الموظفون المحترمون،",
  "",
  "تحية طيبة،",
  "",
  `بناءً على متابعة مؤشرات الأداء داخل ${context.companyName || "الشركة"}، نؤكد أهمية الالتزام بالإجراءات المعتمدة ورفع جودة الخدمة والانضباط الوظيفي.`,
  "",
  "يرجى من الجميع التعاون مع مدراء الفروع والموارد البشرية لتنفيذ التوجيهات ومتابعة أي ملاحظات تشغيلية أولاً بأول.",
  "",
  "شاكرين لكم تعاونكم والتزامكم.",
  "",
  "الإدارة",
].join("\n");

export const generateKpiCriteria = (topic = "وظيفة محددة") => [
  `# مؤشرات KPI مقترحة: ${topic}`,
  "",
  "| المؤشر | الوزن | طريقة القياس |",
  "|---|---:|---|",
  "| الإنتاجية | 25% | عدد العمليات أو المهام المنجزة |",
  "| دقة العمل | 20% | الأخطاء والمراجعات |",
  "| خدمة العملاء | 15% | الشكاوى والتقييمات |",
  "| الالتزام بالإجراءات | 15% | الالتزام بسياسات الشركة |",
  "| الانضباط | 15% | الحضور والتأخير |",
  "| التعاون والمبادرة | 10% | تقييم المدير والفريق |",
].join("\n");

export const executeAssistantAction = ({ message, context, canOpenPage, navigateToPage } = {}) => {
  const intent = detectUserIntent(message);
  if (intent.type === "navigate") {
    if (!intent.page) return { type: "message", reply: "لم أتمكن من العثور على هذه الصفحة، اكتب اسم الصفحة بشكل أوضح." };
    if (canOpenPage && !canOpenPage(intent.page.key)) {
      return { type: "message", reply: "لا تملك صلاحية فتح هذه الصفحة." };
    }
    navigateToPage?.(intent.page.key);
    return { type: "navigation", pageKey: intent.page.key, reply: `تم فتح صفحة: ${intent.page.label}` };
  }
  if (intent.type === "report") return { type: "report", reply: generateReport(intent.reportType || "تقرير إداري", context) };
  if (intent.type === "plan") return { type: "plan", reply: generateStrategicPlan(intent.topic, context) };
  if (intent.type === "letter") return { type: "letter", reply: generateAdministrativeLetter(intent.topic, context) };
  if (intent.type === "kpi") return { type: "kpi", reply: generateKpiCriteria(intent.topic) };
  if (intent.type === "inventory") return { type: "analysis", reply: generateReport("تقرير وتحليل المخزون", context) };
  return {
    type: "analysis",
    reply: [
      "أعمل حالياً بوضع التحليل الداخلي. لزيادة قوة المساعد يمكن ربطه بخدمة ذكاء اصطناعي من الخادم.",
      "",
      generateReport("ملخص تشغيلي سريع", context),
      "",
      `يمكنني أيضاً فتح الصفحات التالية: ${pageRegistry.slice(0, 8).map((p) => p.label).join("، ")}.`,
    ].join("\n"),
  };
};
