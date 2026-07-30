import React, { useState } from "react";
import { employeeAppService } from "../../services/employeeApp";

export const employeeRequestTypes = ["طلب إجازة", "طلب استئذان", "طلب سلفة", "طلب مساعدة", "طلب عهدة", "طلب تعديل حضور", "طلب خطاب HR", "طلب عام"];

export default function NewEmployeeRequestPage({ company, employeeId, go }) {
  const [form, setForm] = useState({ request_type: employeeRequestTypes[0], title: "", description: "", from_date: "", to_date: "", from_time: "", to_time: "" });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const requestId = crypto.randomUUID?.() || `REQ-${Date.now()}`;
    try {
      const attachmentUrl = file ? await employeeAppService.uploadEmployeeRequestAttachment(file, requestId, company.company_id) : "";
      await employeeAppService.createEmployeeRequest({
        ...form,
        request_id: requestId,
        company_id: company.company_id,
        employee_id: employeeId,
        title: form.title || form.request_type,
        attachment_url: attachmentUrl,
        status: "pending",
      });
      setMessage("تم إرسال الطلب بنجاح");
      setTimeout(() => go("/employee/requests"), 600);
    } catch (error) {
      setMessage(error.message || "تعذر إرسال الطلب");
    } finally {
      setSaving(false);
    }
  };
  return <form onSubmit={submit} className="space-y-4 rounded-[2rem] bg-white p-5 shadow-sm"><h2 className="text-xl font-black">طلب جديد</h2>{message && <div className="rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{message}</div>}<label className="block text-sm font-bold">نوع الطلب<select value={form.request_type} onChange={(e) => setForm({ ...form, request_type: e.target.value })} className="field mt-2">{employeeRequestTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label className="block text-sm font-bold">العنوان<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="field mt-2" /></label><label className="block text-sm font-bold">الوصف<textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="field mt-2 !h-28 py-3" /></label><div className="grid gap-3 md:grid-cols-2"><label className="block text-sm font-bold">من تاريخ<input type="date" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} className="field mt-2" /></label><label className="block text-sm font-bold">إلى تاريخ<input type="date" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} className="field mt-2" /></label><label className="block text-sm font-bold">من وقت<input type="time" value={form.from_time} onChange={(e) => setForm({ ...form, from_time: e.target.value })} className="field mt-2" /></label><label className="block text-sm font-bold">إلى وقت<input type="time" value={form.to_time} onChange={(e) => setForm({ ...form, to_time: e.target.value })} className="field mt-2" /></label></div><label className="block text-sm font-bold">مرفق<input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-2 block w-full rounded-2xl border border-slate-200 p-3 text-sm" /></label><div className="flex gap-2"><button disabled={saving} className="btn-primary bg-violet-700">{saving ? "جاري الإرسال..." : "إرسال الطلب"}</button><button type="button" onClick={() => go("/employee/requests")} className="btn-secondary">رجوع</button></div></form>;
}
