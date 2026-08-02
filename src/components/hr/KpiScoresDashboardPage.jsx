import React, { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Download, Eye, FileSpreadsheet, Gauge, Printer, RefreshCw, Star, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import OfficialReportLayout from "../common/OfficialReportLayout";
import { buildOfficialReportHtml, exportWordHtml, printHtml } from "../../services/reportExport";
import { kpiCalculationService } from "../../services/kpiCalculation";
import { classifyOperationType, kpiScoresService } from "../../services/kpiScores";
import { operationTypes } from "../../services/dailyOperations";

const todayMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const toneClass = {
  emerald: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  cyan: "bg-cyan-50 text-cyan-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-600",
};

const tabs = ["الملخص التنفيذي", "ترتيب الموظفين", "أفضل 10 موظفين", "تفاصيل المعايير", "تحليل العمليات", "التقارير والطباعة"];
const n = (value) => Number(value || 0) || 0;
const scoreText = (value) => value === null || value === undefined ? "غير محسوب" : `${Number(value).toFixed(2)}%`;
const plainScore = (value) => value === null || value === undefined ? "غير محسوب" : Number(value).toFixed(2);

function Mini({ label, value, icon: Icon = Gauge }) {
  return <div className="panel p-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Icon size={19} /></span><div><p className="text-xs font-bold text-slate-500">{label}</p><b className="mt-1 block text-xl text-slate-900">{value}</b></div></div></div>;
}

function BarList({ title, rows = [], valueKey = "final_score", max = 100 }) {
  return (
    <div className="panel p-5">
      <h3 className="mb-4 font-black">{title}</h3>
      <div className="space-y-3">
        {rows.length ? rows.map((row, index) => {
          const value = valueKey === "total_operations" ? n(row.operations?.total_operations) : n(row[valueKey]);
          const width = valueKey === "final_score" ? Math.min(100, n(row.final_kpi_score ?? row.final_score)) : Math.min(100, max ? (value / max) * 100 : value);
          return <div key={`${row.employee_id}-${index}`}><div className="mb-1 flex justify-between text-xs font-bold text-slate-600"><span>{index + 1}. {row.employee_name}</span><span>{valueKey === "final_score" ? scoreText(row.final_kpi_score ?? row.final_score) : value}</span></div><div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-brand-700" style={{ width: `${width}%` }} /></div><p className="mt-1 text-[11px] text-slate-500">درجة KPI النهائية: {scoreText(row.final_kpi_score ?? row.final_score)} • نسبة الإنجاز: {Number(row.achievement_percentage || 0).toFixed(2)}%</p><p className="mt-1 text-[11px] text-slate-400">العمليات: {row.total_operations ?? row.operations?.total_operations ?? 0} • الهدف: {row.target_operations || 0} <span className="mx-1">|</span> الحالة: {row.achievement_percentage > 100 ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-700">متجاوز الهدف</span> : "ضمن الهدف"} • {row.branches?.length ? row.branches.join("، ") : row.branch} • {row.job || row.job_name}</p></div>;
        }) : <p className="text-sm text-slate-400">لا توجد بيانات تقييم ضمن الفترة المحددة.</p>}
      </div>
    </div>
  );
}

function EmployeeReportModal({ report, company, currentUser, month, close }) {
  const ref = useRef(null);
  if (!report) return null;
  const operationRows = [...(report.operations?.byType || new Map()).entries()].map(([operation_type, operation_count]) => ({
    operation_type,
    operation_count,
    percentage: report.operations?.total_operations ? `${((operation_count / report.operations.total_operations) * 100).toFixed(1)}%` : "0%",
  }));
  const dailyRows = [...(report.operations?.daily || new Map()).values()];
  const branchRows = [...(report.operations?.byBranch || new Map()).entries()].map(([branch, operation_count]) => ({ branch, operation_count }));
  const originalIdRows = [...(report.operations?.byOriginalEmployeeId || new Map()).entries()].map(([employee_id, operation_count]) => ({ employee_id, operation_count }));
  const summary = [
    { label: "درجة KPI النهائية", value: scoreText(report.final_score) },
    { label: "مصدر الاحتساب", value: report.calculation_source },
    { label: "التقدير", value: report.performance_label },
    { label: "إجمالي العمليات", value: report.operations?.total_operations || 0 },
    { label: "هدف الإنتاجية", value: report.target_operations || 0 },
    { label: "نسبة الإنجاز", value: `${report.achievement_percentage || 0}%` },
    { label: "درجة الإنتاجية", value: scoreText(report.productivity_score) },
    { label: "درجة التقييم اليدوي", value: scoreText(report.manual_score) },
    { label: "قبض", value: report.operations?.receipt_operations || 0 },
    { label: "صرف", value: report.operations?.payment_operations || 0 },
    { label: "بيع", value: report.operations?.sale_operations || 0 },
    { label: "شراء", value: report.operations?.purchase_operations || 0 },
    { label: "الأرقام المرتبطة / البديلة", value: report.linked_employee_ids?.length ? report.linked_employee_ids.join("، ") : report.employee_id },
    { label: "إجمالي العمليات بعد الدمج", value: report.operations?.total_operations || 0 },
    { label: "ترتيب الموظف", value: report.rank || "—" },
    { label: "متوسط الفريق", value: scoreText(report.peer_average) },
    { label: "مقارنة بالمتوسط", value: report.comparison_to_average === null ? "غير محسوب" : `${report.comparison_to_average > 0 ? "+" : ""}${report.comparison_to_average}%` },
  ];
  const print = () => {
    const html = buildOfficialReportHtml({
      title: "تقرير تقييم أداء الموظف",
      company,
      generatedBy: currentUser?.username,
      period: month,
      filters: [`الموظف: ${report.employee_name}`, `الرقم: ${report.employee_id}`, `الفرع: ${report.branch}`, `الوظيفة: ${report.job_name}`],
      summary,
      columns: [
        { key: "criterion_name", label: "المعيار" },
        { key: "target_value", label: "المستهدف" },
        { key: "actual_value", label: "القيمة" },
        { key: "score", label: "الدرجة" },
        { key: "weighted_score", label: "النتيجة" },
        { key: "notes", label: "ملاحظات" },
      ],
      rows: report.criteria || [],
      logoUrl: company?.logo_url,
    });
    printHtml(html);
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4" dir="rtl">
      <div ref={ref} className="mx-auto max-w-6xl space-y-5 rounded-[2rem] bg-slate-100 p-4">
        <div className="no-print flex flex-wrap justify-end gap-2">
          <button onClick={print} className="btn-primary"><Printer size={17} /> طباعة التقرير</button>
          <button onClick={() => kpiScoresService.exportEmployeeKpiReportExcel(report)} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button>
          <button onClick={close} className="btn-secondary">إغلاق</button>
        </div>
        <OfficialReportLayout title="تقرير تقييم أداء الموظف" company={company} period={month} generatedBy={currentUser?.username} filters={[`الموظف: ${report.employee_name}`, `الرقم الوظيفي الرسمي: ${report.employee_id}`, `الأرقام المرتبطة / البديلة: ${report.linked_employee_ids?.length ? report.linked_employee_ids.join("، ") : report.employee_id}`, `الوظيفة: ${report.job_name}`, `الفرع: ${report.branch}`, `الإدارة: ${report.department || "—"}`]} summary={summary}>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <h3 className="font-black">مؤشر درجة KPI</h3>
              <div className="mt-4 h-5 rounded-full bg-slate-200"><div className="h-5 rounded-full bg-brand-700" style={{ width: `${Math.min(100, n(report.final_score))}%` }} /></div>
              <p className="mt-2 text-sm font-bold text-slate-600">{scoreText(report.final_score)} • {report.performance_label}</p>
              <p className="mt-2 rounded-2xl bg-white p-3 text-xs font-bold text-slate-600">{report.calculation_source}: {report.calculation_reason}</p>
              <p className="mt-2 text-xs font-extrabold text-amber-700">قيد المراجعة لا تدخل في KPI حتى يتم اعتمادها.</p>
              <p className="mt-2 text-xs font-extrabold text-blue-700">تم دمج الأرقام الوظيفية المرتبطة لهذا الموظف لأغراض KPI والتقارير.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <h3 className="font-black">توزيع العمليات</h3>
              {["receipt_operations", "payment_operations", "sale_operations", "purchase_operations"].map((key) => <div key={key} className="mt-2"><div className="flex justify-between text-xs font-bold"><span>{key === "receipt_operations" ? "قبض" : key === "payment_operations" ? "صرف" : key === "sale_operations" ? "بيع" : "شراء"}</span><span>{report.operations?.[key] || 0}</span></div><div className="h-2 rounded-full bg-white"><div className="h-2 rounded-full bg-brand-700" style={{ width: `${report.operations?.total_operations ? ((report.operations?.[key] || 0) / report.operations.total_operations) * 100 : 0}%` }} /></div></div>)}
            </div>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="overflow-x-auto rounded-3xl border"><table className="w-full text-sm"><thead><tr><th>المعيار</th><th>المستهدف</th><th>القيمة</th><th>الدرجة</th><th>النتيجة</th><th>ملاحظات</th></tr></thead><tbody>{report.criteria?.length ? report.criteria.map((row) => <tr key={row.score_id}><td>{row.criterion_name}</td><td>{row.target_value}</td><td>{row.actual_value}</td><td>{row.score}</td><td>{Number(row.weighted_score || 0).toFixed(2)}</td><td>{row.notes}</td></tr>) : <tr><td colSpan={6} className="py-6 text-center text-slate-400">لا توجد بيانات تقييم ضمن الفترة المحددة.</td></tr>}</tbody></table></div>
            <div className="overflow-x-auto rounded-3xl border"><table className="w-full text-sm"><thead><tr><th>نوع العملية</th><th>عدد العمليات</th><th>النسبة</th></tr></thead><tbody>{operationRows.length ? operationRows.map((row) => <tr key={row.operation_type}><td>{row.operation_type}</td><td>{row.operation_count}</td><td>{row.percentage}</td></tr>) : <tr><td colSpan={3} className="py-6 text-center text-slate-400">لا توجد عمليات معتمدة لهذا الموظف ضمن الفترة.</td></tr>}</tbody></table></div>
          </div>
          <div className="mt-5 overflow-x-auto rounded-3xl border"><table className="w-full text-sm"><thead><tr><th>الرقم الوظيفي الأصلي</th><th>عدد العمليات</th></tr></thead><tbody>{originalIdRows.length ? originalIdRows.map((row) => <tr key={row.employee_id}><td>{row.employee_id}</td><td>{row.operation_count}</td></tr>) : <tr><td colSpan={2} className="py-6 text-center text-slate-400">لا توجد أرقام مرتبطة لهذا الموظف.</td></tr>}</tbody></table></div>
          <div className="mt-5 overflow-x-auto rounded-3xl border"><table className="w-full text-sm"><thead><tr><th>الفرع</th><th>عدد العمليات</th></tr></thead><tbody>{branchRows.length ? branchRows.map((row) => <tr key={row.branch}><td>{row.branch}</td><td>{row.operation_count}</td></tr>) : <tr><td colSpan={2} className="py-6 text-center text-slate-400">لا توجد بيانات توزيع حسب الفرع.</td></tr>}</tbody></table></div>
          <div className="mt-5 overflow-x-auto rounded-3xl border"><table className="w-full text-sm"><thead><tr><th>التاريخ</th><th>إجمالي العمليات</th><th>قبض</th><th>صرف</th><th>بيع</th><th>شراء</th></tr></thead><tbody>{dailyRows.length ? dailyRows.map((row) => <tr key={row.operation_date}><td>{row.operation_date}</td><td>{row.total_operations}</td><td>{row.receipt_operations}</td><td>{row.payment_operations}</td><td>{row.sale_operations}</td><td>{row.purchase_operations}</td></tr>) : <tr><td colSpan={6} className="py-6 text-center text-slate-400">لا توجد بيانات أداء يومي.</td></tr>}</tbody></table></div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-emerald-50 p-4"><b>نقاط القوة</b><p className="mt-2 text-sm">{report.strengths}</p></div>
            <div className="rounded-3xl bg-amber-50 p-4"><b>نقاط تحتاج تحسين</b><p className="mt-2 text-sm">{report.final_score !== null && report.final_score < 70 ? "تحسين مؤشرات الأداء والالتزام بالمستهدفات" : "المحافظة على مستوى الأداء"}</p></div>
            <div className="rounded-3xl bg-blue-50 p-4"><b>توصية إدارية</b><p className="mt-2 text-sm">{report.final_score === null ? "إعادة احتساب KPI للموظف" : report.final_score >= 80 ? "الترشيح للتحفيز حسب السياسة" : "متابعة خطة تحسين عند الحاجة"}</p></div>
          </div>
        </OfficialReportLayout>
      </div>
    </div>
  );
}

export default function KpiScoresDashboardPage({ employees = [], currentCompany, currentUser }) {
  const companyId = currentCompany?.company_id || currentUser?.company_id || "";
  const [tab, setTab] = useState("الملخص التنفيذي");
  const [filters, setFilters] = useState({ month: todayMonth(), fromDate: "", toDate: "", branch: "all", job: "all", employeeId: "", department: "all", operationType: "all", approvedOnly: true, includedInKpiOnly: true });
  const [data, setData] = useState({ ranking: [], kpiRows: [], operationsRows: [] });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const branchOptions = useMemo(() => [...new Set([...(data.operationsRows || []).map((row) => row.branch), ...(employees || []).map((employee) => employee.branch)].filter(Boolean))], [data.operationsRows, employees]);
  const jobOptions = useMemo(() => [...new Set((employees || []).map((employee) => employee.job || employee.job_name).filter(Boolean))], [employees]);
  const departmentOptions = useMemo(() => [...new Set((employees || []).map((employee) => employee.department).filter(Boolean))], [employees]);

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      setData(await kpiScoresService.loadKpiScores(companyId, filters, employees));
    } catch (error) {
      console.error("KPI scores dashboard error:", error);
      alert(error.message || "تعذر تحميل درجات KPI");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [companyId, filters.month, filters.fromDate, filters.toDate, filters.branch, filters.job, filters.employeeId, filters.department, filters.operationType]);

  const ranking = data.ranking || [];
  const withScores = ranking.filter((row) => Number.isFinite(Number(row.final_kpi_score ?? row.final_score)));
  const avgScore = withScores.length ? Math.min(100, withScores.reduce((sum, row) => sum + n(row.final_kpi_score ?? row.final_score), 0) / withScores.length) : 0;
  const topByScore = [...withScores].sort((a, b) => n(b.final_kpi_score ?? b.final_score) - n(a.final_kpi_score ?? a.final_score) || n(b.achievement_percentage) - n(a.achievement_percentage) || n(b.total_operations ?? b.operations?.total_operations) - n(a.total_operations ?? a.operations?.total_operations)).slice(0, 10);
  const cappedCount = withScores.filter((row) => n(row.final_kpi_score ?? row.final_score) === 100).length;
  const shouldReviewTargets = withScores.length > 0 && cappedCount / withScores.length > 0.5;
  const topByOperations = [...ranking].sort((a, b) => n(b.operations?.total_operations) - n(a.operations?.total_operations)).slice(0, 10);
  const totalOps = data.operationsRows.reduce((sum, row) => sum + n(row.operation_count), 0);
  const opsTotals = data.operationsRows.reduce((acc, row) => {
    const kind = classifyOperationType(row.operation_type);
    acc[kind] = (acc[kind] || 0) + n(row.operation_count);
    return acc;
  }, {});
  const summaryCards = [
    ["عدد الموظفين المقيمين", withScores.length, BadgeCheck],
    ["متوسط درجة KPI", `${avgScore.toFixed(2)}%`, Gauge],
    ["أعلى درجة", scoreText(Math.min(100, n(topByScore[0]?.final_kpi_score ?? topByScore[0]?.final_score))), Star],
    ["أقل درجة", scoreText(withScores.length ? Math.max(0, Math.min(...withScores.map((row) => n(row.final_kpi_score ?? row.final_score)))) : null), TrendingUp],
    ["عدد الموظفين المميزين", withScores.filter((r) => n(r.final_kpi_score ?? r.final_score) >= 90).length, Star],
    ["عدد الجيدين", withScores.filter((r) => n(r.final_kpi_score ?? r.final_score) >= 70 && n(r.final_kpi_score ?? r.final_score) < 90).length, BadgeCheck],
    ["عدد منخفضي الأداء", withScores.filter((r) => n(r.final_kpi_score ?? r.final_score) < 60).length, TrendingUp],
    ["إجمالي العمليات الداخلة في KPI", totalOps, Gauge],
    ["إجمالي عمليات القبض", opsTotals.receipt || 0, Gauge],
    ["إجمالي عمليات الصرف", opsTotals.payment || 0, Gauge],
    ["إجمالي عمليات البيع", opsTotals.sale || 0, Gauge],
    ["إجمالي عمليات الشراء", opsTotals.purchase || 0, Gauge],
  ];

  const openReport = async (row) => setReport(await kpiScoresService.loadEmployeeKpiDetails(companyId, row.employee_id, filters, employees));
  const exportRanking = () => kpiScoresService.exportKpiRankingExcel(ranking, data.kpiRows);

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-black">درجات KPI</h1><p className="text-sm text-slate-500">درجة KPI تمثل تقييم الأداء حسب المعايير المعتمدة. عدد العمليات يحتسب من العمليات المعتمدة الداخلة في KPI فقط.</p></div>
        <button onClick={() => kpiCalculationService.recalculateMonthKpis(employees, filters.month, companyId).then(() => load()).catch((error) => alert(error.message))} className="btn-primary"><RefreshCw size={17} /> إعادة احتساب الأداء من العمليات المعتمدة</button>
      </div>
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-extrabold text-blue-800">توجد عمليات معتمدة جديدة قد تحتاج إلى إعادة احتساب الأداء. تم اعتماد العمليات، ويمكن الآن تحديث نتائج الأداء والحوافز.</div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-extrabold text-amber-800">قيد المراجعة لا تدخل في KPI حتى يتم اعتمادها.</div>
      <div className="panel grid gap-3 p-4 md:grid-cols-4 xl:grid-cols-8">
        <input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value, fromDate: "", toDate: "" })} className="field" />
        <input type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value, month: "" })} className="field" />
        <input type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value, month: "" })} className="field" />
        <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field"><option value="all">كل الفروع</option>{branchOptions.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={filters.job} onChange={(e) => setFilters({ ...filters, job: e.target.value })} className="field"><option value="all">كل الوظائف</option>{jobOptions.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={filters.employeeId} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })} className="field"><option value="">كل الموظفين</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
        <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="field"><option value="all">كل الإدارات</option>{departmentOptions.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={filters.operationType} onChange={(e) => setFilters({ ...filters, operationType: e.target.value })} className="field"><option value="all">كل العمليات</option>{operationTypes.map((x) => <option key={x}>{x}</option>)}</select>
      </div>
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-extrabold text-blue-800">يتم احتساب عدد العمليات من العمليات المعتمدة الداخلة في KPI فقط، ويتم دمج الأرقام الوظيفية المرتبطة عند احتساب KPI حتى لا يظهر الموظف مكررًا.</div>
      <div className="panel flex flex-wrap gap-2 p-3">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-2xl px-4 py-2 text-sm font-extrabold ${tab === item ? "bg-brand-700 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{item}</button>)}</div>
      {loading && <div className="panel p-8 text-center font-bold text-slate-500">جاري تحميل درجات KPI...</div>}
      {tab === "الملخص التنفيذي" && <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">{summaryCards.map(([label, value, Icon]) => <Mini key={label} label={label} value={value} icon={Icon} />)}</div>}
      {tab === "ترتيب الموظفين" && <div className="panel overflow-x-auto p-4"><table className="w-full text-sm"><thead><tr>{["الترتيب", "الموظف", "الرقم الوظيفي", "الوظيفة", "الفروع", "إجمالي العمليات", "قبض", "صرف", "بيع", "شراء", "الهدف", "نسبة الإنجاز", "درجة الإنتاجية", "درجة التقييم اليدوي", "درجة KPI النهائية", "مصدر الاحتساب", "التقدير", "نقاط القوة", "ملاحظات", "إجراء"].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{ranking.length ? ranking.map((row) => <tr key={row.employee_id}><td>{row.rank}</td><td><button onClick={() => openReport(row)} className="font-extrabold text-brand-700">{row.employee_name}</button></td><td>{row.employee_id}</td><td>{row.job_name}</td><td>{row.branches?.length ? row.branches.join("، ") : row.branch}</td><td>{row.operations?.total_operations || 0}</td><td>{row.operations?.receipt_operations || 0}</td><td>{row.operations?.payment_operations || 0}</td><td>{row.operations?.sale_operations || 0}</td><td>{row.operations?.purchase_operations || 0}</td><td>{row.target_operations}</td><td>{row.achievement_percentage}%</td><td>{plainScore(row.productivity_score)}</td><td>{plainScore(row.manual_score)}</td><td>{scoreText(row.final_score)}</td><td><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{row.calculation_source}</span></td><td><span className={`rounded-full px-3 py-1 text-xs font-bold ${toneClass[row.performance_tone]}`}>{row.performance_label}</span></td><td>{row.strengths}</td><td>{row.notes}</td><td><button onClick={() => openReport(row)} className="btn-secondary !h-8"><Eye size={15} /> عرض التقرير</button></td></tr>) : <tr><td colSpan={20} className="py-8 text-center text-slate-400">لا توجد بيانات تقييم ضمن الفترة المحددة.</td></tr>}</tbody></table></div>}
      {tab === "أفضل 10 موظفين" && <div className="space-y-4"><div className="rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-800">عند تساوي درجة KPI النهائية، يتم ترتيب الموظفين حسب نسبة الإنجاز ثم إجمالي العمليات.</div>{shouldReviewTargets && <div className="rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-800">يبدو أن المستهدف الحالي منخفض مقارنة بالإنتاج الفعلي، يوصى بمراجعة مستهدفات الوظائف والفروع.</div>}<div className="grid gap-5 xl:grid-cols-2"><BarList title="أفضل 10 موظفين حسب KPI والإنتاجية" rows={topByScore} valueKey="final_score" /><BarList title="أفضل 10 موظفين حسب عدد العمليات" rows={topByOperations} valueKey="total_operations" max={Math.max(1, topByOperations[0]?.operations?.total_operations || 1)} /></div></div>}
      {tab === "تفاصيل المعايير" && <div className="panel overflow-x-auto p-4"><table className="w-full text-sm"><thead><tr>{["الموظف", "الوظيفة", "المعيار", "القيمة", "المستهدف", "الدرجة", "الموزونة", "ملاحظات"].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{data.kpiRows.length ? data.kpiRows.map((row) => <tr key={row.score_id}><td>{row.employee_name}</td><td>{row.job_name}</td><td>{row.criterion_name}</td><td>{row.actual_value}</td><td>{row.target_value}</td><td>{row.score}</td><td>{row.weighted_score.toFixed(2)}</td><td>{row.notes}</td></tr>) : <tr><td colSpan={8} className="py-8 text-center text-slate-400">لا توجد بيانات تقييم ضمن الفترة المحددة.</td></tr>}</tbody></table></div>}
      {tab === "تحليل العمليات" && <div className="grid gap-5 xl:grid-cols-2"><div className="panel p-5"><h3 className="mb-3 font-black">تحليل العمليات الداخلة في KPI</h3><ResponsiveContainer width="100%" height={280}><BarChart data={[{ name: "قبض", value: opsTotals.receipt || 0 }, { name: "صرف", value: opsTotals.payment || 0 }, { name: "بيع", value: opsTotals.sale || 0 }, { name: "شراء", value: opsTotals.purchase || 0 }]}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#7f1d1d" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="panel p-5"><h3 className="mb-3 font-black">شرح الاحتساب</h3><p className="text-sm leading-8 text-slate-600">عدد العمليات يحتسب من جدول العمليات اليومية فقط عندما تكون الحالة "معتمد" وداخل KPI مفعلة. العمليات قيد المراجعة أو المسودة أو المرفوضة أو الملغية لا تدخل في المؤشر.</p></div></div>}
      {tab === "التقارير والطباعة" && <div className="grid gap-4 md:grid-cols-3"><button onClick={() => exportRanking()} className="btn-secondary"><Download size={17} /> تصدير بيانات KPI</button><button onClick={() => exportWordHtml(buildOfficialReportHtml({ title: "تقرير درجات KPI", company: currentCompany, generatedBy: currentUser?.username, period: filters.month, summary: summaryCards.map(([label, value]) => ({ label, value })), columns: [{ key: "rank", label: "الترتيب" }, { key: "employee_name", label: "الموظف" }, { key: "final_score", label: "درجة KPI" }, { key: "performance_label", label: "التقدير" }], rows: ranking }), "kpi-report.doc")} className="btn-secondary">Word</button><button onClick={() => printHtml(buildOfficialReportHtml({ title: "تقرير درجات KPI", company: currentCompany, generatedBy: currentUser?.username, period: filters.month, summary: summaryCards.map(([label, value]) => ({ label, value })), columns: [{ key: "rank", label: "الترتيب" }, { key: "employee_name", label: "الموظف" }, { key: "final_score", label: "درجة KPI" }, { key: "performance_label", label: "التقدير" }], rows: ranking }))} className="btn-primary"><Printer size={17} /> طباعة</button></div>}
      {report && <EmployeeReportModal report={report} company={currentCompany} currentUser={currentUser} month={filters.month || `${filters.fromDate} إلى ${filters.toDate}`} close={() => setReport(null)} />}
    </div>
  );
}
