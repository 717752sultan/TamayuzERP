import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { employeeAppService } from "../../services/employeeApp";

export default function EmployeeNotificationsPage({ company, employeeId }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    employeeAppService.loadEmployeeNotifications(company.company_id, employeeId).then(setRows).catch((err) => setError(err.message));
  }, [company.company_id, employeeId]);
  return <div className="space-y-3">{error && <div className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}{rows.length ? rows.map((row) => <article key={row.notification_id} className="rounded-[1.5rem] bg-white p-4 shadow-sm"><div className="flex gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-violet-700"><Bell size={18} /></div><div><h3 className="font-black">{row.title}</h3><p className="mt-1 text-sm text-slate-600">{row.body}</p><p className="mt-2 text-xs text-slate-400">{String(row.created_at || "").slice(0, 16).replace("T", " ")}</p></div></div></article>) : <div className="rounded-[2rem] bg-white p-8 text-center text-sm font-bold text-slate-400">لا توجد إشعارات حالياً</div>}</div>;
}
