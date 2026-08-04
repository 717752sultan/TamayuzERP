import { supabase } from "./supabase";

const uuid = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const templateDefaults = [
  {
    template_id: "template_experience_certificate",
    template_type: "شهادة خبرة",
    template_name: "شهادة خبرة",
    subject: "الموضوع: شهادة خبرة",
    body: "السلام عليكم ورحمة الله وبركاته، وبعد:\n\nإشارة إلى الموضوع أعلاه، تفيد شركة {{company_name}} بأن الموظف/ {{employee_name}}، الرقم الوظيفي/ {{employee_id}}، قد عمل لدى الشركة بوظيفة {{job_title}} في فرع/إدارة {{branch}}، وذلك خلال الفترة من {{hire_date}} وحتى تاريخ إصدار هذه الشهادة.\n\nوقد كان خلال فترة عمله حسن السيرة والسلوك، وقام بأداء الأعمال والمهام الموكلة إليه وفقاً لمتطلبات العمل.\n\nوقد أعطيت له هذه الشهادة بناءً على طلبه دون أدنى مسؤولية على الشركة تجاه الغير.\n\nوالله الموفق،،،",
    footer: "والله الموفق،،،",
    category: "letters",
  },
  {
    template_id: "template_employee_introduction",
    template_type: "تعريف موظف",
    template_name: "تعريف موظف",
    subject: "الموضوع: تعريف موظف",
    body: "السلام عليكم ورحمة الله وبركاته، وبعد:\n\nإشارة إلى الموضوع أعلاه، تفيد شركة {{company_name}} بأن الأخ/ {{employee_name}}، الرقم الوظيفي/ {{employee_id}}، يعمل لدى الشركة بوظيفة {{job_title}} ضمن {{department}} في {{branch}}، ولا يزال على رأس عمله حتى تاريخ إصدار هذا الخطاب.\n\nوقد أعطي له هذا التعريف بناءً على طلبه لاستخدامه فيما يخصه.\n\nوالله الموفق،،،",
    footer: "والله الموفق،،،",
    category: "letters",
  },
  {
    template_id: "template_salary_certificate",
    template_type: "تعريف راتب",
    template_name: "تعريف راتب",
    subject: "الموضوع: تعريف راتب",
    body: "السلام عليكم ورحمة الله وبركاته، وبعد:\n\nإشارة إلى الموضوع أعلاه، تفيد شركة {{company_name}} بأن الموظف/ {{employee_name}}، الرقم الوظيفي/ {{employee_id}}، يعمل لدينا بوظيفة {{job_title}}، ويتقاضى راتباً شهرياً وقدره {{salary}}.\n\nوقد أعطي له هذا الخطاب بناءً على طلبه دون أدنى مسؤولية على الشركة.\n\nوالله الموفق،،،",
    footer: "والله الموفق،،،",
    category: "letters",
  },
  {
    template_id: "template_clearance_certificate",
    template_type: "إخلاء طرف",
    template_name: "إخلاء طرف",
    subject: "الموضوع: إخلاء طرف",
    body: "السلام عليكم ورحمة الله وبركاته، وبعد:\n\nإشارة إلى الموضوع أعلاه، نفيدكم بأن الموظف/ {{employee_name}}، الرقم الوظيفي/ {{employee_id}}، قد أنهى ما عليه من التزامات وعهد مسلمة إليه بحسب البيانات المتوفرة لدى الشركة حتى تاريخ إصدار هذا الخطاب.\n\nوعليه، فقد تم إخلاء طرفه من العهد والالتزامات المسجلة عليه، ما لم تظهر أي مطالبات أو التزامات لاحقة تخص فترة عمله.\n\nوالله الموفق،،،",
    footer: "والله الموفق،،،",
    category: "letters",
  },
  {
    template_id: "template_contract_end_notice",
    template_type: "إشعار انتهاء عقد",
    template_name: "إشعار انتهاء عقد",
    subject: "الموضوع: إشعار انتهاء عقد عمل",
    body: "السلام عليكم ورحمة الله وبركاته، وبعد:\n\nإشارة إلى الموضوع أعلاه، نود إشعاركم بأن عقد العمل الخاص بالموظف/ {{employee_name}}، الرقم الوظيفي/ {{employee_id}}، بوظيفة {{job_title}}، سينتهي/انتهى بتاريخ {{document_date}}، وذلك وفقاً للأنظمة واللوائح والإجراءات المعمول بها في الشركة.\n\nوعليه، يرجى استكمال إجراءات التسليم والتصفية النظامية لدى الجهات المختصة.\n\nوالله الموفق،،،",
    footer: "والله الموفق،،،",
    category: "letters",
  },
  {
    template_id: "template_probation_end_notice",
    template_type: "إشعار انتهاء فترة تجربة",
    template_name: "إشعار انتهاء فترة تجربة",
    subject: "الموضوع: إشعار انتهاء فترة التجربة",
    body: "السلام عليكم ورحمة الله وبركاته، وبعد:\n\nإشارة إلى الموضوع أعلاه، وبناءً على تقييم فترة التجربة للموظف/ {{employee_name}}، الرقم الوظيفي/ {{employee_id}}، بوظيفة {{job_title}}، فقد تقرر إنهاء فترة التجربة وعدم الاستمرار في العلاقة التعاقدية، وذلك وفقاً لما تقتضيه مصلحة العمل والأنظمة المعمول بها.\n\nيرجى استكمال إجراءات التسليم والتصفية حسب المتبع.\n\nوالله الموفق،،،",
    footer: "والله الموفق،،،",
    category: "letters",
  },
  {
    template_id: "template_employee_transfer",
    template_type: "نقل موظف",
    template_name: "نقل موظف",
    subject: "الموضوع: إشعار نقل موظف",
    body: "السلام عليكم ورحمة الله وبركاته، وبعد:\n\nإشارة إلى الموضوع أعلاه، تقرر نقل الموظف/ {{employee_name}}، الرقم الوظيفي/ {{employee_id}}، من {{branch}} إلى {{notes}}، وذلك اعتباراً من تاريخ {{document_date}}، مع احتفاظه بكامل صلاحياته ومهامه الوظيفية ما لم يصدر توجيه آخر.\n\nوعليه، يرجى مباشرة العمل في مقر العمل الجديد والالتزام بالتعليمات المنظمة لذلك.\n\nوالله الموفق،،،",
    footer: "والله الموفق،،،",
    category: "letters",
  },
  {
    template_id: "template_assignment",
    template_type: "تكليف بعمل",
    template_name: "تكليف بعمل",
    subject: "الموضوع: تكليف بعمل",
    body: "السلام عليكم ورحمة الله وبركاته، وبعد:\n\nإشارة إلى الموضوع أعلاه، تقرر تكليف الموظف/ {{employee_name}}، الرقم الوظيفي/ {{employee_id}}، بالقيام بالمهام الموضحة في هذا التكليف: {{notes}}، وذلك اعتباراً من تاريخ {{document_date}} وحتى إشعار آخر.\n\nوعليه، يرجى الالتزام بما ورد في هذا التكليف ورفع أي ملاحظات للإدارة المختصة.\n\nوالله الموفق،،،",
    footer: "والله الموفق،،،",
    category: "letters",
  },
  {
    template_id: "template_warning_notice",
    template_type: "لفت نظر",
    template_name: "لفت نظر",
    subject: "الموضوع: لفت نظر",
    body: "السلام عليكم ورحمة الله وبركاته، وبعد:\n\nإشارة إلى الموضوع أعلاه، وبناءً على ما تم رصده بشأن الموظف/ {{employee_name}}، الرقم الوظيفي/ {{employee_id}}، والمتعلق بـ {{reason}}، فإننا نلفت نظركم إلى ضرورة الالتزام بالأنظمة والتعليمات المعمول بها في الشركة.\n\nويعد هذا الخطاب تنبيهاً رسمياً لتصحيح الوضع وتجنب تكرار المخالفة مستقبلاً.\n\nوالله الموفق،،،",
    footer: "والله الموفق،،،",
    category: "letters",
  },
  {
    template_id: "template_resignation_acceptance",
    template_type: "قبول استقالة",
    template_name: "قبول استقالة",
    subject: "الموضوع: قبول استقالة",
    body: "السلام عليكم ورحمة الله وبركاته، وبعد:\n\nإشارة إلى الموضوع أعلاه، وبناءً على طلب الاستقالة المقدم من الموظف/ {{employee_name}}، الرقم الوظيفي/ {{employee_id}}، فقد تمت الموافقة على قبول الاستقالة اعتباراً من تاريخ {{document_date}}.\n\nوعليه، يرجى استكمال إجراءات التسليم والتصفية النظامية حسب المتبع.\n\nوالله الموفق،،،",
    footer: "والله الموفق،،،",
    category: "letters",
  },
  {
    template_id: "template_leave_request",
    template_type: "طلب إجازة",
    template_name: "طلب إجازة",
    subject: "الموضوع: طلب إجازة",
    body: "السلام عليكم ورحمة الله وبركاته، وبعد:\n\nإشارة إلى الموضوع أعلاه، يتقدم الموظف/ {{employee_name}}، الرقم الوظيفي/ {{employee_id}}، بطلب إجازة خلال الفترة من {{leave_start_date}} إلى {{leave_end_date}}، وذلك بسبب: {{reason}}.\n\nيرجى التكرم بالمراجعة واتخاذ ما يلزم حسب الأنظمة المعمول بها.\n\nوالله الموفق،،،",
    footer: "والله الموفق،،،",
    category: "requests",
  },
  {
    template_id: "template_allowance_request",
    template_type: "طلب صرف مستحقات",
    template_name: "طلب صرف مستحقات",
    subject: "الموضوع: طلب صرف مستحقات",
    body: "السلام عليكم ورحمة الله وبركاته، وبعد:\n\nإشارة إلى الموضوع أعلاه، يتقدم الموظف/ {{employee_name}}، الرقم الوظيفي/ {{employee_id}}، بطلب صرف مستحقات بمبلغ وقدره {{amount}}، وذلك للأسباب الموضحة: {{reason}}.\n\nيرجى التكرم بالمراجعة واتخاذ ما يلزم حسب اللوائح والإجراءات المعتمدة.\n\nوالله الموفق،،،",
    footer: "والله الموفق،،،",
    category: "requests",
  },
  {
    template_id: "template_financial_assistance_request",
    template_type: "طلب مساعدة مالية",
    template_name: "طلب مساعدة مالية",
    subject: "الموضوع: طلب مساعدة مالية",
    body: "السلام عليكم ورحمة الله وبركاته، وبعد:\n\nإشارة إلى الموضوع أعلاه، يتقدم الموظف/ {{employee_name}}، الرقم الوظيفي/ {{employee_id}}، بطلب مساعدة مالية بمبلغ وقدره {{amount}}، وذلك نظراً للظروف الموضحة: {{reason}}.\n\nيرجى التكرم بالنظر في الطلب واتخاذ ما ترونه مناسباً وفقاً للأنظمة المعمول بها.\n\nوالله الموفق،،،",
    footer: "والله الموفق،،،",
    category: "requests",
  },
  {
    template_id: "template_employee_data_report",
    template_type: "تقرير بيانات موظف",
    template_name: "تقرير بيانات موظف",
    subject: "الموضوع: تقرير بيانات موظف",
    body: "السلام عليكم ورحمة الله وبركاته، وبعد:\n\nإشارة إلى الموضوع أعلاه، نرفق لكم تقرير بيانات الموظف/ {{employee_name}}، الرقم الوظيفي/ {{employee_id}}، والذي يعمل بوظيفة {{job_title}} في {{branch}} ضمن {{department}}.\n\nويأتي هذا التقرير لغرض المراجعة والمتابعة الإدارية وفق البيانات المسجلة في النظام.\n\nوالله الموفق،،،",
    footer: "والله الموفق،،،",
    category: "reports",
  },
];

const buildCompanyQuery = (companyId) => {
  const parts = ["select=*"];
  if (companyId) {
    parts.push(`company_id=eq.${encodeURIComponent(companyId)}`);
  }
  return parts.join("&");
};

const throwServiceError = (error) => {
  const message = error?.message || String(error || "");
  if (/relation .* does not exist|does not exist|table .* does not exist/i.test(message)) {
    throw new Error("يجب تنفيذ ملف ترحيل مركز الخطابات والتقارير أولاً");
  }
  throw new Error(message || "فشل تحميل بيانات مركز الخطابات والتقارير");
};

const normalizeDocumentRow = (row = {}) => ({
  document_id: row.document_id || row.id || "",
  company_id: row.company_id || "",
  document_no: row.document_no || "",
  document_type: row.document_type || "",
  document_title: row.document_title || row.subject || "",
  employee_id: row.employee_id || "",
  employee_name: row.employee_name || "",
  branch: row.branch || "",
  department: row.department || "",
  job_title: row.job_title || row.job || "",
  document_date: row.document_date || "",
  subject: row.subject || "",
  body: row.body || "",
  status: row.status || "مسودة",
  approval_status: row.approval_status || "غير معتمد",
  requested_by: row.requested_by || "",
  approved_by: row.approved_by || "",
  approved_at: row.approved_at || "",
  notes: row.notes || "",
  reason: row.reason || "",
  amount: row.amount || "",
  leave_start_date: row.leave_start_date || "",
  leave_end_date: row.leave_end_date || "",
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
  file_url: row.file_url || "",
});

export const hrLettersReportsService = {
  async getHrDocumentTemplates(companyId) {
    try {
      const templates = await supabase.select("hr_document_templates", `${buildCompanyQuery(companyId)}&order=template_name.asc`);
      if (!Array.isArray(templates) || !templates.length) {
        await this.ensureDefaultTemplates(companyId);
        return await supabase.select("hr_document_templates", `${buildCompanyQuery(companyId)}&order=template_name.asc`);
      }
      return templates;
    } catch (error) {
      throwServiceError(error);
    }
  },

  async ensureDefaultTemplates(companyId) {
    try {
      const rows = templateDefaults.map((template) => ({
        ...template,
        template_id: template.template_id || uuid(),
        company_id: companyId,
        is_active: true,
      }));
      await supabase.from("hr_document_templates").upsert(rows, { onConflict: "template_id" }).select();
      return rows;
    } catch (error) {
      throwServiceError(error);
    }
  },

  async getHrDocuments(companyId) {
    try {
      const rows = await supabase.select("hr_documents", `${buildCompanyQuery(companyId)}&order=document_date.desc`);
      return Array.isArray(rows) ? rows.map(normalizeDocumentRow) : [];
    } catch (error) {
      throwServiceError(error);
    }
  },

  async getHrDocumentArchives(companyId) {
    try {
      return await supabase.select("hr_document_archive", `${buildCompanyQuery(companyId)}&order=created_at.desc`);
    } catch (error) {
      throwServiceError(error);
    }
  },

  async createHrDocument(companyId, payload) {
    try {
      const prepared = {
        document_id: payload.document_id || uuid(),
        company_id: companyId,
        document_no: payload.document_no || "",
        document_type: payload.document_type || "",
        document_title: payload.document_title || payload.subject || payload.template_name || payload.document_type || "",
        employee_id: payload.employee_id || "",
        employee_name: payload.employee_name || "",
        branch: payload.branch || "",
        department: payload.department || "",
        job_title: payload.job_title || "",
        document_date: payload.document_date || new Date().toISOString().slice(0, 10),
        subject: payload.subject || "",
        body: payload.body || "",
        status: payload.status || "مسودة",
        approval_status: payload.approval_status || "غير معتمد",
        requested_by: payload.requested_by || "",
        approved_by: payload.approved_by || "",
        approved_at: payload.approved_at || null,
        notes: payload.notes || "",
        reason: payload.reason || "",
        amount: payload.amount || "",
        leave_start_date: payload.leave_start_date || "",
        leave_end_date: payload.leave_end_date || "",
        file_url: payload.file_url || "",
        created_at: payload.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("hr_documents").upsert(prepared, { onConflict: "document_id" }).select();
      if (error) throw error;
      return normalizeDocumentRow(Array.isArray(data) ? data[0] : data);
    } catch (error) {
      throwServiceError(error);
    }
  },

  async updateHrDocument(companyId, documentId, payload) {
    try {
      const prepared = {
        ...payload,
        document_id: documentId,
        company_id: companyId,
        document_title: payload.document_title || payload.subject || payload.template_name || payload.document_type || "",
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("hr_documents").upsert(prepared, { onConflict: "document_id" }).select();
      if (error) throw error;
      return normalizeDocumentRow(Array.isArray(data) ? data[0] : data);
    } catch (error) {
      throwServiceError(error);
    }
  },

  async deleteHrDocument(companyId, documentId) {
    try {
      await supabase.request(`/rest/v1/hr_documents?document_id=eq.${encodeURIComponent(documentId)}&company_id=eq.${encodeURIComponent(companyId)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
      return true;
    } catch (error) {
      throwServiceError(error);
    }
  },

  async approveHrDocument(companyId, documentId, approvedBy) {
    try {
      const row = await this.getHrDocuments(companyId).then((rows) => rows.find((item) => item.document_id === documentId));
      if (!row) throw new Error("المستند غير موجود");
      return this.updateHrDocument(companyId, documentId, {
        ...row,
        approval_status: "معتمد",
        approved_by: approvedBy || row.approved_by || "",
        approved_at: new Date().toISOString(),
      });
    } catch (error) {
      throwServiceError(error);
    }
  },

  async archiveHrDocument(companyId, documentId) {
    try {
      const row = await this.getHrDocuments(companyId).then((rows) => rows.find((item) => item.document_id === documentId));
      if (!row) throw new Error("المستند غير موجود");
      const archiveRow = {
        archive_id: uuid(),
        company_id: companyId,
        document_id: row.document_id,
        document_type: row.document_type,
        employee_id: row.employee_id,
        employee_name: row.employee_name,
        archive_title: row.document_title || row.subject || row.document_type || "",
        archive_status: "مؤرشف",
        file_url: row.file_url || "",
        notes: row.notes || "",
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("hr_document_archive").upsert(archiveRow, { onConflict: "archive_id" }).select();
      if (error) throw error;
      await this.updateHrDocument(companyId, documentId, {
        ...row,
        status: "مؤرشف",
      });
      return archiveRow;
    } catch (error) {
      throwServiceError(error);
    }
  },

  async getEmployeesForDocuments(companyId) {
    try {
      const rows = await supabase.select("employees", `${buildCompanyQuery(companyId)}&order=name.asc`);
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      throwServiceError(error);
    }
  },

  renderTemplate(templateBody = "", data = {}) {
    const text = String(templateBody || "");
    return text.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
      const normalizedKey = key.trim();
      const value = data[normalizedKey] ?? data[normalizedKey.toLowerCase()] ?? data[normalizedKey.replace(/\s+/g, "_")] ?? data[normalizedKey.replace(/_/g, " ")];
      return String(value || "غير متوفر");
    });
  },
};
