import React, { useMemo, useState } from "react";
import { Download, FileText, Printer, RefreshCw } from "lucide-react";
import OfficialReportLayout from "../common/OfficialReportLayout";
import { buildOfficialReportHtml, exportWordHtml, exportWorkbook, printHtml } from "../../services/reportExport";
import { dailyOperationsReportOptions, dailyOperationsReportsService } from "../../services/dailyOperationsReports";

const columns = [
  { key: "operation_date", label: "التاريخ" },
  { key: "branch", label: "الفرع" },
  { key: "department", label: "الإدارة" },
  { key: "employee_name", label: "الموظف" },
  { key: "employee_id", label: "الرقم الرسمي" },
  { key: "original_employee_id", label: "الرقم الأصلي" },
  { key: "operation_type", label: "نوع العملية" },
  { key: "service_channel", label: "القناة" },
  { key: "operation_count", label: "عدد العمليات" },
  { key: "status", label: "الحالة" },
];

const groupColumns = [
  { key: "group", label: "التجميع" },
  { key: "records", label: "عدد السجلات" },
  { key: "receive", label: "قبض" },
  { key: "pay", label: "صرف" },
  { key: "sell", label: "بيع" },
  { key: "buy", label: "شراء" },
  { key: "total", label: "الإجمالي" },
];

export default function DailyOperationsReportsPage({ employees = [], currentCompany, currentUser }) {
  const companyId = currentCompany?.company_id || currentUser?.company_id || "";
  const [filters, setFilters] = useState({ fromDate: "", toDate: "", branch: "الكل", employeeId: "", department: "الكل", operationType: "الكل", status: "الكل", channel: "الكل", approvedOnly: false, includedInKpiOnly: false, groupBy: "all" });
  const [data, setData] = useState({ rows: [], grouped: [], summary: {} });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const branches = useMemo(() => ["الكل", ...new Set(employees.map((e) => e.branch).filter(Boolean))], [employees]);
  const departments = useMemo(() => ["الكل", ...new Set(employees.map((e) => e.department).filter(Boolean))], [employees]);

  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await dailyOperationsReportsService.loadReport(companyId, {
        ...filters,
        branch: filters.branch === "الكل" ? "all" : filters.branch,
        department: filters.department === "الكل" ? "all" : filters.department,
        operationType: filters.operationType === "الكل" ? "all" : filters.operationType,
        status: filters.status === "الكل" ? "all" : filters.status,
        channel: filters.channel === "الكل" ? "all" : filters.channel,
      });
      setData(result);
      if (!result.rows.length) setMessage("لا توجد بيانات ضمن الفترة المحددة.");
    } catch (error) {
      console.error("Daily operations reports error:", error);
      setMessage("تعذر تحميل تقرير العمليات اليومية.");
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = [
    ["إجمالي عمليات القبض", data.summary.receive || 0],
    ["إجمالي عمليات الصرف", data.summary.pay || 0],
    ["إجمالي عمليات البيع", data.summary.sell || 0],
    ["إجمالي عمليات الشراء", data.summary.buy || 0],
    ["إجمالي العمليات الكلي", data.summary.total || 0],
    ["إجمالي العمليات المعتمدة", data.summary.approved || 0],
    ["إجمالي العمليات قيد المراجعة", data.summary.pendingReview || 0],
    ["إجمالي العمليات الداخلة في KPI", data.summary.kpi || 0],
    ["إجمالي العمليات غير الداخلة في KPI", data.summary.notKpi || 0],
    ["عدد السجلات", data.summary.rowsCount || 0],
    ["متوسط العمليات لكل موظف", data.summary.averagePerEmployee || 0],
    ["أعلى موظف إنتاجًا", data.summary.topEmployee || "—"],
    ["أعلى فرع إنتاجًا", data.summary.topBranch || "—"],
  ].map(([label, value]) => ({ label, value }));

  const html = () => buildOfficialReportHtml({
    title: "تقرير العمليات اليومية",
    company: currentCompany,
    generatedBy: currentUser?.username,
    period: `${filters.fromDate || "البداية"} إلى ${filters.toDate || "النهاية"}`,
    filters: Object.entries(filters).map(([k, v]) => `${k}: ${v}`),
    summary: summaryCards,
    columns,
    rows: data.rows,
    logoUrl: currentCompany?.logo_url,
  });

  const exportExcel = () => {
    exportWorkbook([
      { name: "ملخص التقرير", rows: summaryCards },
      { name: "التفاصيل", rows: data.rows },
      { name: "حسب التجميع", rows: data.grouped },
      { name: "حسب الفرع", rows: data.grouped.filter(Boolean) },
      { name: "حسب الموظف", rows: data.rows },
      { name: "الأرقام المرتبطة", rows: data.linkedEmployeeIds || [] },
      { name: "حسب نوع العملية", rows: data.grouped },
    ], "daily-operations-report.xlsx");
    setMessage("تم تصدير التقرير بنجاح.");
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-black">تقارير العمليات اليومية</h1><p className="text-sm text-slate-500">تقرير رسمي للتجميع والتحليل والتصدير.</p></div>
          <div className="flex flex-wrap gap-2">
            <button onClick={load} disabled={loading} className="btn-primary"><RefreshCw size={17} /> توليد التقرير</button>
            <button onClick={exportExcel} disabled={!data.rows.length} className="btn-secondary"><Download size={17} /> Excel</button>
            <button onClick={() => exportWordHtml(html(), "daily-operations-report.doc")} disabled={!data.rows.length} className="btn-secondary"><FileText size={17} /> Word</button>
            <button onClick={() => printHtml(html())} disabled={!data.rows.length} className="btn-secondary"><Printer size={17} /> طباعة</button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <input type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} className="field" />
          <input type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} className="field" />
          <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field">{branches.map((x) => <option key={x}>{x}</option>)}</select>
          <select value={filters.employeeId} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })} className="field"><option value="">كل الموظفين</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
          <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="field">{departments.map((x) => <option key={x}>{x}</option>)}</select>
          <select value={filters.operationType} onChange={(e) => setFilters({ ...filters, operationType: e.target.value })} className="field">{dailyOperationsReportOptions.operationTypes.map((x) => <option key={x}>{x}</option>)}</select>
          <select value={filters.channel} onChange={(e) => setFilters({ ...filters, channel: e.target.value })} className="field">{dailyOperationsReportOptions.channels.map((x) => <option key={x}>{x}</option>)}</select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field">{dailyOperationsReportOptions.statuses.map((x) => <option key={x}>{x}</option>)}</select>
          <select value={filters.groupBy} onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })} className="field">{dailyOperationsReportOptions.groups.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 text-sm font-bold"><input type="checkbox" checked={filters.approvedOnly} onChange={(e) => setFilters({ ...filters, approvedOnly: e.target.checked })} /> معتمد فقط</label>
          <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 text-sm font-bold"><input type="checkbox" checked={filters.includedInKpiOnly} onChange={(e) => setFilters({ ...filters, includedInKpiOnly: e.target.checked })} /> يدخل في KPI فقط</label>
        </div>
        {message && <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{message}</div>}
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm font-extrabold text-blue-800">يمكن عرض التقرير حسب الرقم الرسمي أو الرقم الأصلي، ويتم دمج الأرقام المرتبطة لأغراض التحليل.</div>
      </div>
      <OfficialReportLayout title="تقرير العمليات اليومية" company={currentCompany} generatedBy={currentUser?.username} period={`${filters.fromDate || "البداية"} إلى ${filters.toDate || "النهاية"}`} filters={Object.entries(filters).map(([k, v]) => `${k}: ${v}`)} summary={summaryCards}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>{groupColumns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
            <tbody>{data.grouped.map((row) => <tr key={row.group}>{groupColumns.map((c) => <td key={c.key}>{row[c.key]}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </OfficialReportLayout>
    </div>
  );
}
