import { supabase } from "./supabase";

const requireCompany = (companyId) => {
  const id = String(companyId || "").trim();
  if (!id) throw new Error("لم يتم تحديد الشركة الحالية");
  return id;
};

export const generalSettingDefinitions = [
  { key: "company_display_name", label: "اسم العرض للشركة", type: "text", level: "company", required: true },
  { key: "country", label: "الدولة", type: "text", level: "company" },
  { key: "city", label: "المدينة", type: "text", level: "company" },
  { key: "time_zone", label: "المنطقة الزمنية", type: "select", level: "company", options: ["Asia/Riyadh", "Asia/Aden", "Asia/Dubai", "UTC"] },
  { key: "default_language", label: "لغة التطبيق", type: "select", level: "company", options: ["ar", "en"] },
  { key: "date_format", label: "تنسيق التاريخ", type: "select", level: "company", options: ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"] },
  { key: "number_format", label: "تنسيق الأرقام", type: "select", level: "company", options: ["ar-SA", "en-US"] },
  { key: "first_day_of_week", label: "أول يوم في الأسبوع", type: "select", level: "company", options: ["saturday", "sunday", "monday"] },
  { key: "contact_phone", label: "هاتف الشركة", type: "tel", level: "company" },
  { key: "contact_email", label: "البريد الإلكتروني", type: "email", level: "company" },
  { key: "contact_address", label: "عنوان الشركة", type: "textarea", level: "company" },
  { key: "logo_url", label: "شعار الشركة (رابط عند توفره)", type: "url", level: "company" },
  { key: "report_header_title", label: "عنوان ترويسة التقارير", type: "text", level: "company" },
  { key: "report_footer_note", label: "تذييل التقارير", type: "textarea", level: "company" },
  { key: "enable_notifications", label: "تفعيل إشعارات النظام", type: "boolean", level: "company" },
];

export const customSettingDefinitions = [
  {
    group: "واجهة النظام",
    key: "records_page_size",
    label_ar: "عدد السجلات في الصفحة",
    label_en: "Records per page",
    value_type: "number",
    default_value: 25,
    validation: { min: 10, max: 200 },
  },
  {
    group: "واجهة النظام",
    key: "show_inactive_records",
    label_ar: "إظهار السجلات غير النشطة افتراضيًا",
    label_en: "Show inactive records by default",
    value_type: "boolean",
    default_value: false,
    validation: {},
  },
  {
    group: "الترقيم والمراجع",
    key: "internal_reference_prefix",
    label_ar: "بادئة المرجع الداخلي",
    label_en: "Internal reference prefix",
    value_type: "text",
    default_value: "HR",
    validation: { maxLength: 12, pattern: "^[A-Za-z0-9-]+$" },
  },
  {
    group: "التقويم",
    key: "weekend_day",
    label_ar: "يوم العطلة الأسبوعية الافتراضي",
    label_en: "Default weekend day",
    value_type: "select",
    default_value: "friday",
    options: [
      { value: "friday", label_ar: "الجمعة", label_en: "Friday" },
      { value: "saturday", label_ar: "السبت", label_en: "Saturday" },
      { value: "sunday", label_ar: "الأحد", label_en: "Sunday" },
    ],
    validation: {},
  },
  {
    group: "التقويم",
    key: "operational_year_start",
    label_ar: "تاريخ بداية السنة التشغيلية",
    label_en: "Operational year start",
    value_type: "date",
    default_value: "",
    validation: {},
  },
];

const currencyRoleDefaults = {
  system_currency_code: "",
  base_salary_currency_code: "",
  default_transaction_currency_code: "",
};

export const systemSettingsDefaults = {
  schema_version: 1,
  company_display_name: "",
  country: "",
  city: "",
  default_language: "ar",
  default_currency: "YER",
  date_format: "YYYY-MM-DD",
  number_format: "ar-SA",
  first_day_of_week: "saturday",
  time_zone: "Asia/Riyadh",
  contact_phone: "",
  contact_email: "",
  contact_address: "",
  report_header_title: "",
  report_footer_note: "",
  logo_url: "",
  primary_color: "#7f1d1d",
  secondary_color: "#374151",
  enable_notifications: true,
  custom_settings: [],
  currency_roles: currencyRoleDefaults,
};

const customDefinitionByKey = Object.fromEntries(customSettingDefinitions.map((definition) => [definition.key, definition]));

const normalizeCustomValue = (definition, value) => {
  if (definition.value_type === "boolean") return value === true;
  if (definition.value_type === "number") {
    const number = Number(value);
    return Number.isFinite(number) ? number : Number(definition.default_value || 0);
  }
  return String(value ?? definition.default_value ?? "");
};

export const normalizeCustomSettings = (rows = []) => {
  const existing = new Map((Array.isArray(rows) ? rows : []).map((row) => [String(row?.key || "").trim(), row]));
  return customSettingDefinitions.map((definition) => {
    const row = existing.get(definition.key) || {};
    return {
      group: definition.group,
      key: definition.key,
      label_ar: definition.label_ar,
      label_en: definition.label_en,
      value_type: definition.value_type,
      current_value: normalizeCustomValue(definition, row.current_value ?? row.value ?? definition.default_value),
      default_value: definition.default_value,
      options: definition.options || [],
      validation: definition.validation || {},
      is_company_override: row.is_company_override === true,
      is_active: row.is_active !== false,
    };
  });
};

export const validateCustomSetting = (row = {}) => {
  const definition = customDefinitionByKey[row.key];
  if (!definition) return "مفتاح الإعداد غير مسموح";
  if (!row.is_active || !row.is_company_override) return "";
  const value = normalizeCustomValue(definition, row.current_value);
  const validation = definition.validation || {};
  if (definition.value_type === "number") {
    if (validation.min !== undefined && value < validation.min) return `القيمة يجب ألا تقل عن ${validation.min}`;
    if (validation.max !== undefined && value > validation.max) return `القيمة يجب ألا تزيد على ${validation.max}`;
  }
  if (validation.maxLength && String(value).length > validation.maxLength) return `القيمة يجب ألا تتجاوز ${validation.maxLength} حرفًا`;
  if (validation.pattern && value && !new RegExp(validation.pattern).test(String(value))) return "صيغة القيمة غير صحيحة";
  if (definition.value_type === "select" && !definition.options.some((option) => option.value === value)) return "القيمة المختارة غير مسموحة";
  return "";
};

export const normalizeSystemSettings = (settings = {}) => ({
  ...systemSettingsDefaults,
  ...(settings || {}),
  schema_version: Number(settings?.schema_version || systemSettingsDefaults.schema_version),
  custom_settings: normalizeCustomSettings(settings?.custom_settings),
  currency_roles: { ...currencyRoleDefaults, ...(settings?.currency_roles || {}) },
});

const generalSettingKeys = new Set(generalSettingDefinitions.map((definition) => definition.key));

export const systemSettingsService = {
  async loadSystemSettings(companyId) {
    try {
      requireCompany(companyId);
      const rows = await supabase.select("company_settings", `company_id=eq.${encodeURIComponent(companyId)}&select=*`);
      return normalizeSystemSettings(rows?.[0]?.settings || {});
    } catch (error) {
      console.error("Supabase company_settings load error:", error);
      throw new Error("تعذر تحميل إعدادات الشركة من Supabase: " + error.message);
    }
  },

  async saveSystemSettings(companyId, settings = {}) {
    try {
      const payload = {
        company_id: requireCompany(companyId),
        settings: normalizeSystemSettings(settings),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("company_settings").upsert(payload, { onConflict: "company_id" }).select().single();
      if (error) throw error;
      return normalizeSystemSettings(data?.settings || payload.settings);
    } catch (error) {
      console.error("Supabase company_settings save error:", error);
      throw new Error("تعذر حفظ إعدادات الشركة في Supabase: " + error.message);
    }
  },

  async saveGeneralSettings(companyId, patch = {}) {
    const current = await this.loadSystemSettings(companyId);
    const safePatch = {};
    generalSettingKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(patch, key)) safePatch[key] = patch[key];
    });
    return this.saveSystemSettings(companyId, { ...current, ...safePatch });
  },

  async saveCustomSettings(companyId, rows = []) {
    const normalized = normalizeCustomSettings(rows);
    const invalid = normalized.map((row) => ({ row, error: validateCustomSetting(row) })).find((item) => item.error);
    if (invalid) throw new Error(`${invalid.row.label_ar}: ${invalid.error}`);
    const current = await this.loadSystemSettings(companyId);
    return this.saveSystemSettings(companyId, { ...current, custom_settings: normalized });
  },

  async saveCurrencyRoles(companyId, roles = {}, activeCurrencyCodes = []) {
    const activeCodes = new Set((activeCurrencyCodes || []).map((code) => String(code || "").trim().toUpperCase()).filter(Boolean));
    const safeRoles = Object.fromEntries(Object.keys(currencyRoleDefaults).map((key) => [key, String(roles?.[key] || "").trim().toUpperCase()]));
    if (activeCodes.size) {
      const invalidCode = Object.values(safeRoles).find((code) => code && !activeCodes.has(code));
      if (invalidCode) throw new Error(`العملة ${invalidCode} غير مفعلة أو غير موجودة داخل الشركة الحالية`);
    }
    const current = await this.loadSystemSettings(companyId);
    return this.saveSystemSettings(companyId, {
      ...current,
      default_currency: safeRoles.default_transaction_currency_code || current.default_currency,
      currency_roles: safeRoles,
    });
  },

  subscribe(onChange) {
    return supabase.subscribeToTable("company_settings", onChange);
  },
};
