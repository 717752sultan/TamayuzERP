import { supabase } from "./supabase";

export const scoringTypes = ["يدوي", "تلقائي من العمليات اليومية", "تلقائي من الحضور", "تلقائي من المخزون", "تلقائي من التقييم"];

export const defaultJobKpis = {
  "خدمة عملاء حوالات وارد": ["عدد عمليات صرف الحوالات", "دقة بيانات العميل", "سرعة إنجاز العملية", "نسبة الأخطاء", "الالتزام بإجراءات التحقق", "جودة التعامل مع العميل", "الانضباط", "التعاون مع الفريق"],
  "خدمة عملاء حوالات صادر": ["عدد عمليات إرسال الحوالات", "دقة إدخال بيانات المرسل والمستفيد", "الالتزام بتعليمات الامتثال", "سرعة إغلاق الطلب", "نسبة العمليات المعدلة", "جودة التعامل", "الحضور والانضباط"],
  "خدمة عملاء واتساب": ["عدد الطلبات المنجزة", "سرعة الرد", "دقة تنفيذ الطلب", "نسبة الإغلاق من أول تواصل", "أسلوب التواصل", "التوثيق", "رضا العميل"],
  "كاشير": ["عدد عمليات الصرف والقبض", "دقة النقدية", "عدم وجود عجز أو زيادة", "سرعة الإنجاز", "الالتزام بالتسعيرة", "ضبط العهدة", "التعامل مع العملاء"],
  "مدير فرع": ["تحقيق مستهدف الفرع", "ضبط الانضباط", "متابعة إنتاجية الموظفين", "حل مشاكل العملاء", "تقليل الأخطاء", "رفع التقارير في وقتها", "إدارة النقدية والعهد"],
  "الموارد البشرية": ["ضبط الحضور والانضباط", "إنجاز المعاملات الإدارية", "متابعة التقييمات", "إعداد التقارير", "إدارة العقود والملفات", "تحسين بيئة العمل"],
  "الدعم الفني": ["سرعة الاستجابة للبلاغات", "عدد البلاغات المغلقة", "تقليل تكرار الأعطال", "جودة الحلول", "توثيق البلاغات", "دعم الفروع"],
  "امتثال": ["مراجعة العمليات المشبوهة", "الالتزام بإجراءات KYC", "رفع التقارير الرقابية", "متابعة المخاطر", "توعية الموظفين", "تقليل المخالفات"],
  "مسؤول المخزون": ["دقة أرصدة المخزون", "سرعة تنفيذ سندات الصرف", "تنظيم المستندات", "تنفيذ الجرد", "تقليل الفروقات", "متابعة الأصناف منخفضة المخزون"],
  "عداد نقود": ["كمية النقد المعدود", "دقة العد", "سرعة الإنجاز", "تقليل الأخطاء", "المحافظة على الأجهزة", "الالتزام بالتعليمات"],
  "مراسل": ["سرعة تنفيذ المهام", "دقة التسليم والاستلام", "الالتزام بالمواعيد", "المحافظة على المستندات", "التعاون", "الانضباط"],
};

const templateFromDb = (row = {}) => ({
  template_id: row.template_id,
  job_name: row.job_name || "",
  department: row.department || "",
  description: row.description || "",
  is_active: row.is_active !== false,
});

const criterionFromDb = (row = {}) => ({
  criterion_id: row.criterion_id,
  template_id: row.template_id || "",
  job_name: row.job_name || "",
  criterion_name: row.criterion_name || "",
  criterion_description: row.criterion_description || "",
  weight: Number(row.weight || 0),
  max_score: Number(row.max_score || 100),
  scoring_type: row.scoring_type || "يدوي",
  target_value: Number(row.target_value || 0),
  excellent_threshold: Number(row.excellent_threshold || row.target_value || 0),
  good_threshold: Number(row.good_threshold || 0),
  acceptable_threshold: Number(row.acceptable_threshold || 0),
  weak_threshold: Number(row.weak_threshold || 0),
  data_source: row.data_source || "",
  affects_incentive: row.affects_incentive !== false,
  is_active: row.is_active !== false,
  notes: row.notes || "",
});

export const performanceCriteriaService = {
  async loadJobTemplates() {
    try {
      const rows = await supabase.select("performance_job_templates", "select=*&order=job_name.asc");
      return (rows || []).map(templateFromDb);
    } catch (error) {
      console.error("Performance criteria error:", error);
      throw new Error("فشل تحميل قوالب معايير الأداء: " + error.message);
    }
  },
  async saveJobTemplate(template) {
    try {
      const payload = {
        template_id: template.template_id || `TPL-${Date.now()}`,
        job_name: String(template.job_name || ""),
        department: String(template.department || ""),
        description: String(template.description || ""),
        is_active: template.is_active !== false,
        updated_at: new Date().toISOString(),
      };
      if (!payload.job_name) throw new Error("يجب تحديد الوظيفة");
      const { data, error } = await supabase.from("performance_job_templates").upsert(payload, { onConflict: "template_id" }).select().single();
      if (error) throw error;
      return templateFromDb(data);
    } catch (error) {
      console.error("Performance criteria error:", error);
      throw new Error("فشل حفظ قالب المعايير: " + error.message);
    }
  },
  async deleteJobTemplate(id) {
    return supabase.request(`/rest/v1/performance_job_templates?template_id=eq.${encodeURIComponent(id)}`, { method: "DELETE", prefer: "return=minimal" });
  },
  async loadKpiCriteria(jobName = "") {
    try {
      const query = jobName ? `job_name=eq.${encodeURIComponent(jobName)}&select=*&order=criterion_name.asc` : "select=*&order=job_name.asc";
      const rows = await supabase.select("performance_kpi_criteria", query);
      return (rows || []).map(criterionFromDb);
    } catch (error) {
      console.error("Performance criteria error:", error);
      throw new Error("فشل تحميل معايير الأداء: " + error.message);
    }
  },
  async saveKpiCriterion(criterion) {
    try {
      const payload = {
        criterion_id: criterion.criterion_id || `KPI-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        template_id: criterion.template_id || "",
        job_name: String(criterion.job_name || ""),
        criterion_name: String(criterion.criterion_name || ""),
        criterion_description: String(criterion.criterion_description || ""),
        weight: Number(criterion.weight || 0),
        max_score: Number(criterion.max_score || 100),
        scoring_type: String(criterion.scoring_type || "يدوي"),
        target_value: Number(criterion.target_value || 0),
        excellent_threshold: Number(criterion.excellent_threshold || criterion.target_value || 0),
        good_threshold: Number(criterion.good_threshold || 0),
        acceptable_threshold: Number(criterion.acceptable_threshold || 0),
        weak_threshold: Number(criterion.weak_threshold || 0),
        data_source: String(criterion.data_source || ""),
        affects_incentive: criterion.affects_incentive !== false,
        is_active: criterion.is_active !== false,
        notes: String(criterion.notes || ""),
        updated_at: new Date().toISOString(),
      };
      if (!payload.job_name || !payload.criterion_name) throw new Error("يجب تحديد الوظيفة والمعيار");
      const { data, error } = await supabase.from("performance_kpi_criteria").upsert(payload, { onConflict: "criterion_id" }).select().single();
      if (error) throw error;
      return criterionFromDb(data);
    } catch (error) {
      console.error("Performance criteria error:", error);
      throw new Error("فشل حفظ معيار الأداء: " + error.message);
    }
  },
  async deleteKpiCriterion(id) {
    return supabase.request(`/rest/v1/performance_kpi_criteria?criterion_id=eq.${encodeURIComponent(id)}`, { method: "DELETE", prefer: "return=minimal" });
  },
  validateCriteriaWeights(rows) {
    return rows.reduce((sum, row) => sum + Number(row.weight || 0), 0);
  },
  async seedDefaults() {
    const saved = [];
    for (const [job, names] of Object.entries(defaultJobKpis)) {
      const template = await this.saveJobTemplate({ template_id: `TPL-${job}`, job_name: job, department: "تشغيل", is_active: true });
      const weight = Math.round(100 / names.length);
      for (const [index, name] of names.entries()) {
        saved.push(await this.saveKpiCriterion({ criterion_id: `KPI-${job}-${index}`, template_id: template.template_id, job_name: job, criterion_name: name, weight: index === names.length - 1 ? 100 - weight * (names.length - 1) : weight, scoring_type: "تلقائي من العمليات اليومية", target_value: 100, excellent_threshold: 100, good_threshold: 80, acceptable_threshold: 60 }));
      }
    }
    return saved;
  },
};
