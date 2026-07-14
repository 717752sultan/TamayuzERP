import { supabase } from "./supabase";
import { normalizeCompany, requireCompanyId } from "./tenant";

const companyToDb = (company = {}) => {
  const code = String(company.company_code || "").trim().toUpperCase();
  return {
    company_id: String(company.company_id || `COMP-${code || Date.now()}`).trim(),
    company_code: code,
    company_name: String(company.company_name || "").trim(),
    legal_name: String(company.legal_name || ""),
    logo_url: String(company.logo_url || ""),
    primary_color: String(company.primary_color || "#7f1d1d"),
    secondary_color: String(company.secondary_color || "#374151"),
    address: String(company.address || ""),
    phone: String(company.phone || ""),
    email: String(company.email || ""),
    website: String(company.website || ""),
    tax_number: String(company.tax_number || ""),
    commercial_register: String(company.commercial_register || ""),
    subscription_plan: String(company.subscription_plan || "standard"),
    subscription_status: String(company.subscription_status || "active"),
    max_users: Number(company.max_users || 25),
    max_branches: Number(company.max_branches || 5),
    is_active: company.is_active !== false,
    updated_at: new Date().toISOString(),
  };
};

export const companiesService = {
  async loadCompanies() {
    try {
      const rows = await supabase.select("companies", "select=*&order=created_at.desc");
      return (rows || []).map(normalizeCompany);
    } catch (error) {
      console.error("Tenant/company error:", error);
      throw new Error("فشل تحميل بيانات الشركة: " + error.message);
    }
  },

  async loadCompanyProfile(companyId = requireCompanyId()) {
    try {
      const rows = await supabase.select("companies", `company_id=eq.${encodeURIComponent(companyId)}&select=*&limit=1`);
      if (!rows?.[0]) throw new Error("الشركة غير موجودة");
      return normalizeCompany(rows[0]);
    } catch (error) {
      console.error("Tenant/company error:", error);
      throw new Error("فشل تحميل بيانات الشركة: " + error.message);
    }
  },

  async saveCompany(company) {
    try {
      const payload = companyToDb(company);
      if (!payload.company_code) throw new Error("يجب إدخال كود الشركة");
      if (!payload.company_name) throw new Error("يجب إدخال اسم الشركة");
      const { data, error } = await supabase.from("companies").upsert(payload, { onConflict: "company_id" }).select().single();
      if (error) throw error;
      return normalizeCompany(data);
    } catch (error) {
      console.error("Tenant/company error:", error);
      throw new Error("فشل حفظ بيانات الشركة: " + error.message);
    }
  },

  async deleteOrDeactivateCompany(company) {
    return this.saveCompany({ ...company, is_active: false, subscription_status: "inactive" });
  },

  async createCompanyAdminUser(company, admin = {}) {
    try {
      const normalized = normalizeCompany(company);
      const countRows = await supabase.select("app_users", `company_id=eq.${encodeURIComponent(normalized.company_id)}&select=user_id`);
      if (normalized.max_users && countRows.length >= normalized.max_users) {
        throw new Error("تم تجاوز الحد الأقصى للمستخدمين في باقة الشركة");
      }
      const username = String(admin.username || "admin").trim();
      const payload = {
        user_id: admin.user_id || `USR-${normalized.company_code}-${Date.now()}`,
        company_id: normalized.company_id,
        company_code: normalized.company_code,
        username,
        password: String(admin.password || "123456"),
        name: admin.name || "مدير النظام",
        employee_name: admin.employee_name || admin.name || "مدير النظام",
        employee_id: admin.employee_id || "",
        role: "مدير النظام",
        branch: admin.branch || "المركز الرئيسي",
        job: admin.job || "مدير النظام",
        phone: admin.phone || "",
        email: admin.email || normalized.email || "",
        is_platform_admin: false,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("app_users").upsert(payload, { onConflict: "user_id" }).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Tenant/company error:", error);
      throw error;
    }
  },

  async seedCompanyDefaults(company) {
    try {
      const normalized = normalizeCompany(company);
      const roles = ["مدير النظام", "الموارد البشرية", "مدير فرع", "الإدارة العليا", "مسؤول المخزون", "الموظف"].map((role_name) => ({
        role_id: `ROLE-${normalized.company_code}-${role_name}`,
        company_id: normalized.company_id,
        role_name,
        role_description: "",
        is_system_role: true,
        is_active: true,
      }));
      await supabase.from("app_roles").upsert(roles, { onConflict: "role_id" }).select();
      await supabase.from("hrms_settings").upsert({
        id: `SETTINGS-${normalized.company_id}`,
        company_id: normalized.company_id,
        settings: { branches: ["المركز الرئيسي"], jobs: roles.map((r) => r.role_name) },
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" }).select();
      return true;
    } catch (error) {
      console.error("Tenant/company error:", error);
      return false;
    }
  },

  async createCompanyWithDefaults(company, admin) {
    const savedCompany = await this.saveCompany(company);
    await this.seedCompanyDefaults(savedCompany);
    await this.createCompanyAdminUser(savedCompany, admin);
    return savedCompany;
  },

  subscribe(onChange) {
    return supabase.subscribeToTable("companies", onChange);
  },
};
