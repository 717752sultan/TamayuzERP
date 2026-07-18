import { supabase } from "./supabase";

export const hrPageConfigs = {
  hr_home: {
    table: "hr_approval_requests",
    description: "لوحة متابعة مؤشرات الموارد البشرية والطلبات والتنبيهات.",
    tabs: ["نظرة عامة", "طلبات قيد الموافقة", "إجازات الشهر", "إنذارات الشهر", "وظائف شاغرة"],
    fields: [
      ["title", "العنوان", "text"],
      ["request_type", "نوع الطلب", "text"],
      ["requester_name", "مقدم الطلب", "text"],
      ["branch", "الفرع", "text"],
      ["status", "الحالة", "status"],
      ["notes", "ملاحظات", "textarea"],
    ],
  },
  hr_employees_full: {
    table: "employees",
    description: "إدارة سجل الموظفين وملفاتهم الأساسية.",
    tabs: ["جميع الموظفين", "الموظفون النشطون", "تحت التجربة", "الموقوفون", "المنتهية خدماتهم"],
    fields: [["name", "اسم الموظف", "text"], ["branch", "الفرع", "text"], ["job", "الوظيفة", "text"], ["manager", "المدير", "text"], ["phone", "الهاتف", "text"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_reports_full: {
    table: "hr_reports",
    description: "مركز تقارير الموارد البشرية.",
    tabs: ["تقارير الموظفين", "تقارير الحضور", "تقارير الرواتب", "تقارير الأداء", "تقارير الإجازات", "تقارير التدريب"],
    fields: [["title", "اسم التقرير", "text"], ["report_type", "نوع التقرير", "text"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_requests: {
    table: "hr_approval_requests",
    description: "إدارة الطلبات ومسارات الموافقة.",
    tabs: ["طلباتي", "الطلبات الواردة", "الموافقات", "مسارات الاعتماد", "سجل الموافقات"],
    fields: [["request_type", "نوع الطلب", "text"], ["requester_name", "مقدم الطلب", "text"], ["branch", "الفرع", "text"], ["title", "العنوان", "text"], ["description", "الوصف", "textarea"], ["current_approver", "المعتمد الحالي", "text"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_performance_full: {
    table: "evaluations",
    description: "متابعة الأداء والتقييمات ومؤشرات KPI.",
    tabs: ["معايير الأداء", "نماذج تقييم الوظائف", "تقييم الموظفين", "درجات KPI", "خطط تحسين الأداء"],
    fields: [["employee_name", "الموظف", "text"], ["branch", "الفرع", "text"], ["month", "الشهر", "month"], ["total", "النتيجة", "number"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_incentives_full: {
    table: "hr_incentives",
    description: "احتساب واعتماد وصرف الحوافز.",
    tabs: ["إعدادات الحوافز", "شرائح الحوافز", "احتساب الحوافز", "اعتماد الحوافز", "صرف الحوافز", "تقارير الحوافز"],
    fields: [["employee_name", "الموظف", "text"], ["branch", "الفرع", "text"], ["incentive_month", "الشهر", "month"], ["amount", "المبلغ", "number"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_attendance_payroll: {
    table: "hr_attendance_records",
    description: "سجل الحضور والانصراف والتأخير والغياب.",
    tabs: ["سجل الحضور اليومي", "التأخير", "الغياب", "الانصراف المبكر", "استيراد الحضور", "تقارير الحضور"],
    fields: [["employee_name", "الموظف", "text"], ["branch", "الفرع", "text"], ["attendance_date", "التاريخ", "date"], ["check_in", "حضور", "time"], ["check_out", "انصراف", "time"], ["shift_name", "الشفت", "text"], ["late_minutes", "دقائق التأخير", "number"], ["early_leave_minutes", "انصراف مبكر", "number"], ["work_hours", "ساعات العمل", "number"], ["overtime_hours", "الإضافي", "number"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_salary: {
    table: "hr_payroll_runs",
    description: "مسيرات الرواتب والاستحقاقات والخصومات.",
    tabs: ["إعدادات الرواتب", "مكونات الراتب", "الاستحقاقات", "الخصومات", "السلف", "كشف الرواتب الشهري", "قسيمة الراتب"],
    fields: [["employee_name", "الموظف", "text"], ["branch", "الفرع", "text"], ["job", "الوظيفة", "text"], ["salary_month", "الشهر", "month"], ["basic_salary", "الراتب الأساسي", "number"], ["allowances", "البدلات", "number"], ["deductions", "الخصومات", "number"], ["overtime_amount", "الإضافي", "number"], ["bonuses", "المكافآت", "number"], ["penalties", "الجزاءات", "number"], ["advances", "السلف", "number"], ["net_salary", "الصافي", "number"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_disciplinary: {
    table: "hr_violations",
    description: "إدارة المخالفات والإنذارات والجزاءات.",
    tabs: ["المخالفات", "لفت نظر", "الإنذارات", "الجزاءات", "القرارات الإدارية", "التقارير"],
    fields: [["employee_name", "الموظف", "text"], ["branch", "الفرع", "text"], ["violation_type", "نوع المخالفة", "text"], ["violation_date", "التاريخ", "date"], ["description", "الوصف", "textarea"], ["penalty_type", "نوع الجزاء", "text"], ["penalty_amount", "مبلغ الجزاء", "number"], ["decision_no", "رقم القرار", "text"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_recruitment_full: {
    table: "recruitment_job_postings",
    description: "إدارة التوظيف من الاحتياج حتى التعيين.",
    tabs: ["قائمة الوظائف", "طلبات التوظيف", "المرشحون", "تقييم المرشحين", "عروض العمل", "العقود", "تحت التجربة", "رسائل الترحيب", "التقارير"],
    fields: [["job_title", "الوظيفة", "text"], ["branch", "الفرع", "text"], ["department", "القسم", "text"], ["vacancies_count", "عدد الشواغر", "number"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_leaves: {
    table: "hr_leave_requests",
    description: "طلبات وأرصدة وموافقات الإجازات.",
    tabs: ["أنواع الإجازات", "أرصدة الإجازات", "طلبات الإجازات", "موافقات الإجازات", "تقارير الإجازات"],
    fields: [["employee_name", "الموظف", "text"], ["branch", "الفرع", "text"], ["leave_type", "نوع الإجازة", "text"], ["start_date", "من تاريخ", "date"], ["end_date", "إلى تاريخ", "date"], ["days_count", "عدد الأيام", "number"], ["reason", "السبب", "textarea"], ["approved_by", "اعتمد بواسطة", "text"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_complaints: {
    table: "hr_complaints",
    description: "إدارة شكاوى الموظفين والفروع.",
    tabs: ["شكاوى الموظفين", "شكاوى العملاء", "شكاوى الفروع", "قيد المعالجة", "مغلقة", "تقارير الشكاوى"],
    fields: [["complaint_no", "رقم الشكوى", "text"], ["employee_name", "الموظف", "text"], ["branch", "الفرع", "text"], ["complaint_type", "نوع الشكوى", "text"], ["complaint_date", "التاريخ", "date"], ["description", "الوصف", "textarea"], ["resolution", "المعالجة", "textarea"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_circulars: {
    table: "hr_circulars",
    description: "إدارة التعاميم الإدارية ونشرها.",
    tabs: ["كل التعاميم", "تعاميم إدارية", "تعاميم دوام", "تعاميم موارد بشرية", "تعاميم فروع", "أرشيف التعاميم"],
    fields: [["circular_no", "رقم التعميم", "text"], ["title", "العنوان", "text"], ["content", "المحتوى", "textarea"], ["target_branch", "الفرع المستهدف", "text"], ["publish_date", "تاريخ النشر", "date"], ["created_by", "أنشئ بواسطة", "text"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_termination: {
    table: "hr_end_of_service",
    description: "إدارة الاستقالات والمخالصات وإنهاء الخدمة.",
    tabs: ["طلبات إنهاء الخدمة", "الاستقالات", "إنهاء التجربة", "مخالصة نهاية الخدمة", "تسليم العهد", "التقارير"],
    fields: [["employee_name", "الموظف", "text"], ["branch", "الفرع", "text"], ["termination_type", "نوع الإنهاء", "text"], ["last_working_day", "آخر يوم عمل", "date"], ["reason", "السبب", "textarea"], ["settlement_amount", "مبلغ المخالصة", "number"], ["clearance_status", "حالة المخالصة", "text"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_files: {
    table: "hr_employee_documents",
    description: "ملفات ووثائق الموظفين وتنبيهات الانتهاء.",
    tabs: ["الوثائق", "الملفات", "المرفقات", "تنبيهات انتهاء الوثائق"],
    fields: [["employee_id", "رقم الموظف", "text"], ["employee_name", "الموظف", "text"], ["document_type", "نوع الوثيقة", "text"], ["document_number", "رقم الوثيقة", "text"], ["issue_date", "تاريخ الإصدار", "date"], ["expiry_date", "تاريخ الانتهاء", "date"], ["file_url", "رابط الملف", "text"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_contracts: {
    table: "hr_employee_contracts",
    description: "إدارة عقود الموظفين والتنبيهات والتجديدات.",
    tabs: ["العقود", "عقود قاربت على الانتهاء", "عقود منتهية", "قيد التجديد", "تقارير العقود"],
    fields: [["employee_id", "رقم الموظف", "text"], ["employee_name", "الموظف", "text"], ["contract_type", "نوع العقد", "text"], ["start_date", "بداية العقد", "date"], ["end_date", "نهاية العقد", "date"], ["salary", "الراتب", "number"], ["job", "الوظيفة", "text"], ["branch", "الفرع", "text"], ["contract_status", "حالة العقد", "text"], ["renewal_status", "حالة التجديد", "text"], ["file_url", "رابط الملف", "text"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_custodies: {
    table: "hr_employee_custodies",
    description: "تسليم واسترجاع عهد الموظفين.",
    tabs: ["العهد المسلمة", "العهد المسترجعة", "العهد التالفة", "العهد المفقودة", "تقارير العهد"],
    fields: [["custody_no", "رقم العهدة", "text"], ["employee_id", "رقم الموظف", "text"], ["employee_name", "الموظف", "text"], ["branch", "الفرع", "text"], ["item_name", "اسم العهدة", "text"], ["item_code", "كود العهدة", "text"], ["quantity", "الكمية", "number"], ["custody_date", "تاريخ التسليم", "date"], ["return_date", "تاريخ الاسترجاع", "date"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_training: {
    table: "hr_training_programs",
    description: "خطط وبرامج وحضور وتقييم التدريب.",
    tabs: ["البرامج التدريبية", "خطة التدريب", "حضور التدريب", "تقييم التدريب", "تقارير التدريب"],
    fields: [["program_name", "اسم البرنامج", "text"], ["trainer", "المدرب", "text"], ["start_date", "البداية", "date"], ["end_date", "النهاية", "date"], ["target_employees", "المستهدفون", "textarea"], ["evaluation_score", "درجة التقييم", "number"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_approvals: {
    table: "hr_approval_steps",
    description: "سجل الموافقات ومسارات الاعتماد.",
    tabs: ["موافقات الإجازات", "موافقات الحوافز", "موافقات التوظيف", "موافقات الدوام", "كل الموافقات"],
    fields: [["request_title", "الطلب", "text"], ["approver_name", "المعتمد", "text"], ["approval_level", "المستوى", "number"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_financial_setup: {
    table: "hr_payroll_components",
    description: "تهيئة مالية الموارد البشرية: بدلات، خصومات، سلف، ومراكز تكلفة.",
    tabs: ["العملات", "الرواتب", "البدلات", "الخصومات", "السلف", "التأمينات", "مراكز التكلفة"],
    fields: [["component_name", "البند", "text"], ["component_type", "النوع", "text"], ["amount", "المبلغ", "number"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_templates_full: {
    table: "hr_templates",
    description: "قوالب العقود والتعاميم والخطابات والتقارير.",
    tabs: ["قوالب العقود", "قوالب عروض العمل", "قوالب التعاميم", "قوالب الإنذارات", "قوالب خطابات الموارد البشرية", "قوالب التقارير"],
    fields: [["template_name", "اسم القالب", "text"], ["template_type", "نوع القالب", "text"], ["template_body", "النص", "textarea"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
  hr_settings_full: {
    table: "hr_settings",
    description: "إعدادات الموارد البشرية العامة.",
    tabs: ["إعدادات الموظفين", "إعدادات الحضور", "إعدادات الإجازات", "إعدادات الرواتب", "إعدادات التقييم", "إعدادات الحوافز", "إعدادات التنبيهات"],
    fields: [["setting_name", "اسم الإعداد", "text"], ["setting_value", "القيمة", "text"], ["setting_group", "المجموعة", "text"], ["status", "الحالة", "status"], ["notes", "ملاحظات", "textarea"]],
  },
};

const requireCompanyId = (companyId) => {
  const id = String(companyId || "").trim();
  if (!id) throw new Error("لم يتم تحديد الشركة الحالية");
  return id;
};

const recordId = (row = {}) => row.id || row.record_id || row.request_id || row.employee_id || row.created_at || "";

export const hrRecordsService = {
  config(pageKey) {
    return hrPageConfigs[pageKey] || hrPageConfigs.hr_home;
  },

  async load(pageKey, companyId) {
    const config = this.config(pageKey);
    try {
      requireCompanyId(companyId);
      const rows = await supabase.select(config.table, `company_id=eq.${encodeURIComponent(companyId)}&select=*&order=updated_at.desc`);
      return { rows: Array.isArray(rows) ? rows : [], warning: "" };
    } catch (error) {
      console.error("HR module error:", error);
      return {
        rows: [],
        warning: "لم يتم إنشاء جدول هذه الصفحة بعد، يمكن تجهيز الواجهة وحفظها بعد تشغيل الترحيل الآمن.",
        error: error.message,
      };
    }
  },

  async save(pageKey, companyId, record = {}) {
    const config = this.config(pageKey);
    try {
      requireCompanyId(companyId);
      const fields = Object.fromEntries((config.fields || []).map(([key]) => [key, record[key] ?? ""]));
      const payload = {
        ...fields,
        company_id: companyId,
        status: fields.status || record.status || "نشط",
        notes: fields.notes || record.notes || "",
        updated_at: new Date().toISOString(),
      };
      if (record.id) {
        const data = await supabase.request(`/rest/v1/${config.table}?id=eq.${encodeURIComponent(record.id)}&company_id=eq.${encodeURIComponent(companyId)}`, {
          method: "PATCH",
          prefer: "return=representation",
          body: JSON.stringify(payload),
        });
        return Array.isArray(data) ? data[0] : data;
      }
      const data = await supabase.request(`/rest/v1/${config.table}`, {
        method: "POST",
        prefer: "return=representation",
        body: JSON.stringify({ ...payload, created_at: new Date().toISOString() }),
      });
      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      console.error("HR module error:", error);
      throw new Error("تعذر حفظ البيانات: " + error.message);
    }
  },

  async deactivate(pageKey, companyId, record = {}) {
    const config = this.config(pageKey);
    const id = recordId(record);
    try {
      requireCompanyId(companyId);
      if (!id) throw new Error("لا يمكن تحديد السجل");
      const data = await supabase.request(`/rest/v1/${config.table}?id=eq.${encodeURIComponent(id)}&company_id=eq.${encodeURIComponent(companyId)}`, {
        method: "PATCH",
        prefer: "return=representation",
        body: JSON.stringify({ status: "ملغى", updated_at: new Date().toISOString() }),
      });
      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      console.error("HR module error:", error);
      throw new Error("تعذر حفظ البيانات: " + error.message);
    }
  },
};
