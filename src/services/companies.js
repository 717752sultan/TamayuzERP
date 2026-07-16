import { supabase } from "./supabase";
import { normalizeCompany, requireCompanyId } from "./tenant";
import { companyPermissionsService } from "./companyPermissions";

const COMPANY_ADMIN_ROLE = "مدير النظام";

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

const adminUserToCompanyFields = (company = {}, adminUser = null) => ({
  ...company,
  admin_user: adminUser,
  admin_user_id: adminUser?.user_id || adminUser?.id || "",
  admin_username: adminUser?.username || "",
  admin_name: adminUser?.name || adminUser?.employee_name || "",
});

export const companiesService = {
  async loadCompanies() {
    try {
      const rows = await supabase.select("companies", "select=*&order=created_at.desc");
      return (rows || []).map(normalizeCompany);
    } catch (error) {
      console.error("Tenant/company error:", error);
      throw new Error("فشل تحميل بيانات الشركات: " + error.message);
    }
  },

  async loadCompanyAdminUser(companyId) {
    if (!companyId) return null;
    try {
      const rows = await supabase.select(
        "app_users",
        `company_id=eq.${encodeURIComponent(companyId)}&role=eq.${encodeURIComponent(COMPANY_ADMIN_ROLE)}&is_platform_admin=eq.false&is_active=eq.true&select=*&limit=1`,
      );
      return rows?.[0] || null;
    } catch (error) {
      console.error("Tenant/company admin user load error:", error);
      return null;
    }
  },

  async loadCompaniesWithAdminUsers() {
    const rows = await this.loadCompanies();
    return Promise.all(
      rows.map(async (company) => {
        const [adminUser, users] = await Promise.all([
          this.loadCompanyAdminUser(company.company_id),
          supabase.select("app_users", `company_id=eq.${encodeURIComponent(company.company_id)}&select=user_id`).catch(() => []),
        ]);
        return { ...adminUserToCompanyFields(company, adminUser), users_count: users?.length || 0 };
      }),
    );
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

  async ensureUniqueAdminUsername(companyId, username, currentUserId = "") {
    const cleanUsername = String(username || "").trim();
    if (!companyId || !cleanUsername) return;
    const rows = await supabase.select(
      "app_users",
      `company_id=eq.${encodeURIComponent(companyId)}&username=eq.${encodeURIComponent(cleanUsername)}&select=user_id,username&limit=2`,
    );
    const duplicate = (rows || []).some((row) => String(row.user_id || "") !== String(currentUserId || ""));
    if (duplicate) throw new Error("اسم المستخدم موجود مسبقًا داخل هذه الشركة");
  },

  async createCompanyAdminUser(company, admin = {}) {
    const normalized = normalizeCompany(company);
    const countRows = await supabase.select("app_users", `company_id=eq.${encodeURIComponent(normalized.company_id)}&select=user_id`);
    if (normalized.max_users && countRows.length >= normalized.max_users) {
      throw new Error("تم تجاوز الحد الأقصى للمستخدمين في باقة الشركة");
    }
    return this.saveCompanyAdminUser(normalized, admin);
  },

  async saveCompanyAdminUser(company, admin = {}) {
    const normalized = normalizeCompany(company);
    const adminUserId = admin.user_id || admin.admin_user_id || "";
    const existingAdmin = await this.loadCompanyAdminUser(normalized.company_id);
    const currentAdmin = existingAdmin || (adminUserId ? { ...admin, user_id: adminUserId } : null);
    const username = String(admin.username || admin.admin_username || currentAdmin?.username || "admin").trim();
    if (!username) throw new Error("يجب إدخال اسم مستخدم مدير الشركة");
    await this.ensureUniqueAdminUsername(normalized.company_id, username, currentAdmin?.user_id || adminUserId || "");

    const payload = {
      user_id: currentAdmin?.user_id || admin.user_id || `USR-${normalized.company_code}-${Date.now()}`,
      company_id: normalized.company_id,
      company_code: normalized.company_code,
      username,
      password: String(admin.password || admin.admin_password || currentAdmin?.password || "123456"),
      name: String(admin.name || admin.admin_name || currentAdmin?.name || currentAdmin?.employee_name || COMPANY_ADMIN_ROLE).trim(),
      employee_name: String(admin.employee_name || admin.name || admin.admin_name || currentAdmin?.employee_name || currentAdmin?.name || COMPANY_ADMIN_ROLE).trim(),
      employee_id: admin.employee_id || currentAdmin?.employee_id || "",
      role: COMPANY_ADMIN_ROLE,
      branch: admin.branch || currentAdmin?.branch || "المركز الرئيسي",
      job: admin.job || currentAdmin?.job || COMPANY_ADMIN_ROLE,
      phone: admin.phone || currentAdmin?.phone || "",
      email: admin.email || currentAdmin?.email || normalized.email || "",
      is_platform_admin: false,
      is_active: true,
      created_at: currentAdmin?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("app_users").upsert(payload, { onConflict: "user_id" }).select().single();
    if (error) {
      console.error("Tenant/company admin user save error:", error);
      throw new Error(error.message || "تعذر حفظ مستخدم مدير الشركة");
    }
    return data;
  },

  async saveCompanyWithAdminUser(companyPayload, adminPayload = {}) {
    const savedCompany = await this.saveCompany(companyPayload);
    const savedAdmin = await this.saveCompanyAdminUser(savedCompany, adminPayload);
    return adminUserToCompanyFields(savedCompany, savedAdmin);
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
    await companyPermissionsService.seedDefaultCompanyPermissions(savedCompany.company_id).catch((error) => {
      console.error("Tenant/company permissions seed error:", error);
    });
    const savedAdmin = await this.createCompanyAdminUser(savedCompany, admin);
    return adminUserToCompanyFields(savedCompany, savedAdmin);
  },

  subscribe(onChange) {
    return supabase.subscribeToTable("companies", onChange);
  },
};
