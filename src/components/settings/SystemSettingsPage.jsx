import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  X,
} from "lucide-react";
import {
  customSettingDefinitions,
  generalSettingDefinitions,
  normalizeCustomSettings,
  normalizeSystemSettings,
  systemSettingsService,
  validateCustomSetting,
} from "../../services/systemSettings";
import { settingsCurrenciesService } from "../../services/settingsCurrencies";

const tabs = [
  { key: "general", label: "الإعدادات العامة", icon: Settings },
  { key: "custom", label: "الإعدادات المخصصة", icon: SlidersHorizontal },
  { key: "currencies", label: "العملات", icon: CircleDollarSign },
];

const levelLabels = {
  platform: "إعداد منصة",
  company: "إعداد شركة",
  hr: "إعداد موارد بشرية",
  user: "تفضيل مستخدم",
};

const selectLabels = {
  ar: "العربية",
  en: "الإنجليزية",
  "ar-SA": "أرقام عربية",
  "en-US": "أرقام لاتينية",
  saturday: "السبت",
  sunday: "الأحد",
  monday: "الاثنين",
};

const currencyRoleLabels = {
  system_currency_code: "عملة النظام",
  base_salary_currency_code: "عملة الراتب الأساسية",
  default_transaction_currency_code: "عملة المعاملات الافتراضية",
};

const generalSnapshot = (settings = {}) =>
  JSON.stringify(Object.fromEntries(generalSettingDefinitions.map(({ key }) => [key, settings?.[key]])));
const customSnapshot = (settings = {}) => JSON.stringify(normalizeCustomSettings(settings?.custom_settings));
const currencyRoleSnapshot = (settings = {}) => JSON.stringify(settings?.currency_roles || {});
const mergeGeneralSection = (target = {}, source = {}) => ({
  ...target,
  ...Object.fromEntries(generalSettingDefinitions.map(({ key }) => [key, source?.[key]])),
});

const Notice = ({ notice, onClose }) => {
  if (!notice?.text) return null;
  const success = notice.type === "success";
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
      {success ? <CheckCircle2 className="mt-0.5 shrink-0" size={18} /> : <AlertTriangle className="mt-0.5 shrink-0" size={18} />}
      <span className="flex-1 font-bold">{notice.text}</span>
      <button type="button" onClick={onClose} aria-label="إغلاق التنبيه"><X size={17} /></button>
    </div>
  );
};

const SectionLoading = () => (
  <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
    <div className="text-center text-sm font-bold text-slate-500">
      <LoaderCircle className="mx-auto mb-3 animate-spin text-brand-700" />
      جاري تحميل الإعدادات...
    </div>
  </div>
);

const SectionError = ({ message, onRetry }) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
    <AlertTriangle className="mx-auto mb-3" />
    <p className="text-sm font-bold">{message}</p>
    <p className="mt-2 text-xs">لم يتم استخدام LocalStorage أو بيانات افتراضية بديلة.</p>
    <button type="button" onClick={onRetry} className="btn-secondary mt-4"><RefreshCw size={16} /> إعادة المحاولة</button>
  </div>
);

const SectionPermission = ({ text }) => (
  <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
    <ShieldCheck size={18} /> {text}
  </div>
);

export default function SystemSettingsPage({ currentCompany, currentUser, can }) {
  const companyId = currentCompany?.company_id || currentUser?.company_id || "";
  const [activeTab, setActiveTab] = useState("general");
  const [systemSettings, setSystemSettings] = useState(() => normalizeSystemSettings({}));
  const [baselineSettings, setBaselineSettings] = useState(() => normalizeSystemSettings({}));
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState({ system: true, currencies: true });
  const [errors, setErrors] = useState({ system: "", currencies: "" });
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState(null);
  const [currencyDialog, setCurrencyDialog] = useState(null);

  const canView = can?.("system_settings", "can_view") === true;
  const canManageGeneral = can?.("system_settings", "can_edit") === true;
  const canManageCustom = can?.("system_settings", "can_configure") === true;
  const canCreateCurrency = can?.("system_settings", "can_create") === true;
  const canEditCurrency = can?.("system_settings", "can_edit") === true;
  const canDisableCurrency = can?.("system_settings", "can_delete") === true;
  const canConfigureCurrencies = canManageCustom || canEditCurrency;

  const generalDirty = generalSnapshot(systemSettings) !== generalSnapshot(baselineSettings);
  const customDirty = customSnapshot(systemSettings) !== customSnapshot(baselineSettings);
  const currencyRolesDirty = currencyRoleSnapshot(systemSettings) !== currencyRoleSnapshot(baselineSettings);
  const hasUnsavedChanges = generalDirty || customDirty || currencyRolesDirty;
  const dirtyByTab = { general: generalDirty, custom: customDirty, currencies: currencyRolesDirty };

  const activeCurrencies = useMemo(() => currencies.filter((currency) => currency.is_active !== false), [currencies]);
  const protectedCurrencyCodes = useMemo(
    () => Object.values(systemSettings.currency_roles || {}).map((code) => String(code || "").trim().toUpperCase()).filter(Boolean),
    [systemSettings.currency_roles],
  );

  const loadData = async () => {
    if (!companyId) {
      setLoading({ system: false, currencies: false });
      setErrors({ system: "لم يتم تحديد الشركة الحالية", currencies: "لم يتم تحديد الشركة الحالية" });
      return;
    }
    setLoading({ system: true, currencies: true });
    setErrors({ system: "", currencies: "" });
    const [settingsResult, currenciesResult] = await Promise.allSettled([
      systemSettingsService.loadSystemSettings(companyId),
      settingsCurrenciesService.loadCurrencies(companyId),
    ]);
    const loadedCurrencies = currenciesResult.status === "fulfilled" ? currenciesResult.value : [];
    if (currenciesResult.status === "fulfilled") setCurrencies(loadedCurrencies);
    else setErrors((state) => ({ ...state, currencies: currenciesResult.reason?.message || "تعذر تحميل العملات" }));
    if (settingsResult.status === "fulfilled") {
      const loaded = normalizeSystemSettings(settingsResult.value);
      const legacyDefault = loadedCurrencies.find((currency) => currency.is_default && currency.is_active)?.currency_code || "";
      const resolved = legacyDefault && !loaded.currency_roles.default_transaction_currency_code
        ? { ...loaded, currency_roles: { ...loaded.currency_roles, default_transaction_currency_code: legacyDefault } }
        : loaded;
      setSystemSettings(resolved);
      setBaselineSettings(resolved);
    } else {
      setErrors((state) => ({ ...state, system: settingsResult.reason?.message || "تعذر تحميل إعدادات الشركة" }));
    }
    setLoading({ system: false, currencies: false });
  };

  useEffect(() => {
    setNotice(null);
    setCurrencyDialog(null);
    loadData();
  }, [companyId]);

  useEffect(() => {
    const beforeUnload = (event) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasUnsavedChanges]);

  const switchTab = (nextTab) => {
    if (nextTab === activeTab) return;
    if (dirtyByTab[activeTab] && !window.confirm("توجد تعديلات غير محفوظة في هذا القسم. هل تريد الانتقال دون حفظها؟")) return;
    setActiveTab(nextTab);
    setNotice(null);
  };

  const updateSystemSetting = (key, value) => setSystemSettings((state) => ({ ...state, [key]: value }));

  const saveGeneral = async () => {
    if (!canManageGeneral) return setNotice({ type: "error", text: "لا تملك صلاحية إدارة الإعدادات العامة" });
    const displayName = String(systemSettings.company_display_name || "").trim();
    if (!displayName) return setNotice({ type: "error", text: "اسم الشركة الظاهر مطلوب" });
    if (systemSettings.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(systemSettings.contact_email)) {
      return setNotice({ type: "error", text: "صيغة البريد الإلكتروني غير صحيحة" });
    }
    if (systemSettings.logo_url) {
      try { new URL(systemSettings.logo_url); } catch { return setNotice({ type: "error", text: "مرجع الشعار يجب أن يكون رابطًا صحيحًا" }); }
    }
    setSaving("general");
    setNotice(null);
    try {
      const saved = await systemSettingsService.saveGeneralSettings(companyId, systemSettings);
      setSystemSettings((state) => mergeGeneralSection(state, saved));
      setBaselineSettings((state) => mergeGeneralSection(state, saved));
      setNotice({ type: "success", text: "تم حفظ الإعدادات العامة للشركة بنجاح" });
    } catch (error) {
      setNotice({ type: "error", text: error.message || "تعذر حفظ الإعدادات العامة" });
    } finally {
      setSaving("");
    }
  };

  const updateCustomSetting = (key, patch) => {
    setSystemSettings((state) => ({
      ...state,
      custom_settings: normalizeCustomSettings(state.custom_settings).map((row) => row.key === key ? { ...row, ...patch } : row),
    }));
  };

  const saveCustom = async () => {
    if (!canManageCustom) return setNotice({ type: "error", text: "لا تملك صلاحية إدارة الإعدادات المخصصة" });
    const invalid = normalizeCustomSettings(systemSettings.custom_settings)
      .map((row) => ({ row, error: validateCustomSetting(row) }))
      .find((item) => item.error);
    if (invalid) return setNotice({ type: "error", text: `${invalid.row.label_ar}: ${invalid.error}` });
    setSaving("custom");
    setNotice(null);
    try {
      const saved = await systemSettingsService.saveCustomSettings(companyId, systemSettings.custom_settings);
      setSystemSettings((state) => ({ ...state, custom_settings: saved.custom_settings }));
      setBaselineSettings((state) => ({ ...state, custom_settings: saved.custom_settings }));
      setNotice({ type: "success", text: "تم حفظ الإعدادات المخصصة المسموح بها بنجاح" });
    } catch (error) {
      setNotice({ type: "error", text: error.message || "تعذر حفظ الإعدادات المخصصة" });
    } finally {
      setSaving("");
    }
  };

  const saveCurrencyRoles = async () => {
    if (!canConfigureCurrencies) return setNotice({ type: "error", text: "لا تملك صلاحية إدارة إعدادات العملات" });
    const roles = systemSettings.currency_roles || {};
    const missingRole = Object.entries(currencyRoleLabels).find(([key]) => !roles[key]);
    if (activeCurrencies.length && missingRole) return setNotice({ type: "error", text: `يجب تحديد ${missingRole[1]}` });
    setSaving("currency-roles");
    setNotice(null);
    try {
      const defaultCode = roles.default_transaction_currency_code;
      const defaultCurrency = activeCurrencies.find((currency) => currency.currency_code === defaultCode);
      if (defaultCurrency && !defaultCurrency.is_default) {
        const savedDefault = await settingsCurrenciesService.setDefaultCurrency(companyId, defaultCurrency.id, defaultCurrency);
        setCurrencies((rows) => rows.map((row) => row.id === savedDefault.id ? savedDefault : { ...row, is_default: false }));
      }
      const saved = await systemSettingsService.saveCurrencyRoles(companyId, roles, activeCurrencies.map((currency) => currency.currency_code));
      setSystemSettings((state) => ({ ...state, default_currency: saved.default_currency, currency_roles: saved.currency_roles }));
      setBaselineSettings((state) => ({ ...state, default_currency: saved.default_currency, currency_roles: saved.currency_roles }));
      setNotice({ type: "success", text: "تم حفظ أدوار العملات للشركة بنجاح" });
    } catch (error) {
      setNotice({ type: "error", text: error.message || "تعذر حفظ إعدادات العملات" });
    } finally {
      setSaving("");
    }
  };

  const openCurrencyDialog = (currency = null) => {
    setNotice(null);
    setCurrencyDialog(currency ? { mode: "edit", ...currency } : {
      mode: "add",
      currency_code: "",
      currency_name: "",
      currency_symbol: "",
      exchange_rate: 1,
      is_default: false,
      is_active: true,
      notes: "",
    });
  };

  const saveCurrency = async () => {
    const isAdd = currencyDialog?.mode === "add";
    if (isAdd && !canCreateCurrency) return setNotice({ type: "error", text: "لا تملك صلاحية إضافة العملات" });
    if (!isAdd && !canEditCurrency) return setNotice({ type: "error", text: "لا تملك صلاحية تعديل العملات" });
    const code = String(currencyDialog?.currency_code || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{3,6}$/.test(code)) return setNotice({ type: "error", text: "كود العملة يجب أن يتكون من 3 إلى 6 أحرف أو أرقام لاتينية" });
    if (!String(currencyDialog?.currency_name || "").trim()) return setNotice({ type: "error", text: "اسم العملة مطلوب" });
    if (!(Number(currencyDialog?.exchange_rate) > 0)) return setNotice({ type: "error", text: "سعر الصرف يجب أن يكون أكبر من صفر" });
    if (currencyDialog.is_active === false && protectedCurrencyCodes.includes(code)) {
      return setNotice({ type: "error", text: "لا يمكن تعطيل عملة مستخدمة حاليًا. اختر عملة بديلة أولًا" });
    }
    setSaving("currency-item");
    setNotice(null);
    try {
      const payload = { ...currencyDialog, currency_code: code };
      const saved = isAdd
        ? await settingsCurrenciesService.createCurrency(companyId, payload)
        : await settingsCurrenciesService.updateCurrency(companyId, currencyDialog.id, payload);
      setCurrencies((rows) => isAdd ? [...rows, saved].sort((a, b) => a.currency_code.localeCompare(b.currency_code)) : rows.map((row) => row.id === saved.id ? saved : row));
      setCurrencyDialog(null);
      setNotice({ type: "success", text: isAdd ? "تمت إضافة العملة بنجاح" : "تم تعديل العملة بنجاح" });
    } catch (error) {
      setNotice({ type: "error", text: error.message || "تعذر حفظ العملة" });
    } finally {
      setSaving("");
    }
  };

  const disableCurrency = async (currency) => {
    if (!canDisableCurrency) return setNotice({ type: "error", text: "لا تملك صلاحية تعطيل العملات" });
    if (!window.confirm(`هل تريد تعطيل عملة ${currency.currency_name}؟`)) return;
    setSaving(`disable-${currency.id}`);
    setNotice(null);
    try {
      const saved = await settingsCurrenciesService.deleteCurrency(companyId, currency.id, currency, protectedCurrencyCodes);
      setCurrencies((rows) => rows.map((row) => row.id === saved.id ? saved : row));
      setNotice({ type: "success", text: "تم تعطيل العملة مع الاحتفاظ بسجلها" });
    } catch (error) {
      setNotice({ type: "error", text: error.message || "تعذر تعطيل العملة" });
    } finally {
      setSaving("");
    }
  };

  if (!canView) {
    return (
      <div className="panel p-8 text-center" dir="rtl">
        <ShieldCheck className="mx-auto mb-3 text-amber-600" />
        <h2 className="text-xl font-extrabold">لا تملك صلاحية الوصول إلى هذه الصفحة</h2>
      </div>
    );
  }

  const renderGeneralField = (definition) => {
    const value = systemSettings[definition.key] ?? "";
    const disabled = !canManageGeneral || saving === "general" || loading.system || Boolean(errors.system);
    if (definition.type === "boolean") {
      return (
        <label key={definition.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span><b className="block text-sm">{definition.label}</b><small className="text-slate-500">{levelLabels[definition.level]}</small></span>
          <input type="checkbox" checked={value !== false} disabled={disabled} onChange={(event) => updateSystemSetting(definition.key, event.target.checked)} />
        </label>
      );
    }
    return (
      <label key={definition.key} className={definition.type === "textarea" ? "md:col-span-2" : ""}>
        <span className="flex items-center gap-2 text-sm font-bold">{definition.label}<small className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{levelLabels[definition.level]}</small></span>
        {definition.type === "select" ? (
          <select className="field mt-2" value={value} disabled={disabled} onChange={(event) => updateSystemSetting(definition.key, event.target.value)}>
            {(definition.options || []).map((option) => <option key={option} value={option}>{selectLabels[option] || option}</option>)}
          </select>
        ) : definition.type === "textarea" ? (
          <textarea className="field mt-2 !h-auto py-3" rows="3" value={value} disabled={disabled} onChange={(event) => updateSystemSetting(definition.key, event.target.value)} />
        ) : (
          <input className="field mt-2" type={definition.type} required={definition.required} value={value} disabled={disabled} onChange={(event) => updateSystemSetting(definition.key, event.target.value)} />
        )}
      </label>
    );
  };

  const renderCustomInput = (row) => {
    const disabled = !canManageCustom || !row.is_active || !row.is_company_override || saving === "custom";
    if (row.value_type === "boolean") {
      return <input type="checkbox" checked={row.current_value === true} disabled={disabled} onChange={(event) => updateCustomSetting(row.key, { current_value: event.target.checked })} />;
    }
    if (row.value_type === "select") {
      return (
        <select className="field" value={row.current_value} disabled={disabled} onChange={(event) => updateCustomSetting(row.key, { current_value: event.target.value })}>
          {(row.options || []).map((option) => <option key={option.value} value={option.value}>{option.label_ar}</option>)}
        </select>
      );
    }
    return <input className="field" type={row.value_type} value={row.current_value ?? ""} disabled={disabled} onChange={(event) => updateCustomSetting(row.key, { current_value: row.value_type === "number" ? Number(event.target.value) : event.target.value })} />;
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="panel flex flex-col gap-4 p-5 md:flex-row md:items-center">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-700 text-white"><Settings /></div>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold">الإعدادات العامة</h1>
          <p className="mt-1 text-sm text-slate-500">إدارة إعدادات الشركة والإعدادات المخصصة والعملات ضمن الشركة المحددة.</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <b className="block text-slate-800">{currentCompany?.company_name || currentUser?.company_name || "شركة غير محددة"}</b>
          <span>كود الشركة: {currentCompany?.company_code || currentUser?.company_code || "—"}</span>
        </div>
      </div>

      <Notice notice={notice} onClose={() => setNotice(null)} />

      <div className="panel p-2">
        <div className="grid gap-2 sm:grid-cols-3" role="tablist" aria-label="أقسام الإعدادات العامة">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" role="tab" aria-selected={activeTab === key} onClick={() => switchTab(key)} className={`relative flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition ${activeTab === key ? "bg-brand-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>
              <Icon size={18} /> {label}
              {dirtyByTab[key] && <span className="absolute left-3 h-2 w-2 rounded-full bg-amber-400" title="تعديلات غير محفوظة" />}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "general" && (
        <div className="panel space-y-5 p-5">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div><h2 className="text-lg font-extrabold">الإعدادات العامة</h2><p className="mt-1 text-xs text-slate-500">قيم خاصة بالشركة محفوظة في `company_settings`. كود الشركة والهوية الإدارية غير قابلين للتعديل من هنا.</p></div>
            <button type="button" onClick={saveGeneral} disabled={!canManageGeneral || !generalDirty || saving === "general" || Boolean(errors.system)} className="btn-primary sm:mr-auto disabled:cursor-not-allowed disabled:opacity-50">
              {saving === "general" ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />} حفظ الإعدادات العامة
            </button>
          </div>
          {!canManageGeneral && <SectionPermission text="يمكنك عرض الإعدادات العامة، لكن لا تملك صلاحية تعديلها." />}
          {loading.system ? <SectionLoading /> : (
            <>
              {errors.system && <SectionError message={errors.system} onRetry={loadData} />}
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <div><span className="text-xs text-slate-500">الاسم الرسمي للشركة</span><b className="mt-1 block text-sm">{currentCompany?.legal_name || currentCompany?.company_name || "غير محدد"}</b></div>
                <div><span className="text-xs text-slate-500">كود الشركة — إعداد محمي</span><b className="mt-1 block font-mono text-sm">{currentCompany?.company_code || "غير محدد"}</b></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">{generalSettingDefinitions.map(renderGeneralField)}</div>
              <div className="grid gap-3 text-xs sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3"><b>إعدادات المنصة</b><p className="mt-1 text-slate-500">غير قابلة للتعديل لمستخدمي الشركة.</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><b>إعدادات HR</b><p className="mt-1 text-slate-500">تبقى في صفحة إعدادات الموارد البشرية المنفصلة.</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><b>تفضيلات المستخدم</b><p className="mt-1 text-slate-500">ليست جزءًا من إعدادات الشركة في هذه الدفعة.</p></div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "custom" && (
        <div className="panel space-y-5 p-5">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div><h2 className="text-lg font-extrabold">الإعدادات المخصصة</h2><p className="mt-1 text-xs text-slate-500">قائمة مقيدة بمفاتيح آمنة؛ لا يمكن إنشاء مفتاح يغير الدخول أو الشركة أو الصلاحيات.</p></div>
            <button type="button" onClick={saveCustom} disabled={!canManageCustom || !customDirty || saving === "custom" || Boolean(errors.system)} className="btn-primary sm:mr-auto disabled:cursor-not-allowed disabled:opacity-50">
              {saving === "custom" ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />} حفظ الإعدادات المخصصة
            </button>
          </div>
          {!canManageCustom && <SectionPermission text="إدارة الإعدادات المخصصة تتطلب صلاحية إدارة/تهيئة الإعدادات، ولا تكفي صلاحية عرض الصفحة." />}
          {loading.system ? <SectionLoading /> : errors.system ? <SectionError message={errors.system} onRetry={loadData} /> : (
            <div className="space-y-3">
              {normalizeCustomSettings(systemSettings.custom_settings).map((row) => {
                const definition = customSettingDefinitions.find((item) => item.key === row.key);
                const validationError = validateCustomSetting(row);
                return (
                  <div key={row.key} className="rounded-2xl border border-slate-200 p-4">
                    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_auto_auto] lg:items-center">
                      <div><div className="flex flex-wrap items-center gap-2"><b className="text-sm">{row.label_ar}</b><span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">{row.key}</span></div><p className="mt-1 text-xs text-slate-500">{row.label_en} • {row.group} • النوع: {row.value_type}</p></div>
                      <div>{renderCustomInput(row)}{validationError && <p className="mt-1 text-xs font-bold text-red-600">{validationError}</p>}</div>
                      <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={row.is_company_override} disabled={!canManageCustom || saving === "custom"} onChange={(event) => updateCustomSetting(row.key, { is_company_override: event.target.checked })} /> تخصيص للشركة</label>
                      <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={row.is_active} disabled={!canManageCustom || saving === "custom"} onChange={(event) => updateCustomSetting(row.key, { is_active: event.target.checked })} /> فعال</label>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">القيمة الافتراضية: {String(definition?.default_value ?? "—")}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "currencies" && (
        <div className="space-y-5">
          <div className="panel space-y-5 p-5">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
              <div><h2 className="text-lg font-extrabold">أدوار العملات</h2><p className="mt-1 text-xs text-slate-500">عملة واحدة لكل دور، ويجب أن تكون العملة المختارة مفعلة.</p></div>
              <button type="button" onClick={saveCurrencyRoles} disabled={!canConfigureCurrencies || !currencyRolesDirty || saving === "currency-roles" || Boolean(errors.system || errors.currencies)} className="btn-primary sm:mr-auto disabled:cursor-not-allowed disabled:opacity-50">
                {saving === "currency-roles" ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />} حفظ أدوار العملات
              </button>
            </div>
            {!canConfigureCurrencies && <SectionPermission text="يمكنك عرض العملات، لكن ضبط عملة النظام والراتب والمعاملات يتطلب صلاحية تعديل/تهيئة الإعدادات." />}
            {loading.system || loading.currencies ? <SectionLoading /> : errors.system || errors.currencies ? <SectionError message={errors.system || errors.currencies} onRetry={loadData} /> : activeCurrencies.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">لا توجد عملات مفعلة. أضف عملة أو فعّل عملة قائمة أولًا.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(currencyRoleLabels).map(([key, label]) => (
                  <label key={key}><span className="text-sm font-bold">{label}</span><select className="field mt-2" value={systemSettings.currency_roles?.[key] || ""} disabled={!canConfigureCurrencies || saving === "currency-roles"} onChange={(event) => setSystemSettings((state) => ({ ...state, currency_roles: { ...state.currency_roles, [key]: event.target.value } }))}><option value="">اختر العملة</option>{activeCurrencies.map((currency) => <option key={currency.id || currency.currency_code} value={currency.currency_code}>{currency.currency_name} ({currency.currency_code})</option>)}</select></label>
                ))}
              </div>
            )}
          </div>

          <div className="panel space-y-4 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div><h2 className="text-lg font-extrabold">العملات المفعلة</h2><p className="mt-1 text-xs text-slate-500">لا يتم حذف سجل العملة؛ التعطيل يحافظ على التاريخ.</p></div><button type="button" onClick={() => openCurrencyDialog()} disabled={!canCreateCurrency || Boolean(errors.currencies)} className="btn-primary sm:mr-auto disabled:opacity-50"><Plus size={17} /> إضافة عملة</button></div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">الاسم الإنجليزي والدقة العشرية غير قابلين للحفظ في هذه الدفعة لأن أعمدتهما غير مثبتة في مخطط `currencies` الحالي. لم تُرسل أي أعمدة غير مؤكدة إلى Supabase.</div>
            {loading.currencies ? <SectionLoading /> : errors.currencies ? <SectionError message={errors.currencies} onRetry={loadData} /> : currencies.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500"><CircleDollarSign className="mx-auto mb-3" />لا توجد عملات مسجلة لهذه الشركة.</div>
            ) : (
              <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b bg-slate-50 text-right"><th className="p-3">الكود</th><th className="p-3">اسم العملة</th><th className="p-3">الرمز</th><th className="p-3">سعر الصرف</th><th className="p-3">الحالة</th><th className="p-3">الاستخدام</th><th className="p-3">الإجراءات</th></tr></thead><tbody>{currencies.map((currency) => { const roles = Object.entries(currencyRoleLabels).filter(([key]) => systemSettings.currency_roles?.[key] === currency.currency_code).map(([, label]) => label); return <tr key={currency.id || currency.currency_code} className="border-b last:border-0"><td className="p-3 font-mono font-bold">{currency.currency_code}</td><td className="p-3 font-bold">{currency.currency_name}</td><td className="p-3">{currency.currency_symbol || "—"}</td><td className="p-3">{currency.exchange_rate}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${currency.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{currency.is_active ? "نشطة" : "معطلة"}</span></td><td className="p-3 text-xs text-slate-500">{roles.join("، ") || "—"}</td><td className="p-3"><div className="flex gap-2"><button type="button" onClick={() => openCurrencyDialog(currency)} disabled={!canEditCurrency} className="btn-secondary !h-9 !px-3 disabled:opacity-40"><Pencil size={15} /> تعديل</button>{currency.is_active && <button type="button" onClick={() => disableCurrency(currency)} disabled={!canDisableCurrency || saving === `disable-${currency.id}`} className="inline-flex h-9 items-center gap-1 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-600 disabled:opacity-40"><ToggleLeft size={15} /> تعطيل</button>}</div></td></tr>; })}</tbody></table></div>
            )}
          </div>
        </div>
      )}

      {currencyDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="panel w-full max-w-lg p-6">
            <div className="mb-5 flex items-center"><div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><CircleDollarSign size={20} /></div><div className="mr-3"><h3 className="font-extrabold">{currencyDialog.mode === "add" ? "إضافة عملة" : "تعديل العملة"}</h3><p className="text-xs text-slate-500">بيانات الشركة الحالية فقط</p></div><button type="button" onClick={() => setCurrencyDialog(null)} className="mr-auto" aria-label="إغلاق"><X /></button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="text-sm font-bold">كود العملة</span><input autoFocus className="field mt-2" value={currencyDialog.currency_code || ""} disabled={currencyDialog.mode === "edit"} onChange={(event) => setCurrencyDialog((state) => ({ ...state, currency_code: event.target.value.toUpperCase() }))} /></label>
              <label><span className="text-sm font-bold">اسم العملة بالعربية</span><input className="field mt-2" value={currencyDialog.currency_name || ""} onChange={(event) => setCurrencyDialog((state) => ({ ...state, currency_name: event.target.value }))} /></label>
              <label><span className="text-sm font-bold">رمز العملة</span><input className="field mt-2" value={currencyDialog.currency_symbol || ""} onChange={(event) => setCurrencyDialog((state) => ({ ...state, currency_symbol: event.target.value }))} /></label>
              <label><span className="text-sm font-bold">سعر الصرف اليدوي</span><input type="number" min="0.000001" step="0.0001" className="field mt-2" value={currencyDialog.exchange_rate ?? 1} onChange={(event) => setCurrencyDialog((state) => ({ ...state, exchange_rate: event.target.value }))} /></label>
              <label><span className="text-sm font-bold">الحالة</span><select className="field mt-2" value={String(currencyDialog.is_active !== false)} onChange={(event) => setCurrencyDialog((state) => ({ ...state, is_active: event.target.value === "true" }))}><option value="true">نشطة</option><option value="false">معطلة</option></select></label>
              <label className="sm:col-span-2"><span className="text-sm font-bold">ملاحظات</span><textarea rows="3" className="field mt-2 !h-auto py-3" value={currencyDialog.notes || ""} onChange={(event) => setCurrencyDialog((state) => ({ ...state, notes: event.target.value }))} /></label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setCurrencyDialog(null)} className="btn-secondary">إلغاء</button><button type="button" onClick={saveCurrency} disabled={saving === "currency-item"} className="btn-primary disabled:opacity-50">{saving === "currency-item" ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />} حفظ</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
