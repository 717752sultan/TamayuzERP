import React, { useEffect, useState } from "react";
import { companyEntitlementsService } from "../../services/companyEntitlements";
import { companiesService } from "../../services/companies";

export default function PlatformCompanyEntitlementsPage({ currentUser }) {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [entitlements, setEntitlements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const rows = await companiesService.loadCompanies();
        if (alive) setCompanies(rows);
      } catch (e) {
        console.error(e);
        if (alive) setCompanies([]);
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!selectedCompanyId) {
      setEntitlements([]);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const rows = await companyEntitlementsService.loadCompanyEntitlements(selectedCompanyId);
        if (alive) setEntitlements(rows);
      } catch (e) {
        console.error(e);
        if (alive) setEntitlements([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [selectedCompanyId]);

  const applyPlan = async (planKey) => {
    if (!selectedCompanyId) return alert("اختر شركة أولا");
    if (!confirm(`تطبيق باقة ${planKey} على الشركة المحددة؟`)) return;
    try {
      setApplying(true);
      await companyEntitlementsService.applySubscriptionPlan(selectedCompanyId, planKey, currentUser);
      const updated = await companyEntitlementsService.loadCompanyEntitlements(selectedCompanyId);
      setEntitlements(updated);
      alert("تم تطبيق الباقة بنجاح");
    } catch (e) {
      console.error(e);
      alert(e.message || "تعذر تطبيق الباقة");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold">إدارة اشتراكات الشركات</h2>
      <div className="panel p-4">
        <label className="flex items-center gap-2">
          <span className="text-sm font-bold">اختر الشركة</span>
          <select value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)} className="field ml-3">
            <option value="">-- اختر --</option>
            {companies.map((c) => (
              <option key={c.company_id} value={c.company_id}>{c.company_code || c.company_name} - {c.company_name}</option>
            ))}
          </select>
        </label>
      </div>

      {selectedCompanyId && (
        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <b className="text-sm">باقة افتراضية</b>
            <div className="flex gap-2">
              <button onClick={() => applyPlan('trial')} disabled={applying} className="btn-secondary">تجريبية</button>
              <button onClick={() => applyPlan('hr_only')} disabled={applying} className="btn-secondary">الموارد البشرية</button>
              <button onClick={() => applyPlan('basic')} disabled={applying} className="btn-secondary">أساسية</button>
              <button onClick={() => applyPlan('professional')} disabled={applying} className="btn-secondary">احترافية</button>
              <button onClick={() => applyPlan('enterprise')} disabled={applying} className="btn-secondary">مؤسسية</button>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-bold">الأذونات الحالية ({entitlements.length})</h3>
            {loading ? <p className="text-sm text-slate-400">جاري التحميل...</p> : (
              <div className="overflow-x-auto mt-3">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="text-sm text-left"><th>المفتاح</th><th>الوحدة</th><th>الصفحة</th><th>مفعل</th><th>مصدر</th><th>قيمة الحد</th></tr>
                  </thead>
                  <tbody>
                    {entitlements.map((row) => (
                      <tr key={row.id || row.entitlement_key} className="text-sm"><td>{row.entitlement_key}</td><td>{row.module_key}</td><td>{row.page_key}</td><td>{row.is_enabled ? 'نعم' : 'لا'}</td><td>{row.source_plan}</td><td>{row.limit_value ?? '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
