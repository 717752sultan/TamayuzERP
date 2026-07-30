import React, { useEffect, useState } from "react";
import { Download, Save, Upload } from "lucide-react";
import { downloadOvertimeTemplate, exportOvertimeRows, parseOvertimeExcel, saveOvertimeImportRows } from "../../services/overtimeImportExport";
import { overtimeService } from "../../services/overtime";

export default function OvertimeImportExportPage({ employees = [], currentUser }) {
  const [rows, setRows] = useState([]);
  const [records, setRecords] = useState([]);
  const [mode, setMode] = useState("update");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const load = async () => {
    const [assignments, assignmentEmployees] = await Promise.all([overtimeService.listAssignments(), overtimeService.listAssignmentEmployees()]);
    setRecords(assignmentEmployees.map((row) => ({ ...(assignments.find((a) => a.assignment_id === row.assignment_id) || {}), ...row })));
  };
  useEffect(() => { load().catch(() => {}); }, []);
  const onFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try { setRows(await parseOvertimeExcel(file, employees)); setMessage("تم تجهيز المعاينة."); }
    catch (error) { console.error("Overtime import error:", error); setMessage("فشل الاستيراد. يرجى مراجعة الملف."); }
    finally { setLoading(false); }
  };
  const save = async () => {
    setLoading(true);
    try {
      const summary = await saveOvertimeImportRows(rows, currentUser, mode);
      await load();
      setMessage(`تم الاستيراد بنجاح. الإجمالي: ${summary.totalRows}، صحيحة: ${summary.validRows}، خاطئة: ${summary.invalidRows}، محدثة: ${summary.updatedRows}، مضافة: ${summary.insertedRows}`);
    } catch (error) { console.error("Overtime save import error:", error); setMessage("فشل الاستيراد. يرجى مراجعة الملف."); }
    finally { setLoading(false); }
  };
  return (
    <div className="space-y-5" dir="rtl">
      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black">استيراد وتصدير الدوام الإضافي</h1><p className="text-sm text-slate-500">قوالب Excel ومعاينة قبل الحفظ.</p></div><div className="flex gap-2"><button onClick={downloadOvertimeTemplate} className="btn-secondary"><Download size={17} /> قالب Excel</button><button onClick={() => exportOvertimeRows(records)} className="btn-secondary"><Download size={17} /> تصدير السجلات</button></div></div>
        <div className="grid gap-3 md:grid-cols-3"><input type="file" accept=".xlsx,.xls" onChange={onFile} className="field" /><select value={mode} onChange={(e) => setMode(e.target.value)} className="field"><option value="update">تحديث الموجود</option><option value="skip">تخطي المكرر</option><option value="new">إضافة كجديد</option></select><button disabled={loading || !rows.some((r) => r.valid)} onClick={save} className="btn-primary"><Save size={17} /> حفظ المعاينة</button></div>
        {message && <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">{message}</div>}
      </section>
      <section className="panel overflow-x-auto p-5"><table className="w-full text-sm"><thead><tr>{["#", "الموظف", "الفرع", "التاريخ", "من", "إلى", "الساعات", "الحالة", "الأخطاء"].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r) => <tr key={r.rowNumber} className={r.valid ? "" : "bg-red-50"}><td>{r.rowNumber}</td><td>{r.employee_name || r.employee_id}</td><td>{r.branch}</td><td>{r.assignment_date}</td><td>{r.start_time}</td><td>{r.end_time}</td><td>{r.total_hours}</td><td>{r.status}</td><td>{r.errors?.join("، ")}</td></tr>)}</tbody></table></section>
    </div>
  );
}
