import React, { useEffect, useState } from "react";
import { employeeAppService } from "../../services/employeeApp";

const item = (label, value) => <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">{label}</p><b className="mt-1 block">{value || "—"}</b></div>;

export default function EmployeeProfilePage({ company, employeeId, user, settings = {}, allowed = () => true }) {
  const [employee, setEmployee] = useState(null);
  const canViewSalary = settings.show_salary === true && allowed("profile_salary", "can_view");
  useEffect(() => {
    employeeAppService.loadEmployeeProfile(company.company_id, employeeId).then(setEmployee).catch(() => setEmployee({}));
  }, [company.company_id, employeeId]);
  const initials = String(employee?.name || user?.name || "م").split(/\s+/).slice(0, 2).map((part) => part[0]).join("");
  return <div className="space-y-4"><section className="rounded-[2rem] bg-white p-5 text-center shadow-sm"><div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-violet-100 text-2xl font-black text-violet-800">{employee?.profile_image_url ? <img src={employee.profile_image_url} className="h-full w-full object-cover" /> : initials}</div><h2 className="mt-3 text-2xl font-black">{employee?.name || user?.name || "الموظف"}</h2><p className="text-sm text-slate-500">{employee?.job || user?.job || "غير محدد"}</p></section><section className="grid gap-3 md:grid-cols-2">{item("الرقم الوظيفي", employee?.id || employeeId)}{item("الهاتف", employee?.phone)}{item("البريد الإلكتروني", user?.email)}{item("الفرع", employee?.branch)}{item("القسم", employee?.department || employee?.department_name)}{item("المسمى الوظيفي", employee?.job)}{item("تاريخ التعيين", employee?.hireDate || employee?.hire_date)}{item("المدير المباشر", employee?.manager)}{item("الحالة الوظيفية", employee?.status)}{canViewSalary ? item("الراتب", employee?.salary) : item("الراتب", "غير متاح حسب الصلاحية")}</section></div>;
}
