import React, { useEffect, useState } from "react";
import { incentiveControlsService as api } from "../../services/incentiveControls";

export default function IncentiveExclusionsPage({ employees = [], currentCompany }) {
  const companyId = currentCompany?.company_id || currentCompany?.id || "";
  const defaultForm = { period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), action_type: "exclude", approval_status: "pending" };
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("");

  const load = () => {
    if (!companyId) return;
    api.loadIncentiveExclusions(companyId)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Incentive exclusions page load error:", error);
        setRows([]);
        setMessage("تعذر تحميل البيانات، يرجى مراجعة الإعدادات أو الاتصال.");
      });
  };

  useEffect(load, [companyId]);

  const save = async () => {
    try {
      await api.saveIncentiveExclusion({ ...form, company_id: companyId });
      setForm(defaultForm);
      setMessage("تم حفظ استثناء الحافز بنجاح.");
      load();
    } catch (error) {
      console.error("Incentive exclusion save error:", error);
      setMessage(error.message || "تعذر حفظ البيانات.");
    }
  };

  const remove = async (row) => {
    try {
      await api.deleteIncentiveExclusion(row.exclusion_id, companyId);
      load();
    } catch (error) {
      console.error("Incentive exclusion delete error:", error);
      setMessage(error.message || "تعذر حذف البيانات.");
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <h1 className="text-2xl font-black">استثناءات الحوافز</h1>
      {message && <div className="rounded-xl bg-slate-100 p-3 font-bold">{message}</div>}
      <div className="panel grid gap-3 p-5 md:grid-cols-3">
        <input className="field" type="number" value={form.period_month} onChange={(event) => setForm({ ...form, period_month: event.target.valueAsNumber })} placeholder="الشهر" />
        <input className="field" type="number" value={form.period_year} onChange={(event) => setForm({ ...form, period_year: event.target.valueAsNumber })} placeholder="السنة" />
        <select className="field" value={form.employee_id || ""} onChange={(event) => {
          const employee = employees.find((item) => String(item.id) === event.target.value);
          setForm({ ...form, employee_id: event.target.value, employee_name: employee?.name || "", branch: employee?.branch || "", job_title: employee?.job || employee?.job_name || "" });
        }}>
          <option value="">الموظف</option>
          {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
        </select>
        <select className="field" value={form.action_type} onChange={(event) => setForm({ ...form, action_type: event.target.value })}>
          <option value="exclude">استبعاد</option>
          <option value="reduce_percent">تخفيض نسبة</option>
          <option value="fixed_deduction">خصم ثابت</option>
          <option value="manual_adjustment">تعديل يدوي</option>
        </select>
        <input className="field" type="number" placeholder="نسبة التخفيض" value={form.reduction_percent || 0} onChange={(event) => setForm({ ...form, reduction_percent: event.target.valueAsNumber })} />
        <input className="field" type="number" placeholder="مبلغ الخصم" value={form.deduction_amount || 0} onChange={(event) => setForm({ ...form, deduction_amount: event.target.valueAsNumber })} />
        <input className="field" placeholder="السبب" value={form.reason || ""} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
        <button type="button" className="btn-primary" onClick={save}>حفظ</button>
      </div>
      <div className="panel overflow-x-auto p-4">
        <table>
          <thead><tr><th>الموظف</th><th>الفترة</th><th>الإجراء</th><th>السبب</th><th>الحالة</th><th></th></tr></thead>
          <tbody>{rows.length ? rows.map((row) => <tr key={row.exclusion_id}><td>{row.employee_name}</td><td>{row.period_month}/{row.period_year}</td><td>{row.action_type}</td><td>{row.reason}</td><td>{row.approval_status}</td><td><button type="button" onClick={() => setForm(row)} className="btn-secondary">تعديل</button> <button type="button" onClick={() => remove(row)} className="text-red-700">حذف</button></td></tr>) : <tr><td colSpan="6" className="py-8 text-center text-slate-400">لا توجد بيانات محفوظة بعد</td></tr>}</tbody>
        </table>
      </div>
    </div>
  );
}
