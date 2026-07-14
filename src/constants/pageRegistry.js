export const pageRegistry = [
  { key: "dashboard", label: "لوحة التحكم", aliases: ["الرئيسية", "الداشبورد", "لوحة القيادة"] },
  { key: "employees", label: "قائمة الموظفين", aliases: ["الموظفين", "الموظفون", "سجل الموظفين", "الموظف"] },
  { key: "evaluations", label: "تقييم أداء الموظفين", aliases: ["التقييم", "تقييم الأداء", "قياس الأداء", "الأداء"] },
  { key: "reports", label: "قسم التقارير", aliases: ["التقارير", "تقرير"] },
  { key: "reports_center", label: "مركز التقارير", aliases: ["مركز التقارير", "تقارير إدارية"] },
  { key: "guarantees", label: "ضمانات الموظفين", aliases: ["الضمانات", "ضمانات", "ضمان الموظفين"] },
  { key: "inventory", label: "إدارة المخزون", aliases: ["المخزون", "الأصناف", "المستودع"] },
  { key: "recruitment", label: "طلبات التوظيف", aliases: ["التوظيف", "المرشحين", "طلبات التوظيف"] },
  { key: "settings", label: "الإعدادات", aliases: ["اعدادات", "إعدادات النظام", "النظام"] },
  { key: "incentives", label: "الحوافز", aliases: ["المكافآت", "الحافز", "حوافز"] },
  { key: "discipline", label: "الانضباط الوظيفي", aliases: ["الحضور", "الانضباط", "الدوام"] },
  { key: "productivity", label: "الإنتاجية", aliases: ["مؤشرات الإنتاجية", "انتاجية"] },
  { key: "plans", label: "خطط تحسين الأداء", aliases: ["خطط التحسين", "خطة تحسين", "PIP"] },
  { key: "top", label: "موظف الشهر", aliases: ["أفضل موظف", "موظف الشهر"] },
  { key: "users_permissions", label: "المستخدمون والصلاحيات", aliases: ["الصلاحيات", "المستخدمين", "الأدوار"] },
  { key: "overtime", label: "العمل الإضافي", aliases: ["الإضافي", "ساعات إضافية"] },
  { key: "shifts", label: "شفتات الموظفين", aliases: ["الشفتات", "الجداول", "جدولة"] },
  { key: "daily_operations", label: "العمليات اليومية", aliases: ["عمليات يومية", "عمليات"] },
  { key: "performance_criteria", label: "معايير الأداء", aliases: ["معايير KPI", "معايير التقييم"] },
  { key: "performance_kpi_scores", label: "درجات KPI", aliases: ["درجات الأداء", "نتائج KPI"] },
  { key: "audit_logs", label: "سجل العمليات", aliases: ["سجل التدقيق", "audit"] },
];

export const findPageByArabicName = (value = "") => {
  const text = String(value).trim().toLowerCase();
  if (!text) return null;
  return pageRegistry.find((page) =>
    [page.label, page.key, ...(page.aliases || [])].some((name) => text.includes(String(name).toLowerCase())),
  ) || null;
};

export const assistantModes = [
  {
    id: "navigation",
    label: "مساعد التنقل",
    prompts: ["افتح صفحة ضمانات الموظفين", "افتح صفحة الموظفين", "انتقل إلى التقارير", "اذهب إلى المخزون"],
  },
  {
    id: "reports",
    label: "مساعد التقارير",
    prompts: ["أنشئ تقرير أداء شهري", "أنشئ تقرير ضمانات الموظفين", "أنشئ تقرير مخزون", "أنشئ تقرير حضور وانضباط"],
  },
  {
    id: "plans",
    label: "مساعد الخطط والاستراتيجيات",
    prompts: ["ابني خطة استراتيجية للموارد البشرية", "ابني خطة تشغيلية لتحسين الفروع", "ابني خطة تدريب شهرية", "ابني برنامج تحسين أداء"],
  },
  {
    id: "hr",
    label: "مساعد الموارد البشرية",
    prompts: ["حلل أداء الموظفين", "اقترح خطة تقليل دوران الموظفين", "اكتب خطة توظيف", "اقترح برنامج تأهيل موظف جديد"],
  },
  {
    id: "performance",
    label: "مساعد تقييم الأداء",
    prompts: ["اقترح مؤشرات KPI لكاشير", "حلل أقل الموظفين أداء", "اكتب ملاحظة تقييم احترافية", "اقترح معايير دعم فني"],
  },
  {
    id: "incentives",
    label: "مساعد الحوافز",
    prompts: ["حلل أهلية الحوافز", "اقترح سياسة مكافآت", "لخص الموظفين المستحقين", "اكتب توصية اعتماد حوافز"],
  },
  {
    id: "inventory",
    label: "مساعد المخزون",
    prompts: ["حلل المخزون", "ما الأصناف التي تحتاج شراء؟", "اقترح خطة تقليل أخطاء المخزون", "أنشئ تقرير مخزون"],
  },
  {
    id: "writing",
    label: "مساعد الصياغة الإدارية",
    prompts: ["صغ تعميم إداري", "صغ خطاب إنذار", "صغ خطاب نقل موظف", "صغ ملاحظة تقييم"],
  },
];
