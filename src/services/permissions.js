import { adminService } from "./admin";
import { treePermissionsService } from "./treePermissions";
import { isPlatformAdmin } from "./tenant";

export const permissionsService = {
  async loadRolePermissions(roleName) {
    if (!roleName) return [];
    return treePermissionsService.loadRoleNodePermissions(roleName);
  },

  async saveRolePermissions(roleName, rows) {
    if (!roleName) throw new Error("يجب تحديد الدور أولًا");
    return treePermissionsService.saveBulkNodePermissions(roleName, rows);
  },

  async loadLegacyPermissions() {
    return adminService.listPermissions();
  },

  canAccessCompanyRecord(record = {}, currentCompanyId = "") {
    if (isPlatformAdmin()) return true;
    if (!record.company_id || record.company_id === currentCompanyId) return true;
    throw new Error("لا تملك صلاحية الوصول إلى بيانات هذه الشركة");
  },
};
