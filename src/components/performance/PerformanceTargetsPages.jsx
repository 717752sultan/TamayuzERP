import React, { useEffect, useState } from "react";
import { performanceTargetsService as api } from "../../services/performanceTargets";

const defaultForm = {
  period_month: new Date().getMonth() + 1,
  period_year: new Date().getFullYear(),
  target_count: "",
  minimum_count: "",
  excellent_count: "",
  target_weight: "100",
  is_active: true,
};

function Field({ fieldKey, label, type = "text", form, setForm }) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        className="field mt-1"
        type={type}
        value={form?.[fieldKey] ?? ""}
        onChange={(event) => {
          const value = event.target.value;
          setForm((previous) => ({ ...previous, [fieldKey]: value }));
        }}
      />
    </label>
  );
}

function TargetsPage({ kind, employees = [], currentCompany }) {
  const isEmployee = kind === "employee";
  const companyId = currentCompany?.company_id || currentCompany?.id || "";
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("");

  const load = () => {
    if (!companyId) return;
    const request = isEmployee ? api.loadEmployeeTargets(companyId) : api.loadBranchTargets(companyId);
    request
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Performance targets page load error:", error);
        setRows([]);
        setMessage("تعذر تحميل البيانات، يرجى مراجعة الإعدادات أو الاتصال.");
      });
  };

  useEffect(load, [companyId, kind]);

  const save = async () => {
    try {
      if (isEmployee && !form.employee_id) throw new Error("الموظف مطلوب");
      if (!isEmployee && !form.branch) throw new Error("الفرع مطلوب");
      await (isEmployee ? api.saveEmployeeTarget({ ...form, company_id: companyId }) : api.saveBranchTarget({ ...form, company_id: companyId }));
      setMessage("تم الحفظ بنجاح.");
      setForm({ ...defaultForm });
      load();
    } catch (error) {
      console.error("Performance target save error:", error);
      setMessage(error.message || "تعذر حفظ البيانات.");
    }
  };

  const remove = async (row) => {
    try {
      await (isEmployee ? api.deleteEmployeeTarget(row.target_id, companyId) : api.deleteBranchTarget(row.branch_target_id, companyId));
      load();
    } catch (error) {
      console.error("Performance target delete error:", error);
      setMessage(error.message || "تعذر حذف البيانات.");
    }
  };


  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-black">{isEmployee ? "أهداف الشهر" : "أهداف الفروع"}</h1>
        {isEmployee && <p className="text-sm text-slate-500">{new Set(rows.map((row) => row.employee_id)).size} / {employees.filter((employee) => employee.active !== false).length}</p>}
      </div>
      {message && <div className="rounded-xl bg-slate-100 p-3 font-bold">{message}</div>}
      <div className="panel grid gap-3 p-5 md:grid-cols-4">
        <Field form={form} setForm={setForm} fieldKey="period_month" label="الشهر" type="number" />
        <Field form={form} setForm={setForm} fieldKey="period_year" label="السنة" type="number" />
        {isEmployee ? (
          <label className="text-sm font-bold">
            الموظف
            <select className="field mt-1" value={form.employee_id || ""} onChange={(event) => {
              const employee = employees.find((item) => String(item.id) === event.target.value);
              setForm((previous) => ({ ...previous, employee_id: event.target.value, employee_name: employee?.name || "", branch: employee?.branch || "", department: employee?.department || "", job_title: employee?.job || employee?.job_name || "" }));
            }}>
              <option value="">--</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
            </select>
          </label>
        ) : <Field form={form} setForm={setForm} fieldKey="branch" label="الفرع" />}
        <Field form={form} setForm={setForm} fieldKey="operation_type" label="نوع العملية" />
        <Field form={form} setForm={setForm} fieldKey="service_channel" label="القناة" />
        <Field form={form} setForm={setForm} fieldKey="target_count" label="المستهدف" type="number" />
        <Field form={form} setForm={setForm} fieldKey="minimum_count" label="الحد الأدنى" type="number" />
        <Field form={form} setForm={setForm} fieldKey="excellent_count" label="الممتاز" type="number" />
        {isEmployee && <Field form={form} setForm={setForm} fieldKey="target_weight" label="الوزن" type="number" />}
        <button type="button" onClick={save} className="btn-primary">حفظ</button>
      </div>
      <div className="panel overflow-x-auto p-4">
        <table>
          <thead><tr><th>{isEmployee ? "الموظف" : "الفرع"}</th><th>الفترة</th><th>المستهدف</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={row.target_id || row.branch_target_id}>
                <td>{isEmployee ? row.employee_name : row.branch}</td>
                <td>{row.period_month}/{row.period_year}</td>
                <td>{row.target_count}</td>
                <td>{row.is_active === false ? "معطل" : "نشط"}</td>
                <td><button type="button" onClick={() => setForm({ ...defaultForm, ...row, period_month: String(row.period_month ?? ""), period_year: String(row.period_year ?? ""), target_count: String(row.target_count ?? ""), minimum_count: String(row.minimum_count ?? ""), excellent_count: String(row.excellent_count ?? ""), target_weight: String(row.target_weight ?? "100") })} className="btn-secondary">تعديل</button> <button type="button" onClick={() => remove(row)} className="text-red-700">حذف</button></td>
              </tr>
            )) : <tr><td colSpan="5" className="py-8 text-center text-slate-400">لا توجد بيانات محفوظة بعد</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const MonthlyEmployeeTargetsPage = (props) => <TargetsPage {...props} kind="employee" />;
export const BranchTargetsPage = (props) => <TargetsPage {...props} kind="branch" />;
export { default as AttendanceKpiRulesPage } from "./AttendanceKpiRulesPage";
export { default as IncentiveExclusionsPage } from "./IncentiveExclusionsPage";
export { default as IncentiveProposalPage } from "./IncentiveProposalPage";
export { default as PerformanceProcessGuidePage } from "./PerformanceProcessGuidePage";
