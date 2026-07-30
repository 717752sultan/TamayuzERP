import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { employeeAppService } from "../../services/employeeApp";

const statusText = { pending: "قيد المراجعة", approved: "معتمد", rejected: "مرفوض", cancelled: "ملغي" };
const statusClass = (status) => status === "approved" ? "bg-green-50 text-green-700" : status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";

export default function EmployeeRequestsPage({ company, employeeId, go }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const load = () => employeeAppService.loadEmployeeRequests(company.company_id, employeeId).then(setRows).catch((err) => setError(err.message));
  useEffect(() => { load(); }, [company.company_id, employeeId]);
  return <div className="space-y-4"><div className="flex justify-end"><button onClick={() => go("/employee/requests/new")} className="btn-primary bg-violet-700"><Plus size={17} /> طلب جديد</button></div>{error && <div className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}<section className="space-y-3">{rows.length ? rows.map((request) => <article key={request.request_id} className="rounded-[1.5rem] bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{request.title}</h3><p className="mt-1 text-sm text-slate-500">{request.request_type}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(request.status)}`}>{statusText[request.status] || request.status}</span></div><p className="mt-3 text-sm text-slate-600">{request.description || "—"}</p><div className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-3"><span>من: {request.from_date || "—"}</span><span>إلى: {request.to_date || "—"}</span><span>المعتمد الحالي: {request.current_approver || "—"}</span></div>{request.rejection_reason && <div className="mt-3 rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700">{request.rejection_reason}</div>}</article>) : <div className="rounded-[2rem] bg-white p-8 text-center text-sm font-bold text-slate-400">لا توجد طلبات حتى الآن</div>}</section></div>;
}
