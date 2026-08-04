import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  BookOpen,
  Check,
  FileArchive,
  FileText,
  FileSpreadsheet,
  Filter,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { hrLettersReportsService } from "../../services/hrLettersReports";

const tabs = [
  ["all", "الخطابات والتقارير"],
  ["letters", "الخطابات"],
  ["requests", "الطلبات"],
  ["reports", "التقارير"],
  ["archive", "أرشيف المستندات"],
  ["templates", "قوالب الخطابات"],
];

const documentTypes = [
  { key: "شهادة خبرة", label: "شهادة خبرة", category: "letters" },
  { key: "تعريف موظف", label: "تعريف موظف", category: "letters" },
  { key: "تعريف راتب", label: "تعريف راتب", category: "letters" },
  { key: "إخلاء طرف", label: "إخلاء طرف", category: "letters" },
  { key: "مباشرة عمل", label: "مباشرة عمل", category: "letters" },
  { key: "تكليف بعمل", label: "تكليف بعمل", category: "letters" },
  { key: "نقل موظف", label: "نقل موظف", category: "letters" },
  { key: "إنذار / لفت نظر", label: "إنذار / لفت نظر", category: "letters" },
  { key: "إشعار غياب", label: "إشعار غياب", category: "letters" },
  { key: "إشعار تأخير", label: "إشعار تأخير", category: "letters" },
  { key: "إشعار انتهاء فترة تجربة", label: "إشعار انتهاء فترة تجربة", category: "letters" },
  { key: "إشعار انتهاء عقد", label: "إشعار انتهاء عقد", category: "letters" },
  { key: "قبول استقالة", label: "قبول استقالة", category: "letters" },
  { key: "رفض استقالة", label: "رفض استقالة", category: "letters" },
  { key: "عدم ممانعة", label: "عدم ممانعة", category: "letters" },
  { key: "طلب إفادة عن موظف", label: "طلب إفادة عن موظف", category: "letters" },
  { key: "إفادة التزام وظيفي", label: "إفادة التزام وظيفي", category: "letters" },
  { key: "طلب إجازة", label: "طلب إجازة", category: "requests" },
  { key: "طلب صرف مستحقات", label: "طلب صرف مستحقات", category: "requests" },
  { key: "طلب مساعدة مالية", label: "طلب مساعدة مالية", category: "requests" },
  { key: "طلب سلفة", label: "طلب سلفة", category: "requests" },
  { key: "طلب تعديل بيانات موظف", label: "طلب تعديل بيانات موظف", category: "requests" },
  { key: "طلب نقل فرع", label: "طلب نقل فرع", category: "requests" },
  { key: "طلب تكليف", label: "طلب تكليف", category: "requests" },
  { key: "طلب بدل إضافي", label: "طلب بدل إضافي", category: "requests" },
  { key: "طلب بدل مواصلات", label: "طلب بدل مواصلات", category: "requests" },
  { key: "طلب تصفية عهدة", label: "طلب تصفية عهدة", category: "requests" },
  { key: "تقرير بيانات موظف", label: "تقرير بيانات موظف", category: "reports" },
  { key: "تقرير حضور موظف", label: "تقرير حضور موظف", category: "reports" },
  { key: "تقرير إنتاجية موظف", label: "تقرير إنتاجية موظف", category: "reports" },
  { key: "تقرير تقييم أداء موظف", label: "تقرير تقييم أداء موظف", category: "reports" },
  { key: "تقرير مخالفة موظف", label: "تقرير مخالفة موظف", category: "reports" },
  { key: "تقرير عهد موظف", label: "تقرير عهد موظف", category: "reports" },
  { key: "تقرير نهاية خدمة", label: "تقرير نهاية خدمة", category: "reports" },
  { key: "تقرير إجازات موظف", label: "تقرير إجازات موظف", category: "reports" },
];

const statusOptions = ["all", "مسودة", "معتمد", "غير معتمد", "مؤرشف"];

const today = () => new Date().toISOString().slice(0, 10);

const CleanLabel = ({ children }) => <span className="block text-sm font-bold">{children}</span>;

const PageHead = ({ title, desc, action }) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-extrabold">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
    {action}
  </div>
);

const Mini = ({ label, value, icon: Icon }) => (
  <div className="panel flex items-center gap-3 p-4">
    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <b className="text-xl">{value}</b>
    </div>
  </div>
);

const StatusBadge = ({ children }) => {
  const value = String(children || "");
  const cls = value === "معتمد" ? "bg-emerald-50 text-emerald-700" : value === "مؤرشف" ? "bg-slate-100 text-slate-600" : value === "مسودة" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{value || "غير محدد"}</span>;
};

const renderDocumentField = (document = {}, key) => document[key] || "—";

const documentCategory = (type) => documentTypes.find((item) => item.key === type)?.category || "letters";

const documentTypeLabel = (type) => documentTypes.find((item) => item.key === type)?.label || type || "غير محدد";

export default function HrLettersReportsCenter({ currentCompany, currentUser, can }) {
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templates, setTemplates] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [archives, setArchives] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const companyId = currentCompany?.company_id || currentUser?.company_id || "";

  const canView = can?.("hr_documents", "can_view") !== false;
  const canCreate = can?.("hr_documents", "can_create") !== false;
  const canEdit = can?.("hr_documents", "can_edit") !== false;
  const canApprove = can?.("hr_documents", "can_approve") !== false;
  const canDelete = can?.("hr_documents", "can_delete") !== false;
  const canExport = can?.("hr_documents", "can_export") !== false;

  const defaultDialog = {
    document_id: "",
    document_type: "طلب إجازة",
    template_id: "",
    document_title: "",
    employee_id: "",
    employee_name: "",
    branch: "",
    department: "",
    job_title: "",
    document_date: today(),
    subject: "",
    reason: "",
    amount: "",
    leave_start_date: "",
    leave_end_date: "",
    notes: "",
    body: "",
    status: "مسودة",
    approval_status: "غير معتمد",
    file_url: "",
  };

  useEffect(() => {
    const load = async () => {
      if (!companyId || !canView) return;
      setLoading(true);
      setError("");
      try {
        const [templateRows, documentRows, archiveRows, employeeRows] = await Promise.all([
          hrLettersReportsService.getHrDocumentTemplates(companyId),
          hrLettersReportsService.getHrDocuments(companyId),
          hrLettersReportsService.getHrDocumentArchives(companyId),
          hrLettersReportsService.getEmployeesForDocuments(companyId),
        ]);
        setTemplates(Array.isArray(templateRows) ? templateRows : []);
        setDocuments(Array.isArray(documentRows) ? documentRows : []);
        setArchives(Array.isArray(archiveRows) ? archiveRows : []);
        setEmployees(Array.isArray(employeeRows) ? employeeRows : []);
      } catch (err) {
        setError(err?.message || "تعذر تحميل بيانات مركز الخطابات والتقارير");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId, canView]);

  const currentTemplate = useMemo(
    () => templates.find((item) => item.template_id === dialog?.template_id),
    [templates, dialog?.template_id],
  );

  const computedSubject = useMemo(() => {
    if (!currentTemplate) return dialog?.subject || "";
    return hrLettersReportsService.renderTemplate(currentTemplate.subject, dialog || {});
  }, [currentTemplate, dialog]);

  const computedBody = useMemo(() => {
    if (!currentTemplate) return dialog?.body || "";
    return hrLettersReportsService.renderTemplate(currentTemplate.body, dialog || {});
  }, [currentTemplate, dialog]);

  const filteredDocuments = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    const activeCategory = activeTab === "all" ? null : activeTab;
    return documents.filter((document) => {
      if (activeCategory && documentCategory(document.document_type) !== activeCategory) return false;
      if (statusFilter !== "all" && String(document.status || "").trim() !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        document.document_no,
        document.document_type,
        document.document_title,
        document.employee_name,
        document.subject,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [documents, activeTab, query, statusFilter]);

  const visibleArchives = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    return archives.filter((archive) => {
      if (statusFilter !== "all" && String(archive.archive_status || "").trim() !== statusFilter) return false;
      if (!q) return true;
      const haystack = [archive.document_id, archive.document_type, archive.employee_name, archive.archive_title, archive.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [archives, query, statusFilter]);

  const stats = useMemo(() => {
    const letters = documents.filter((item) => documentCategory(item.document_type) === "letters").length;
    const requestsCount = documents.filter((item) => documentCategory(item.document_type) === "requests").length;
    const reportsCount = documents.filter((item) => documentCategory(item.document_type) === "reports").length;
    const approved = documents.filter((item) => item.approval_status === "معتمد").length;
    return [
      { label: "إجمالي المستندات", value: documents.length, icon: FileText },
      { label: "عدد الخطابات", value: letters, icon: BookOpen },
      { label: "عدد الطلبات", value: requestsCount, icon: FileArchive },
      { label: "المعتمدة", value: approved, icon: Check },
      { label: "قوالب الخطابات", value: templates.length, icon: FileSpreadsheet },
    ];
  }, [documents, templates.length]);

  const employeesOptions = useMemo(
    () => (employees || []).map((employee) => ({
      key: employee.employee_id || employee.id || employee.name,
      label: (employee.name || "غير محدد") + (employee.employee_id ? ` • ${employee.employee_id}` : ""),
      employee,
    })),
    [employees],
  );

  const openDialog = (document = null) => {
    if (!canCreate && !document) return;
    if (document) {
      setDialog({
        ...document,
        template_id: document.template_id || "",
        document_title: document.document_title || document.subject || document.document_type,
      });
      return;
    }
    setDialog({
      ...defaultDialog,
      document_date: today(),
    });
  };

  const closeDialog = () => setDialog(null);

  const setDialogField = (field, value) => setDialog((prev) => ({ ...(prev || {}), [field]: value }));

  const saveDocument = async (action = "draft") => {
    if (!dialog) return;
    if (!companyId) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...dialog,
        template_name: currentTemplate?.template_name || "",
        document_title: dialog.document_title || computedSubject || documentTypeLabel(dialog.document_type),
        subject: dialog.subject || computedSubject,
        body: dialog.body || computedBody,
        status: dialog.status || "مسودة",
        approval_status: action === "approve" ? "معتمد" : dialog.approval_status || "غير معتمد",
      };
      const saved = dialog.document_id
        ? await hrLettersReportsService.updateHrDocument(companyId, dialog.document_id, payload)
        : await hrLettersReportsService.createHrDocument(companyId, payload);
      setDocuments((prev) => {
        const rest = prev.filter((item) => item.document_id !== saved.document_id);
        return [saved, ...rest];
      });
      setDialog(null);
    } catch (err) {
      setError(err?.message || "تعذر حفظ المستند");
    } finally {
      setSaving(false);
    }
  };

  const approveDocument = async (document) => {
    if (!canApprove) return;
    setSaving(true);
    setError("");
    try {
      const approved = await hrLettersReportsService.approveHrDocument(companyId, document.document_id, currentUser?.name || currentUser?.username || "");
      setDocuments((prev) => prev.map((item) => (item.document_id === approved.document_id ? approved : item)));
    } catch (err) {
      setError(err?.message || "تعذر اعتماد المستند");
    } finally {
      setSaving(false);
    }
  };

  const archiveDocument = async (document) => {
    if (!document) return;
    setSaving(true);
    setError("");
    try {
      await hrLettersReportsService.archiveHrDocument(companyId, document.document_id);
      setDocuments((prev) => prev.filter((item) => item.document_id !== document.document_id));
      const archiveRows = await hrLettersReportsService.getHrDocumentArchives(companyId);
      setArchives(Array.isArray(archiveRows) ? archiveRows : []);
    } catch (err) {
      setError(err?.message || "تعذر أرشفة المستند");
    } finally {
      setSaving(false);
    }
  };

  const deleteDocument = async (document) => {
    if (!canDelete || !document) return;
    if (!window.confirm("هل أنت متأكد من حذف هذا المستند؟")) return;
    setSaving(true);
    setError("");
    try {
      await hrLettersReportsService.deleteHrDocument(companyId, document.document_id);
      setDocuments((prev) => prev.filter((item) => item.document_id !== document.document_id));
    } catch (err) {
      setError(err?.message || "تعذر حذف المستند");
    } finally {
      setSaving(false);
    }
  };

  const printDocument = (document) => {
    if (!document) return;
    const html = `<html dir="rtl"><head><meta charset="utf-8"><title>${document.document_title || document.document_no || "المستند"}</title><style>body{font-family:Tahoma,Arial,sans-serif;padding:24px;color:#111;direction:rtl}h1,h2,h3{margin:0 0 12px}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}th,td{border:1px solid #ddd;padding:10px;text-align:right}th{background:#f3f4f6}section{margin-bottom:20px}blockquote{margin:18px 0;padding:18px;background:#f8f8f8;border-right:4px solid #7f1d1d}</style></head><body><h1>${currentCompany?.company_name || "مركز الموارد البشرية"}</h1><h2>${document.document_title || document.document_type}</h2><p><strong>رقم المستند:</strong> ${document.document_no || "—"}</p><p><strong>التاريخ:</strong> ${document.document_date || "—"}</p><p><strong>الموظف:</strong> ${document.employee_name || "—"}</p><p><strong>الفرع:</strong> ${document.branch || "—"}</p><p><strong>القسم:</strong> ${document.department || "—"}</p><section><strong>الموضوع:</strong><p>${document.subject || "—"}</p></section><section><strong>نص الخطاب:</strong><blockquote>${(document.body || "—").replace(/\n/g, "<br />")}</blockquote></section><footer><p>والله الموفق،،،</p><p>إدارة الموارد البشرية</p></footer></body></html>`;
    const w = window.open("", "_blank", "width=900,height=800");
    if (!w) return alert("يرجى تمكين فتح النوافذ الجديدة لطباعة المستند.");
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const exportWord = (document) => {
    if (!document) return;
    const html = `<html dir="rtl"><head><meta charset="utf-8"><title>${document.document_title || document.document_type}</title></head><body><h1>${document.document_title || document.document_type}</h1><p><strong>رقم المستند:</strong> ${document.document_no || "—"}</p><p><strong>التاريخ:</strong> ${document.document_date || "—"}</p><p><strong>الموظف:</strong> ${document.employee_name || "—"}</p><p>${(document.body || "").replace(/\n/g, "<br />")}</p></body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${document.document_no || document.document_title || "hr-document"}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = (document) => {
    if (!document) return;
    printDocument(document);
  };

  const tableColumns = [
    { key: "document_no", label: "رقم المستند" },
    { key: "document_type", label: "النوع" },
    { key: "document_title", label: "العنوان" },
    { key: "employee_name", label: "الموظف" },
    { key: "branch", label: "الفرع" },
    { key: "document_date", label: "التاريخ" },
  ];

  if (!canView) {
    return (
      <div className="panel p-6 text-center font-bold text-red-600">لا تملك صلاحية الوصول إلى مركز الخطابات والتقارير</div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHead
        title="مركز خطابات وتقارير الموارد البشرية"
        desc="مركز إصدار الخطابات والطلبات والتقارير الرسمية للموظفين"
        action={<button disabled={!canCreate} onClick={() => openDialog()} className="btn-primary"><Plus size={18} /> إضافة</button>}
      />

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">{stats.map((item) => <Mini key={item.label} label={item.label} value={item.value} icon={item.icon} />)}</div>

      <div className="panel flex flex-wrap gap-2 p-3">{tabs.map(([key, label]) => (
        <button key={key} onClick={() => setActiveTab(key)} className={`rounded-xl px-4 py-2 text-sm font-bold ${activeTab === key ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>
          {label}
        </button>
      ))}</div>

      <div className="panel flex flex-wrap gap-3 p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="field pl-10" placeholder="بحث..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="field max-w-[200px]">
          {statusOptions.map((status) => <option key={status} value={status}>{status === "all" ? "كل الحالات" : status}</option>)}
        </select>
        <button disabled={!canExport} onClick={() => exportPdf({ document_title: "سجل المستندات", document_no: "", document_date: today(), employee_name: "" })} className="btn-secondary"><Printer size={17} /> طباعة</button>
      </div>

      <div className="panel p-4">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">جاري تحميل البيانات...</div>
        ) : activeTab === "templates" ? (
          <div className="space-y-4">
            {templates.length ? (
              <div className="table-wrap"><table><thead><tr><th>القالب</th><th>النوع</th><th>الوصف</th><th>الحالة</th></tr></thead><tbody>{templates.map((template) => <tr key={template.template_id}><td>{template.template_name}</td><td>{template.template_type}</td><td>{template.subject}</td><td><StatusBadge>{template.is_active ? "نشط" : "غير نشط"}</StatusBadge></td></tr>)}</tbody></table></div>
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">لا توجد قوالب مسجلة حالياً</div>
            )}
          </div>
        ) : activeTab === "archive" ? (
          <div className="space-y-4">
            {visibleArchives.length ? (
              <div className="table-wrap"><table><thead><tr><th>رقم المستند</th><th>النوع</th><th>الموظف</th><th>التاريخ</th><th>الحالة</th><th>ملاحظات</th></tr></thead><tbody>{visibleArchives.map((item) => <tr key={item.archive_id}><td>{item.document_id || "—"}</td><td>{item.document_type}</td><td>{item.employee_name}</td><td>{item.created_at?.slice(0, 10) || "—"}</td><td><StatusBadge>{item.archive_status}</StatusBadge></td><td>{item.notes || "—"}</td></tr>)}</tbody></table></div>
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">لا توجد مستندات مؤرشفة حالياً</div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.length ? (
              <div className="table-wrap"><table><thead><tr>{tableColumns.map((col) => <th key={col.key}>{col.label}</th>)}<th>الحالة</th><th>الاعتماد</th><th>إجراءات</th></tr></thead><tbody>{filteredDocuments.map((document) => <tr key={document.document_id}><td>{document.document_no || "—"}</td><td>{document.document_type}</td><td>{document.document_title || "—"}</td><td>{document.employee_name || "—"}</td><td>{document.branch || "—"}</td><td>{document.document_date || "—"}</td><td><StatusBadge>{document.status || "—"}</StatusBadge></td><td><StatusBadge>{document.approval_status || "—"}</StatusBadge></td><td className="space-x-1 rtl:space-x-reverse"><button onClick={() => openDialog(document)} className="rounded-xl border border-slate-200 px-3 py-1 text-slate-600">عرض</button><button disabled={!canEdit} onClick={() => openDialog(document)} className="rounded-xl border border-slate-200 px-3 py-1 text-blue-600">تعديل</button><button disabled={!canApprove || document.approval_status === "معتمد"} onClick={() => approveDocument(document)} className="rounded-xl border border-slate-200 px-3 py-1 text-emerald-600">اعتماد</button><button onClick={() => archiveDocument(document)} className="rounded-xl border border-slate-200 px-3 py-1 text-amber-600">أرشفة</button><button disabled={!canDelete} onClick={() => deleteDocument(document)} className="rounded-xl border border-slate-200 px-3 py-1 text-red-600">حذف</button></td></tr>)}</tbody></table></div>
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">لا توجد بيانات حالياً</div>
            )}
          </div>
        )}
      </div>

      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4">
          <form onSubmit={(event) => { event.preventDefault(); saveDocument(dialog.approval_status === "معتمد" ? "approve" : "draft"); }} className="panel w-full max-w-5xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-xl font-extrabold">{dialog.document_id ? "تعديل المستند" : "إضافة مستند"}</h3>
                <p className="mt-1 text-sm text-slate-500">املأ بيانات المستند لتجهيزه للطباعة أو الاعتماد.</p>
              </div>
              <button type="button" onClick={closeDialog} className="rounded-full border border-slate-200 p-2 text-slate-600"><X size={18} /></button>
            </div>
            <div className="grid gap-4 py-5 lg:grid-cols-2">
              <label className="block">
                <CleanLabel>نوع المستند</CleanLabel>
                <select value={dialog.document_type} onChange={(e) => setDialogField("document_type", e.target.value)} className="field w-full">
                  {documentTypes.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <CleanLabel>القالب</CleanLabel>
                <select value={dialog.template_id} onChange={(e) => setDialogField("template_id", e.target.value)} className="field w-full">
                  <option value="">اختر قالباً</option>
                  {templates.filter((template) => template.category === documentCategory(dialog.document_type)).map((template) => (
                    <option key={template.template_id} value={template.template_id}>{template.template_name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <CleanLabel>الموظف</CleanLabel>
                <select value={dialog.employee_id} onChange={(e) => {
                  const nextId = e.target.value;
                  const selected = employees.find((item) => item.employee_id === nextId || item.id === nextId);
                  setDialogField("employee_id", nextId);
                  setDialogField("employee_name", selected?.name || "");
                  setDialogField("branch", selected?.branch || "");
                  setDialogField("department", selected?.department || selected?.administration || "");
                  setDialogField("job_title", selected?.job_title || selected?.job || "");
                  setDialogField("salary", selected?.salary || "");
                  setDialogField("hire_date", selected?.hire_date || "");
                  setDialogField("phone", selected?.phone || "");
                }} className="field w-full">
                  <option value="">اختر موظفاً</option>
                  {employeesOptions.map((employee) => (
                    <option key={employee.key} value={employee.key}>{employee.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <CleanLabel>رقم الخطاب</CleanLabel>
                <input value={dialog.document_no || ""} onChange={(e) => setDialogField("document_no", e.target.value)} className="field w-full" />
              </label>
              <label className="block">
                <CleanLabel>التاريخ</CleanLabel>
                <input type="date" value={dialog.document_date || today()} onChange={(e) => setDialogField("document_date", e.target.value)} className="field w-full" />
              </label>
              <label className="block">
                <CleanLabel>الموضوع</CleanLabel>
                <input value={dialog.subject || computedSubject} onChange={(e) => setDialogField("subject", e.target.value)} className="field w-full" placeholder={computedSubject} />
              </label>
              <label className="block">
                <CleanLabel>السبب</CleanLabel>
                <input value={dialog.reason || ""} onChange={(e) => setDialogField("reason", e.target.value)} className="field w-full" placeholder="سبب الطلب أو الخطاب" />
              </label>
              <label className="block">
                <CleanLabel>المبلغ</CleanLabel>
                <input type="number" value={dialog.amount || ""} onChange={(e) => setDialogField("amount", e.target.value)} className="field w-full" placeholder="0" />
              </label>
              <label className="block">
                <CleanLabel>من تاريخ</CleanLabel>
                <input type="date" value={dialog.leave_start_date || ""} onChange={(e) => setDialogField("leave_start_date", e.target.value)} className="field w-full" />
              </label>
              <label className="block">
                <CleanLabel>إلى تاريخ</CleanLabel>
                <input type="date" value={dialog.leave_end_date || ""} onChange={(e) => setDialogField("leave_end_date", e.target.value)} className="field w-full" />
              </label>
              <label className="block lg:col-span-2">
                <CleanLabel>ملاحظات</CleanLabel>
                <textarea value={dialog.notes || ""} onChange={(e) => setDialogField("notes", e.target.value)} className="field h-24 w-full" />
              </label>
              <label className="block lg:col-span-2">
                <CleanLabel>نص الخطاب النهائي</CleanLabel>
                <textarea value={dialog.body || computedBody} onChange={(e) => setDialogField("body", e.target.value)} className="field h-48 w-full" />
              </label>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button type="button" disabled={!canExport} onClick={() => dialog && printDocument({ ...dialog, subject: dialog.subject || computedSubject, body: dialog.body || computedBody })} className="btn-secondary w-full"><Printer size={18} /> معاينة / طباعة</button>
              <button type="button" disabled={!canExport} onClick={() => dialog && exportWord({ ...dialog, subject: dialog.subject || computedSubject, body: dialog.body || computedBody })} className="btn-secondary w-full"><FileText size={18} /> تصدير Word</button>
              <button type="button" disabled={!canExport} onClick={() => dialog && exportPdf({ ...dialog, subject: dialog.subject || computedSubject, body: dialog.body || computedBody })} className="btn-secondary w-full"><FileSpreadsheet size={18} /> تصدير PDF</button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              {dialog.document_id && canDelete && <button type="button" onClick={() => deleteDocument(dialog)} className="btn-secondary">حذف</button>}
              <button type="button" onClick={() => saveDocument("draft")} disabled={saving} className="btn-primary">حفظ كمسودة</button>
              <button type="button" onClick={() => saveDocument("approve")} disabled={saving || !canApprove} className="btn-secondary">اعتماد</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
