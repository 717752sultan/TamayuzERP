import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  BadgeCheck,
  FileBarChart,
  FileSpreadsheet,
  Gauge,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Trash2,
  Wrench,
} from "lucide-react";
import { fixedAssetsService, createFixedAssetId, getAssetTodayDateOnly } from "../../services/fixedAssets";

const nf = new Intl.NumberFormat("ar");
const money = (value) => `${nf.format(Number(value || 0))} ريال`;

const pageTitles = {
  assets_1: ["لوحة الأصول", "مؤشرات الأصول والعهد والإهلاك والصيانة"],
  assets_2: ["سجل الأصول", "إضافة وتعديل ومتابعة أصول الشركة"],
  assets_3: ["تصنيفات الأصول", "إدارة التصنيفات وأعمار الإهلاك الافتراضية"],
  assets_4: ["العهد", "تسليم واسترجاع الأصول من الموظفين"],
  assets_5: ["الإهلاك", "احتساب وترحيل إهلاك الأصول شهريًا"],
  assets_6: ["الصيانة", "تسجيل صيانة الأصول وتكاليفها"],
  assets_7: ["نقل الأصول", "نقل الأصول بين الفروع والمواقع"],
  assets_8: ["استبعاد الأصول", "بيع أو إتلاف أو شطب الأصول"],
  assets_9: ["تقارير الأصول", "تقارير تشغيلية ومالية للأصول"],
};

const statusOptions = ["نشط", "في العهدة", "تحت الصيانة", "غير مستخدم", "مستبعد", "مفقود", "تالف"];
const depreciationMethods = ["القسط الثابت", "بدون إهلاك"];
const currencies = ["YER", "SAR", "USD"];

const Label = ({ t, children }) => <label className="text-sm font-bold text-slate-700">{t}{children}</label>;

const Status = ({ children }) => (
  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">{children || "—"}</span>
);

const Mini = ({ label, value, icon: Icon = Gauge }) => (
  <div className="panel p-4">
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Icon size={20} /></span>
      <div>
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <h3 className="mt-1 text-2xl font-black text-slate-900">{value}</h3>
      </div>
    </div>
  </div>
);

const PageHead = ({ title, desc, action }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 className="text-2xl font-black text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
    {action}
  </div>
);

const DialogTitle = ({ title, close }) => (
  <div className="mb-5 flex items-center justify-between">
    <h3 className="text-xl font-black text-slate-900">{title}</h3>
    <button type="button" onClick={close} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">إغلاق</button>
  </div>
);

const DialogActions = ({ close, saving }) => (
  <div className="mt-6 flex justify-end gap-2">
    <button type="button" onClick={close} className="btn-secondary">إلغاء</button>
    <button disabled={saving} className="btn-primary"><Save size={17} /> حفظ</button>
  </div>
);

const exportExcel = (rows, name) => {
  const ws = XLSX.utils.json_to_sheet(rows || []);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${name}.xlsx`);
};

const printTable = (title, rows, columns) => {
  const html = `
    <html dir="rtl" lang="ar"><head><meta charset="UTF-8" />
    <title>${title}</title><style>
      body{font-family:Tahoma,Arial;padding:24px;color:#111827}
      h1{color:#7f1d1d} table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{border:1px solid #e5e7eb;padding:8px;text-align:right;font-size:12px}
      th{background:#f8fafc}
    </style></head><body><h1>${title}</h1><table><thead><tr>
    ${columns.map((c) => `<th>${c.label}</th>`).join("")}</tr></thead><tbody>
    ${(rows || []).map((row) => `<tr>${columns.map((c) => `<td>${row[c.key] ?? ""}</td>`).join("")}</tr>`).join("")}
    </tbody></table></body></html>`;
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.print();
};

const safeNumber = (value) => Number(value || 0);

export default function FixedAssetsModule({ activePage, currentCompany, employees = [], settings = {}, can }) {
  const companyId = currentCompany?.company_id || settings?.company_id || "";
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [assets, setAssets] = useState([]);
  const [custodies, setCustodies] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [disposals, setDisposals] = useState([]);
  const [depreciation, setDepreciation] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [filters, setFilters] = useState({ q: "", status: "all", branch: "all", month: getAssetTodayDateOnly().slice(0, 7) });

  const pageKey = activePage || "assets_1";
  const [title, desc] = pageTitles[pageKey] || pageTitles.assets_1;
  const canCreate = can?.(pageKey, "can_create") !== false;
  const canEdit = can?.(pageKey, "can_edit") !== false;
  const canDelete = can?.(pageKey, "can_delete") !== false;
  const canExport = can?.(pageKey, "can_export") !== false;
  const canPrint = can?.(pageKey, "can_print") !== false;

  const branches = useMemo(() => [...new Set([
    ...(assets || []).map((asset) => asset.branch),
    ...(employees || []).map((employee) => employee.branch),
  ].filter(Boolean))], [assets, employees]);

  const load = async () => {
    if (!companyId) {
      setError("لم يتم تحديد الشركة الحالية");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [cats, assetRows, custodyRows, transferRows, maintenanceRows, disposalRows, depreciationRows] = await Promise.all([
        fixedAssetsService.loadAssetCategories(companyId),
        fixedAssetsService.loadFixedAssets({ company_id: companyId }),
        fixedAssetsService.loadAssetCustodies({ company_id: companyId }),
        fixedAssetsService.loadAssetTransfers({ company_id: companyId }),
        fixedAssetsService.loadAssetMaintenance({ company_id: companyId }),
        fixedAssetsService.loadAssetDisposals({ company_id: companyId }),
        fixedAssetsService.loadDepreciationEntries({ company_id: companyId }),
      ]);
      setCategories(cats || []);
      setAssets(assetRows || []);
      setCustodies(custodyRows || []);
      setTransfers(transferRows || []);
      setMaintenance(maintenanceRows || []);
      setDisposals(disposalRows || []);
      setDepreciation(depreciationRows || []);
    } catch (err) {
      console.error("Fixed assets load error:", err);
      setError(err.message || "تعذر تحميل بيانات الأصول");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [companyId]);

  const filteredAssets = useMemo(() => assets.filter((asset) => {
    const q = filters.q.trim();
    const matchQ = !q || [asset.asset_code, asset.asset_name, asset.serial_number, asset.custodian_employee_name].some((value) => String(value || "").includes(q));
    const matchStatus = filters.status === "all" || asset.status === filters.status;
    const matchBranch = filters.branch === "all" || asset.branch === filters.branch;
    return matchQ && matchStatus && matchBranch;
  }), [assets, filters]);

  const stats = useMemo(() => {
    const active = assets.filter((asset) => !["مستبعد", "مفقود", "تالف", "غير مستخدم"].includes(asset.status));
    return {
      total: assets.length,
      active: active.length,
      custody: custodies.filter((row) => row.status !== "مسترجعة").length,
      maintenance: maintenance.length,
      disposed: disposals.length,
      cost: assets.reduce((sum, asset) => sum + safeNumber(asset.purchase_cost_base || asset.purchase_cost), 0),
      book: assets.reduce((sum, asset) => sum + safeNumber(asset.book_value || asset.purchase_cost_base || asset.purchase_cost), 0),
    };
  }, [assets, custodies, maintenance, disposals]);

  const selectAsset = (assetId, patch = {}) => {
    const asset = assets.find((row) => row.asset_id === assetId) || {};
    return {
      ...patch,
      asset_id: asset.asset_id || "",
      asset_code: asset.asset_code || "",
      asset_name: asset.asset_name || "",
      branch: asset.branch || patch.branch || "",
      from_branch: asset.branch || "",
      from_location: asset.location || "",
    };
  };

  const openAssetDialog = (asset = {}) => setDialog({
    type: "asset",
    asset_id: asset.asset_id || createFixedAssetId("AST"),
    asset_code: asset.asset_code || "",
    asset_name: asset.asset_name || "",
    category_id: asset.category_id || categories[0]?.category_id || "",
    category_name: asset.category_name || categories[0]?.category_name || "",
    branch: asset.branch || branches[0] || "",
    department: asset.department || "",
    location: asset.location || "",
    custodian_employee_id: asset.custodian_employee_id || "",
    custodian_employee_name: asset.custodian_employee_name || "",
    purchase_date: asset.purchase_date || getAssetTodayDateOnly(),
    purchase_cost: asset.purchase_cost || 0,
    currency_code: asset.currency_code || "YER",
    exchange_rate: asset.exchange_rate || 1,
    residual_value: asset.residual_value || 0,
    useful_life_months: asset.useful_life_months || 60,
    depreciation_method: asset.depreciation_method || "القسط الثابت",
    status: asset.status || "نشط",
    serial_number: asset.serial_number || "",
    supplier_name: asset.supplier_name || "",
    notes: asset.notes || "",
    company_id: companyId,
  });

  const saveDialog = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (dialog.type === "category") await fixedAssetsService.saveAssetCategory({ ...dialog, company_id: companyId });
      if (dialog.type === "asset") await fixedAssetsService.saveFixedAsset({ ...dialog, company_id: companyId });
      if (dialog.type === "custody") await fixedAssetsService.saveAssetCustody({ ...dialog, company_id: companyId });
      if (dialog.type === "transfer") await fixedAssetsService.saveAssetTransfer({ ...dialog, company_id: companyId });
      if (dialog.type === "maintenance") await fixedAssetsService.saveAssetMaintenance({ ...dialog, company_id: companyId });
      if (dialog.type === "disposal") await fixedAssetsService.saveAssetDisposal({ ...dialog, company_id: companyId });
      setDialog(null);
      await load();
      alert("تم حفظ بيانات الأصول بنجاح");
    } catch (err) {
      console.error("Fixed assets save error:", err);
      alert(err.message || "تعذر حفظ بيانات الأصول");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (type, id) => {
    if (!confirm("هل تريد الحذف؟")) return;
    try {
      if (type === "asset") await fixedAssetsService.deleteFixedAsset(id);
      if (type === "category") await fixedAssetsService.deleteAssetCategory(id);
      await load();
    } catch (err) {
      console.error("Fixed assets delete error:", err);
      alert(err.message || "تعذر حذف السجل");
    }
  };

  const generateDepreciation = async () => {
    try {
      const rows = await fixedAssetsService.generateMonthlyDepreciation(companyId, filters.month);
      await load();
      alert(`تم توليد ${rows.length} قيد إهلاك`);
    } catch (err) {
      console.error("Fixed assets depreciation error:", err);
      alert(err.message || "تعذر توليد الإهلاك");
    }
  };

  const assetColumns = [
    { key: "asset_code", label: "كود الأصل" },
    { key: "asset_name", label: "اسم الأصل" },
    { key: "category_name", label: "التصنيف" },
    { key: "branch", label: "الفرع" },
    { key: "custodian_employee_name", label: "العهدة" },
    { key: "purchase_cost_base", label: "التكلفة" },
    { key: "book_value", label: "القيمة الدفترية" },
    { key: "status", label: "الحالة" },
  ];

  const renderFilters = () => (
    <div className="panel flex flex-wrap gap-3 p-4">
      <input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} className="field min-w-[220px] flex-1" placeholder="بحث باسم الأصل أو الكود أو الرقم التسلسلي" />
      <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="field max-w-[180px]">
        <option value="all">كل الحالات</option>
        {statusOptions.map((status) => <option key={status}>{status}</option>)}
      </select>
      <select value={filters.branch} onChange={(event) => setFilters({ ...filters, branch: event.target.value })} className="field max-w-[180px]">
        <option value="all">كل الفروع</option>
        {branches.map((branch) => <option key={branch}>{branch}</option>)}
      </select>
      <button onClick={load} className="btn-secondary"><RefreshCw size={17} /> تحديث</button>
      <button disabled={!canExport} onClick={() => exportExcel(filteredAssets, "سجل الأصول")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button>
      <button disabled={!canPrint} onClick={() => printTable("سجل الأصول", filteredAssets, assetColumns)} className="btn-secondary"><Printer size={17} /> طباعة</button>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Mini label="إجمالي الأصول" value={stats.total} />
        <Mini label="الأصول النشطة" value={stats.active} icon={BadgeCheck} />
        <Mini label="العهد القائمة" value={stats.custody} />
        <Mini label="سجلات الصيانة" value={stats.maintenance} icon={Wrench} />
        <Mini label="الأصول المستبعدة" value={stats.disposed} />
        <Mini label="القيمة الدفترية" value={money(stats.book)} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="panel p-4">
          <h3 className="mb-3 font-black">أحدث الأصول</h3>
          {renderAssetsTable(filteredAssets.slice(0, 8), false)}
        </div>
        <div className="panel p-4">
          <h3 className="mb-3 font-black">ملخص التصنيفات</h3>
          <div className="space-y-2">
            {categories.map((category) => {
              const count = assets.filter((asset) => asset.category_id === category.category_id).length;
              return <div key={category.category_id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="font-bold">{category.category_name}</span><Status>{count} أصل</Status></div>;
            })}
            {!categories.length && <p className="text-sm text-slate-500">لا توجد تصنيفات بعد</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssetsTable = (rows = filteredAssets, withActions = true) => (
    <div className="table-wrap">
      <table>
        <thead><tr>{assetColumns.map((c) => <th key={c.key}>{c.label}</th>)}{withActions && <th></th>}</tr></thead>
        <tbody>
          {rows.map((asset) => (
            <tr key={asset.asset_id}>
              <td>{asset.asset_code}</td>
              <td><b>{asset.asset_name}</b><p className="text-xs text-slate-400">{asset.serial_number}</p></td>
              <td>{asset.category_name}</td>
              <td>{asset.branch}<p className="text-xs text-slate-400">{asset.location}</p></td>
              <td>{asset.custodian_employee_name || "—"}</td>
              <td>{money(asset.purchase_cost_base || asset.purchase_cost)}</td>
              <td>{money(asset.book_value || asset.purchase_cost_base || asset.purchase_cost)}</td>
              <td><Status>{asset.status}</Status></td>
              {withActions && <td className="whitespace-nowrap">
                <button disabled={!canEdit} onClick={() => openAssetDialog(asset)} className="p-2 text-blue-600">تعديل</button>
                <button disabled={!canDelete} onClick={() => remove("asset", asset.asset_id)} className="p-2 text-red-600"><Trash2 size={16} /></button>
              </td>}
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={withActions ? 9 : 8} className="text-center text-slate-500">لا توجد بيانات</td></tr>}
        </tbody>
      </table>
    </div>
  );

  const renderRegistry = () => <div className="space-y-4">{renderFilters()}<div className="panel p-4">{renderAssetsTable()}</div></div>;

  const renderCategories = () => (
    <div className="panel p-4">
      <div className="mb-4 flex justify-end">
        <button disabled={!canCreate} onClick={() => setDialog({ type: "category", category_id: createFixedAssetId("CAT"), category_name: "", depreciation_method: "القسط الثابت", default_useful_life_months: 60, default_residual_value: 0, is_active: true, notes: "", company_id: companyId })} className="btn-primary"><Plus size={17} /> إضافة تصنيف</button>
      </div>
      <div className="table-wrap"><table><thead><tr><th>التصنيف</th><th>طريقة الإهلاك</th><th>العمر الافتراضي</th><th>القيمة التخريدية</th><th>الحالة</th><th></th></tr></thead><tbody>
        {categories.map((category) => <tr key={category.category_id}><td>{category.category_name}</td><td>{category.depreciation_method}</td><td>{category.default_useful_life_months} شهر</td><td>{money(category.default_residual_value)}</td><td><Status>{category.is_active ? "نشط" : "غير نشط"}</Status></td><td><button disabled={!canEdit} onClick={() => setDialog({ type: "category", ...category })} className="p-2 text-blue-600">تعديل</button><button disabled={!canDelete} onClick={() => remove("category", category.category_id)} className="p-2 text-red-600">حذف</button></td></tr>)}
      </tbody></table></div>
    </div>
  );

  const renderWorkflowTable = (rows, columns) => (
    <div className="panel p-4"><div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>
      {rows.map((row, index) => <tr key={row.custody_id || row.transfer_id || row.maintenance_id || row.disposal_id || row.entry_id || index}>{columns.map((column) => <td key={column.key}>{column.key === "status" ? <Status>{row[column.key]}</Status> : row[column.key] ?? "—"}</td>)}</tr>)}
      {!rows.length && <tr><td colSpan={columns.length} className="text-center text-slate-500">لا توجد بيانات</td></tr>}
    </tbody></table></div></div>
  );

  const renderCustodies = () => {
    const columns = [{ key: "asset_name", label: "الأصل" }, { key: "employee_name", label: "الموظف" }, { key: "branch", label: "الفرع" }, { key: "custody_date", label: "تاريخ التسليم" }, { key: "return_date", label: "تاريخ الإرجاع" }, { key: "status", label: "الحالة" }];
    return <div className="space-y-4"><div className="flex justify-end"><button disabled={!canCreate} onClick={() => setDialog({ type: "custody", custody_id: createFixedAssetId("CUS"), custody_date: getAssetTodayDateOnly(), status: "مسلمة", company_id: companyId })} className="btn-primary"><Plus size={17} /> تسليم عهدة</button></div>{renderWorkflowTable(custodies, columns)}</div>;
  };

  const renderTransfers = () => {
    const columns = [{ key: "asset_name", label: "الأصل" }, { key: "from_branch", label: "من فرع" }, { key: "to_branch", label: "إلى فرع" }, { key: "transfer_date", label: "تاريخ النقل" }, { key: "status", label: "الحالة" }];
    return <div className="space-y-4"><div className="flex justify-end"><button disabled={!canCreate} onClick={() => setDialog({ type: "transfer", transfer_id: createFixedAssetId("TRF"), transfer_date: getAssetTodayDateOnly(), status: "منفذ", company_id: companyId })} className="btn-primary"><Plus size={17} /> نقل أصل</button></div>{renderWorkflowTable(transfers, columns)}</div>;
  };

  const renderMaintenance = () => {
    const columns = [{ key: "asset_name", label: "الأصل" }, { key: "maintenance_type", label: "نوع الصيانة" }, { key: "provider_name", label: "المورد" }, { key: "maintenance_date", label: "التاريخ" }, { key: "cost", label: "التكلفة" }, { key: "status", label: "الحالة" }];
    return <div className="space-y-4"><div className="flex justify-end"><button disabled={!canCreate} onClick={() => setDialog({ type: "maintenance", maintenance_id: createFixedAssetId("MNT"), maintenance_date: getAssetTodayDateOnly(), maintenance_type: "وقائية", status: "مكتملة", cost: 0, company_id: companyId })} className="btn-primary"><Plus size={17} /> إضافة صيانة</button></div>{renderWorkflowTable(maintenance, columns)}</div>;
  };

  const renderDisposals = () => {
    const columns = [{ key: "asset_name", label: "الأصل" }, { key: "disposal_reason", label: "سبب الاستبعاد" }, { key: "disposal_date", label: "التاريخ" }, { key: "disposal_value", label: "قيمة الاستبعاد" }, { key: "status", label: "الحالة" }];
    return <div className="space-y-4"><div className="flex justify-end"><button disabled={!canCreate} onClick={() => setDialog({ type: "disposal", disposal_id: createFixedAssetId("DSP"), disposal_date: getAssetTodayDateOnly(), status: "معتمد", disposal_value: 0, company_id: companyId })} className="btn-primary"><Plus size={17} /> استبعاد أصل</button></div>{renderWorkflowTable(disposals, columns)}</div>;
  };

  const renderDepreciation = () => {
    const columns = [{ key: "depreciation_month", label: "الشهر" }, { key: "asset_name", label: "الأصل" }, { key: "depreciation_amount", label: "إهلاك الشهر" }, { key: "accumulated_depreciation", label: "مجمع الإهلاك" }, { key: "book_value", label: "القيمة الدفترية" }, { key: "status", label: "الحالة" }];
    return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><input type="month" value={filters.month} onChange={(event) => setFilters({ ...filters, month: event.target.value })} className="field max-w-[180px]" /><button disabled={!canCreate} onClick={generateDepreciation} className="btn-primary">توليد إهلاك الشهر</button></div>{renderWorkflowTable(depreciation.filter((row) => !filters.month || row.depreciation_month === filters.month), columns)}</div>;
  };

  const renderReports = () => {
    const reports = [
      ["تقرير سجل الأصول", filteredAssets, assetColumns],
      ["تقرير العهد", custodies, [{ key: "asset_name", label: "الأصل" }, { key: "employee_name", label: "الموظف" }, { key: "status", label: "الحالة" }]],
      ["تقرير الإهلاك", depreciation, [{ key: "depreciation_month", label: "الشهر" }, { key: "asset_name", label: "الأصل" }, { key: "depreciation_amount", label: "الإهلاك" }, { key: "book_value", label: "القيمة الدفترية" }]],
      ["تقرير الصيانة", maintenance, [{ key: "asset_name", label: "الأصل" }, { key: "maintenance_type", label: "النوع" }, { key: "cost", label: "التكلفة" }]],
    ];
    return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{reports.map(([reportTitle, rows, columns]) => <div key={reportTitle} className="panel p-5"><FileBarChart className="text-brand-700" /><h3 className="mt-3 font-black">{reportTitle}</h3><p className="mt-1 text-sm text-slate-500">عدد السجلات: {rows.length}</p><div className="mt-5 flex gap-2"><button disabled={!canExport} onClick={() => exportExcel(rows, reportTitle)} className="btn-secondary flex-1">Excel</button><button disabled={!canPrint} onClick={() => printTable(reportTitle, rows, columns)} className="btn-secondary flex-1">طباعة</button></div></div>)}</div>;
  };

  const renderContent = () => {
    if (pageKey === "assets_1") return renderDashboard();
    if (pageKey === "assets_2") return renderRegistry();
    if (pageKey === "assets_3") return renderCategories();
    if (pageKey === "assets_4") return renderCustodies();
    if (pageKey === "assets_5") return renderDepreciation();
    if (pageKey === "assets_6") return renderMaintenance();
    if (pageKey === "assets_7") return renderTransfers();
    if (pageKey === "assets_8") return renderDisposals();
    if (pageKey === "assets_9") return renderReports();
    return renderDashboard();
  };

  return (
    <div className="space-y-5">
      <PageHead
        title={title}
        desc={desc}
        action={pageKey === "assets_2" ? <button disabled={!canCreate} onClick={() => openAssetDialog()} className="btn-primary"><Plus size={18} /> إضافة أصل</button> : null}
      />
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      {loading ? <div className="panel p-8 text-center font-bold text-slate-500">جاري تحميل بيانات الأصول...</div> : renderContent()}
      {dialog && renderDialog()}
    </div>
  );

  function renderAssetPicker(extra = {}) {
    return <Label t="الأصل"><select required value={dialog.asset_id || ""} onChange={(event) => setDialog({ ...dialog, ...selectAsset(event.target.value, extra) })} className="field mt-2"><option value="">اختر الأصل</option>{assets.map((asset) => <option key={asset.asset_id} value={asset.asset_id}>{asset.asset_code} - {asset.asset_name}</option>)}</select></Label>;
  }

  function renderEmployeePicker() {
    return <Label t="الموظف"><select value={dialog.employee_id || ""} onChange={(event) => {
      const employee = employees.find((emp) => emp.id === event.target.value) || {};
      setDialog({ ...dialog, employee_id: employee.id || "", employee_name: employee.name || "", branch: employee.branch || dialog.branch || "" });
    }} className="field mt-2"><option value="">اختر الموظف</option>{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} - {emp.id}</option>)}</select></Label>;
  }

  function renderDialog() {
    const titleMap = { asset: "بيانات الأصل", category: "تصنيف أصل", custody: "تسليم عهدة", transfer: "نقل أصل", maintenance: "صيانة أصل", disposal: "استبعاد أصل" };
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
        <form onSubmit={saveDialog} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6">
          <DialogTitle title={titleMap[dialog.type] || "بيانات الأصول"} close={() => setDialog(null)} />
          {dialog.type === "asset" && <div className="grid gap-4 md:grid-cols-3">
            <Label t="كود الأصل"><input required value={dialog.asset_code} onChange={(event) => setDialog({ ...dialog, asset_code: event.target.value })} className="field mt-2" /></Label>
            <Label t="اسم الأصل"><input required value={dialog.asset_name} onChange={(event) => setDialog({ ...dialog, asset_name: event.target.value })} className="field mt-2" /></Label>
            <Label t="التصنيف"><select value={dialog.category_id} onChange={(event) => {
              const cat = categories.find((category) => category.category_id === event.target.value) || {};
              setDialog({ ...dialog, category_id: cat.category_id || "", category_name: cat.category_name || "", useful_life_months: cat.default_useful_life_months || dialog.useful_life_months, residual_value: cat.default_residual_value ?? dialog.residual_value, depreciation_method: cat.depreciation_method || dialog.depreciation_method });
            }} className="field mt-2"><option value="">اختر التصنيف</option>{categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.category_name}</option>)}</select></Label>
            <Label t="الفرع"><input value={dialog.branch} onChange={(event) => setDialog({ ...dialog, branch: event.target.value })} className="field mt-2" /></Label>
            <Label t="القسم"><input value={dialog.department} onChange={(event) => setDialog({ ...dialog, department: event.target.value })} className="field mt-2" /></Label>
            <Label t="الموقع"><input value={dialog.location} onChange={(event) => setDialog({ ...dialog, location: event.target.value })} className="field mt-2" /></Label>
            <Label t="تاريخ الشراء"><input type="date" value={dialog.purchase_date} onChange={(event) => setDialog({ ...dialog, purchase_date: event.target.value })} className="field mt-2" /></Label>
            <Label t="تكلفة الشراء"><input type="number" value={dialog.purchase_cost} onChange={(event) => setDialog({ ...dialog, purchase_cost: event.target.value })} className="field mt-2" /></Label>
            <Label t="العملة"><select value={dialog.currency_code} onChange={(event) => setDialog({ ...dialog, currency_code: event.target.value })} className="field mt-2">{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></Label>
            <Label t="سعر الصرف"><input type="number" value={dialog.exchange_rate} onChange={(event) => setDialog({ ...dialog, exchange_rate: event.target.value })} className="field mt-2" /></Label>
            <Label t="القيمة التخريدية"><input type="number" value={dialog.residual_value} onChange={(event) => setDialog({ ...dialog, residual_value: event.target.value })} className="field mt-2" /></Label>
            <Label t="العمر بالأشهر"><input type="number" value={dialog.useful_life_months} onChange={(event) => setDialog({ ...dialog, useful_life_months: event.target.value })} className="field mt-2" /></Label>
            <Label t="طريقة الإهلاك"><select value={dialog.depreciation_method} onChange={(event) => setDialog({ ...dialog, depreciation_method: event.target.value })} className="field mt-2">{depreciationMethods.map((method) => <option key={method}>{method}</option>)}</select></Label>
            <Label t="الحالة"><select value={dialog.status} onChange={(event) => setDialog({ ...dialog, status: event.target.value })} className="field mt-2">{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></Label>
            <Label t="الرقم التسلسلي"><input value={dialog.serial_number} onChange={(event) => setDialog({ ...dialog, serial_number: event.target.value })} className="field mt-2" /></Label>
            <Label t="المورد"><input value={dialog.supplier_name} onChange={(event) => setDialog({ ...dialog, supplier_name: event.target.value })} className="field mt-2" /></Label>
            <Label t="ملاحظات"><textarea value={dialog.notes} onChange={(event) => setDialog({ ...dialog, notes: event.target.value })} className="field mt-2 !h-auto py-3" /></Label>
          </div>}
          {dialog.type === "category" && <div className="grid gap-4 md:grid-cols-3">
            <Label t="اسم التصنيف"><input required value={dialog.category_name} onChange={(event) => setDialog({ ...dialog, category_name: event.target.value })} className="field mt-2" /></Label>
            <Label t="طريقة الإهلاك"><select value={dialog.depreciation_method} onChange={(event) => setDialog({ ...dialog, depreciation_method: event.target.value })} className="field mt-2">{depreciationMethods.map((method) => <option key={method}>{method}</option>)}</select></Label>
            <Label t="العمر الافتراضي بالأشهر"><input type="number" value={dialog.default_useful_life_months} onChange={(event) => setDialog({ ...dialog, default_useful_life_months: event.target.value })} className="field mt-2" /></Label>
            <Label t="القيمة التخريدية الافتراضية"><input type="number" value={dialog.default_residual_value} onChange={(event) => setDialog({ ...dialog, default_residual_value: event.target.value })} className="field mt-2" /></Label>
            <Label t="الحالة"><select value={String(dialog.is_active !== false)} onChange={(event) => setDialog({ ...dialog, is_active: event.target.value === "true" })} className="field mt-2"><option value="true">نشط</option><option value="false">غير نشط</option></select></Label>
            <Label t="ملاحظات"><input value={dialog.notes || ""} onChange={(event) => setDialog({ ...dialog, notes: event.target.value })} className="field mt-2" /></Label>
          </div>}
          {dialog.type === "custody" && <div className="grid gap-4 md:grid-cols-3">{renderAssetPicker()} {renderEmployeePicker()}<Label t="تاريخ التسليم"><input type="date" value={dialog.custody_date || ""} onChange={(event) => setDialog({ ...dialog, custody_date: event.target.value })} className="field mt-2" /></Label><Label t="الحالة"><select value={dialog.status || "مسلمة"} onChange={(event) => setDialog({ ...dialog, status: event.target.value })} className="field mt-2"><option>مسلمة</option><option>مسترجعة</option></select></Label><Label t="ملاحظات"><input value={dialog.notes || ""} onChange={(event) => setDialog({ ...dialog, notes: event.target.value })} className="field mt-2" /></Label></div>}
          {dialog.type === "transfer" && <div className="grid gap-4 md:grid-cols-3">{renderAssetPicker()}<Label t="من فرع"><input value={dialog.from_branch || ""} onChange={(event) => setDialog({ ...dialog, from_branch: event.target.value })} className="field mt-2" /></Label><Label t="إلى فرع"><input required value={dialog.to_branch || ""} onChange={(event) => setDialog({ ...dialog, to_branch: event.target.value })} className="field mt-2" /></Label><Label t="من موقع"><input value={dialog.from_location || ""} onChange={(event) => setDialog({ ...dialog, from_location: event.target.value })} className="field mt-2" /></Label><Label t="إلى موقع"><input value={dialog.to_location || ""} onChange={(event) => setDialog({ ...dialog, to_location: event.target.value })} className="field mt-2" /></Label><Label t="تاريخ النقل"><input type="date" value={dialog.transfer_date || ""} onChange={(event) => setDialog({ ...dialog, transfer_date: event.target.value })} className="field mt-2" /></Label><Label t="ملاحظات"><input value={dialog.notes || ""} onChange={(event) => setDialog({ ...dialog, notes: event.target.value })} className="field mt-2" /></Label></div>}
          {dialog.type === "maintenance" && <div className="grid gap-4 md:grid-cols-3">{renderAssetPicker()}<Label t="نوع الصيانة"><select value={dialog.maintenance_type || "وقائية"} onChange={(event) => setDialog({ ...dialog, maintenance_type: event.target.value })} className="field mt-2"><option>وقائية</option><option>تصحيحية</option><option>طارئة</option></select></Label><Label t="المورد"><input value={dialog.provider_name || ""} onChange={(event) => setDialog({ ...dialog, provider_name: event.target.value })} className="field mt-2" /></Label><Label t="تاريخ الصيانة"><input type="date" value={dialog.maintenance_date || ""} onChange={(event) => setDialog({ ...dialog, maintenance_date: event.target.value })} className="field mt-2" /></Label><Label t="التكلفة"><input type="number" value={dialog.cost || 0} onChange={(event) => setDialog({ ...dialog, cost: event.target.value })} className="field mt-2" /></Label><Label t="الحالة"><select value={dialog.status || "مكتملة"} onChange={(event) => setDialog({ ...dialog, status: event.target.value })} className="field mt-2"><option>مجدولة</option><option>قيد التنفيذ</option><option>مكتملة</option></select></Label><Label t="ملاحظات"><input value={dialog.notes || ""} onChange={(event) => setDialog({ ...dialog, notes: event.target.value })} className="field mt-2" /></Label></div>}
          {dialog.type === "disposal" && <div className="grid gap-4 md:grid-cols-3">{renderAssetPicker()}<Label t="سبب الاستبعاد"><select value={dialog.disposal_reason || ""} onChange={(event) => setDialog({ ...dialog, disposal_reason: event.target.value })} className="field mt-2"><option value="">اختر السبب</option><option>بيع</option><option>تلف</option><option>فقدان</option><option>انتهاء عمر</option><option>شطب</option></select></Label><Label t="تاريخ الاستبعاد"><input type="date" value={dialog.disposal_date || ""} onChange={(event) => setDialog({ ...dialog, disposal_date: event.target.value })} className="field mt-2" /></Label><Label t="قيمة الاستبعاد"><input type="number" value={dialog.disposal_value || 0} onChange={(event) => setDialog({ ...dialog, disposal_value: event.target.value })} className="field mt-2" /></Label><Label t="الحالة"><select value={dialog.status || "معتمد"} onChange={(event) => setDialog({ ...dialog, status: event.target.value })} className="field mt-2"><option>قيد المراجعة</option><option>معتمد</option><option>مرفوض</option></select></Label><Label t="ملاحظات"><input value={dialog.notes || ""} onChange={(event) => setDialog({ ...dialog, notes: event.target.value })} className="field mt-2" /></Label></div>}
          <DialogActions close={() => setDialog(null)} saving={saving} />
        </form>
      </div>
    );
  }
}
