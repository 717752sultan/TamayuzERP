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

const escapeHtml = (value = "") => String(value || "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const normalizeDateValue = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};

const defaultPrintSettings = {
  setting_id: "default_hr_document_print_settings",
  company_id: "",
  company_name_ar: "Pure Money",
  company_name_en: "Pure Money",
  company_logo_url: "",
  header_title: "",
  header_subtitle: "",
  header_address: "",
  header_phone: "",
  header_email: "",
  footer_line_1: "",
  footer_line_2: "",
  footer_line_3: "",
  signature_title: "إدارة الموارد البشرية",
  signature_name: "",
  stamp_label: "الختم",
  show_logo: true,
  show_company_name_ar: true,
  show_company_name_en: true,
  show_document_number: true,
  show_print_date: true,
  paper_size: "A4",
  print_margin_top: 20,
  print_margin_bottom: 20,
  print_margin_right: 18,
  print_margin_left: 18,
  is_active: true,
};

const normalizePrintSettings = (row = {}) => ({
  setting_id: row.setting_id || row.id || uuid(),
  company_id: row.company_id || "",
  company_name_ar: String(row.company_name_ar || row.company_name || defaultPrintSettings.company_name_ar),
  company_name_en: String(row.company_name_en || defaultPrintSettings.company_name_en),
  company_logo_url: String(row.company_logo_url || ""),
  header_title: String(row.header_title || ""),
  header_subtitle: String(row.header_subtitle || ""),
  header_address: String(row.header_address || ""),
  header_phone: String(row.header_phone || ""),
  header_email: String(row.header_email || ""),
  footer_line_1: String(row.footer_line_1 || ""),
  footer_line_2: String(row.footer_line_2 || ""),
  footer_line_3: String(row.footer_line_3 || ""),
  signature_title: String(row.signature_title || defaultPrintSettings.signature_title),
  signature_name: String(row.signature_name || ""),
  stamp_label: String(row.stamp_label || defaultPrintSettings.stamp_label),
  show_logo: row.show_logo !== false,
  show_company_name_ar: row.show_company_name_ar !== false,
  show_company_name_en: row.show_company_name_en !== false,
  show_document_number: row.show_document_number !== false,
  show_print_date: row.show_print_date !== false,
  paper_size: String(row.paper_size || defaultPrintSettings.paper_size),
  print_margin_top: Number(row.print_margin_top ?? defaultPrintSettings.print_margin_top),
  print_margin_bottom: Number(row.print_margin_bottom ?? defaultPrintSettings.print_margin_bottom),
  print_margin_right: Number(row.print_margin_right ?? defaultPrintSettings.print_margin_right),
  print_margin_left: Number(row.print_margin_left ?? defaultPrintSettings.print_margin_left),
  is_active: row.is_active !== false,
  created_at: row.created_at || row.createdAt || new Date().toISOString(),
  updated_at: row.updated_at || row.updatedAt || new Date().toISOString(),
});

const normalizeDocumentPayload = (payload = {}) => ({
  document_id: String(payload.document_id || payload.id || uuid()),
  company_id: String(payload.company_id || ""),
  document_no: String(payload.document_no || ""),
  document_type: String(payload.document_type || ""),
  document_title: String(payload.document_title || payload.subject || payload.template_name || payload.document_type || ""),
  company_name: String(payload.company_name || payload.company_name_ar || payload.company_name_en || ""),
  employee_id: String(payload.employee_id || ""),
  employee_name: String(payload.employee_name || ""),
  branch: String(payload.branch || ""),
  department: String(payload.department || ""),
  job_title: String(payload.job_title || payload.job || ""),
  document_date: normalizeDateValue(payload.document_date),
  subject: String(payload.subject || ""),
  body: String(payload.body || ""),
  status: String(payload.status || "مسودة"),
  approval_status: String(payload.approval_status || "غير معتمد"),
  requested_by: String(payload.requested_by || ""),
  approved_by: String(payload.approved_by || ""),
  approved_at: payload.approved_at ? new Date(payload.approved_at).toISOString() : null,
  notes: String(payload.notes || ""),
  reason: String(payload.reason || ""),
  amount: String(payload.amount || ""),
  leave_start_date: payload.leave_start_date ? normalizeDateValue(payload.leave_start_date) : "",
  leave_end_date: payload.leave_end_date ? normalizeDateValue(payload.leave_end_date) : "",
  file_url: String(payload.file_url || ""),
  use_company_header: payload.use_company_header !== false,
  allow_edit_before_approval: payload.allow_edit_before_approval !== false,
  created_at: payload.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const renderText = (value = "") => escapeHtml(String(value || "")).replace(/\n/g, "<br />");

const renderOfficialDocumentHtml = (document = {}, settings = {}) => {
  const config = normalizePrintSettings(settings);
  const doc = {
    document_no: document.document_no || "—",
    document_date: document.document_date || new Date().toISOString().slice(0, 10),
    document_type: document.document_type || "—",
    subject: document.subject || "—",
    employee_name: document.employee_name || "—",
    employee_id: document.employee_id || "—",
    branch: document.branch || "—",
    department: document.department || "—",
    job_title: document.job_title || "—",
    body: document.body || "—",
    company_name: document.company_name || config.company_name_ar || "Pure Money",
    use_company_header: document.use_company_header !== false,
  };

  const logoHtml = config.show_logo && config.company_logo_url
    ? `<div class="company-logo"><img src="${escapeHtml(config.company_logo_url)}" alt="logo" onerror="this.style.display='none'" /></div>`
    : "";

  const companyHeader = `<div class="company-header">
    <div class="company-header-content">
      ${config.show_company_name_ar ? `<div class="company-name-ar">${escapeHtml(doc.company_name)}</div>` : ""}
      ${config.show_company_name_en ? `<div class="company-name-en">${escapeHtml(config.company_name_en)}</div>` : ""}
      ${config.header_title ? `<div class="header-title">${escapeHtml(config.header_title)}</div>` : ""}
      ${config.header_subtitle ? `<div class="header-subtitle">${escapeHtml(config.header_subtitle)}</div>` : ""}
      ${(config.header_address || config.header_phone || config.header_email) ? `<div class="header-contact">${escapeHtml(config.header_address || "")}${config.header_address && (config.header_phone || config.header_email) ? " • " : ""}${escapeHtml(config.header_phone || "")}${config.header_phone && config.header_email ? " • " : ""}${escapeHtml(config.header_email || "")}</div>` : ""}
    </div>
    ${logoHtml}
  </div>`;

  const metadataRows = [];
  if (config.show_document_number) metadataRows.push(`<tr><th>رقم المستند</th><td>${escapeHtml(doc.document_no)}</td></tr>`);
  metadataRows.push(`<tr><th>التاريخ</th><td>${escapeHtml(doc.document_date)}</td></tr>`);
  metadataRows.push(`<tr><th>نوع المستند</th><td>${escapeHtml(doc.document_type)}</td></tr>`);
  metadataRows.push(`<tr><th>الموضوع</th><td>${escapeHtml(doc.subject)}</td></tr>`);
  metadataRows.push(`<tr><th>الموظف</th><td>${escapeHtml(doc.employee_name)}</td></tr>`);
  metadataRows.push(`<tr><th>الرقم الوظيفي</th><td>${escapeHtml(doc.employee_id)}</td></tr>`);
  metadataRows.push(`<tr><th>الفرع</th><td>${escapeHtml(doc.branch)}</td></tr>`);
  metadataRows.push(`<tr><th>القسم</th><td>${escapeHtml(doc.department)}</td></tr>`);
  metadataRows.push(`<tr><th>الوظيفة</th><td>${escapeHtml(doc.job_title)}</td></tr>`);

  const footerLines = [config.footer_line_1, config.footer_line_2, config.footer_line_3].filter(Boolean).map((line) => `<div>${escapeHtml(line)}</div>`).join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.document_type || "المستند")}</title>
  <style>
    body { margin: 0; padding: 0; font-family: Tahoma, Arial, sans-serif; color: #111; direction: rtl; background: #fff; }
    .page { width: 100%; min-height: 100vh; box-sizing: border-box; padding: ${Number(config.print_margin_top)}mm ${Number(config.print_margin_right)}mm ${Number(config.print_margin_bottom)}mm ${Number(config.print_margin_left)}mm; }
    .company-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 18px; }
    .company-header-content { flex: 1; }
    .company-logo img { max-height: 100px; max-width: 180px; object-fit: contain; }
    .company-name-ar { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
    .company-name-en { font-size: 16px; color: #4b5563; margin-bottom: 8px; }
    .header-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .header-subtitle { font-size: 14px; color: #374151; margin-bottom: 4px; }
    .header-contact { font-size: 13px; color: #4b5563; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .meta-table th, .meta-table td { padding: 10px 12px; border: 1px solid #ddd; text-align: right; vertical-align: top; }
    .meta-table th { width: 180px; background: #f8fafc; font-weight: 700; }
    .document-title { font-size: 20px; margin-bottom: 16px; font-weight: 900; }
    .subject-block { margin-bottom: 22px; font-size: 15px; line-height: 1.8; }
    .body-block { font-size: 15px; line-height: 1.8; white-space: pre-wrap; margin-bottom: 28px; }
    .footer { margin-top: 32px; border-top: 1px solid #ddd; padding-top: 18px; font-size: 14px; color: #111; }
    .footer-line { margin-bottom: 6px; }
    .signature-block { display: flex; justify-content: space-between; gap: 16px; margin-top: 18px; }
    .signature-item { width: 48%; }
    .signature-title { font-weight: 800; margin-bottom: 8px; }
    .stamp-label { text-align: center; margin-top: 24px; font-size: 14px; color: #4b5563; }
    .print-date { margin-top: 10px; font-size: 12px; color: #4b5563; }
    @media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="page">
    ${doc.use_company_header === false ? "" : companyHeader}
    <div class="document-title">${escapeHtml(doc.document_type)}</div>
    <table class="meta-table">
      ${metadataRows.join("")}
    </table>
    <div class="subject-block"><strong>الموضوع:</strong> ${escapeHtml(doc.subject)}</div>
    <div class="body-block">${renderText(doc.body)}</div>
    <div class="footer">
      <div class="footer-line">والله الموفق،،،</div>
      ${footerLines}
      <div class="signature-block">
        <div class="signature-item">
          <div class="signature-title">${escapeHtml(config.signature_title)}</div>
          ${config.signature_name ? `<div>${escapeHtml(config.signature_name)}</div>` : ""}
          <div>الاسم:</div>
          <div>التوقيع:</div>
        </div>
        <div class="signature-item stamp-label">${escapeHtml(config.stamp_label)}</div>
      </div>
      ${config.show_print_date ? `<div class="print-date">تاريخ الطباعة: ${escapeHtml(new Date().toISOString().slice(0, 10))}</div>` : ""}
    </div>
  </div>
</body>
</html>`;
};

const throwServiceError = (error, fallbackMessage) => {
  const message = error?.message || String(error || "");
  if (/relation .* does not exist|does not exist|table .* does not exist/i.test(message)) {
    throw new Error(fallbackMessage || "يجب تنفيذ ملف ترحيل مركز الخطابات والتقارير أولاً");
  }
  throw new Error(message || fallbackMessage || "فشل تحميل بيانات مركز الخطابات والتقارير");
};

const normalizeDocumentRow = (row = {}) => ({
  document_id: row.document_id || row.id || "",
  company_id: row.company_id || "",
  document_no: row.document_no || "",
  document_type: row.document_type || "",
  document_title: row.document_title || row.subject || "",
  company_name: row.company_name || "",
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
  use_company_header: row.use_company_header !== false,
  allow_edit_before_approval: row.allow_edit_before_approval !== false,
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

  async getHrDocumentPrintSettings(companyId) {
    try {
      const rows = await supabase.select("hr_document_print_settings", `${buildCompanyQuery(companyId)}&is_active=eq.true&limit=1`);
      if (Array.isArray(rows) && rows.length) {
        return normalizePrintSettings(rows[0]);
      }
      return { ...defaultPrintSettings, company_id: companyId };
    } catch (error) {
      throwServiceError(error, "يجب تنفيذ ملف إعدادات الترويسة والتذييل أولاً");
    }
  },

  async saveHrDocumentPrintSettings(companyId, payload) {
    try {
      const prepared = normalizePrintSettings({
        ...payload,
        company_id: companyId,
        setting_id: payload.setting_id || uuid(),
        is_active: true,
      });
      const { data, error } = await supabase.from("hr_document_print_settings").upsert(prepared, { onConflict: "setting_id" }).select();
      if (error) throw error;
      return normalizePrintSettings(Array.isArray(data) ? data[0] : data);
    } catch (error) {
      throwServiceError(error, "تعذر حفظ إعدادات الترويسة والتذييل");
    }
  },

  renderOfficialDocumentHtml(document, settings) {
    return renderOfficialDocumentHtml(document, settings);
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
      const prepared = normalizeDocumentPayload({
        ...payload,
        document_id: payload.document_id || uuid(),
        company_id: companyId,
        status: payload.status || "مسودة",
        approval_status: payload.approval_status || "غير معتمد",
        created_at: payload.created_at || new Date().toISOString(),
      });
      const { data, error } = await supabase.from("hr_documents").upsert(prepared, { onConflict: "document_id" }).select();
      if (error) throw error;
      return normalizeDocumentRow(Array.isArray(data) ? data[0] : data);
    } catch (error) {
      throwServiceError(error);
    }
  },

  async updateHrDocument(companyId, documentId, payload) {
    try {
      const prepared = normalizeDocumentPayload({
        ...payload,
        document_id: documentId,
        company_id: companyId,
        updated_at: new Date().toISOString(),
      });
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
        body_snapshot: row.body || "",
        header_snapshot: row.company_name || "",
        footer_snapshot: "",
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
      const rawValue = data[normalizedKey] ?? data[normalizedKey.toLowerCase()] ?? data[normalizedKey.replace(/\s+/g, "_")] ?? data[normalizedKey.replace(/_/g, " ")];
      if (normalizedKey === "company_name") {
        return String(rawValue || data.company_name || data.company_name_ar || data.company_name_en || "Pure Money");
      }
      if (normalizedKey === "company_name_ar") {
        return String(rawValue || data.company_name_ar || data.company_name || "Pure Money");
      }
      if (normalizedKey === "company_name_en") {
        return String(rawValue || data.company_name_en || data.company_name || data.company_name_ar || "Pure Money");
      }
      return String(rawValue ?? "غير متوفر");
    });
  },
  defaultPrintSettings: defaultPrintSettings,
};
