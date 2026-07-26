export const VALID_ROLE_OPTIONS = [
  "مشرف النظام العام",
  "مدير النظام",
  "الإدارة العليا",
  "مدير إدارة",
  "الموارد البشرية",
  "مدير الفروع",
  "مدير فرع",
  "الموظف",
  "خدمة العملاء",
  "العمليات المصرفية",
  "محاسب",
  "دعم فني",
  "امتثال",
  "مسؤول المخزون",
  "عداد ومراسل",
  "خزينة مركزية",
];

export const ROLE_OPTIONS = VALID_ROLE_OPTIONS;

export const CORRUPTED_ROLE_LABEL = "دور تالف يحتاج معالجة";

const MOJIBAKE_PATTERNS = ["ط§", "ظ„", "ظ…", "ظ†", "╪", "┘", "ي╗"];

const cleanRoleAliases = new Map([
  ["مدير عام النظام", "مشرف النظام العام"],
  ["مشرف المنصة", "مشرف النظام العام"],
  ["Platform Admin", "مشرف النظام العام"],
  ["platform_admin", "مشرف النظام العام"],
  ["مسؤول المخازن", "مسؤول المخزون"],
  ["عداد ومراسلات", "عداد ومراسل"],
  ["عمليات مصرفية", "العمليات المصرفية"],
]);

const mojibakeRoleAliases = new Map([
  ["ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…", "مدير النظام"],
  ["ظ…ط¯ظٹط± ط¹ط§ظ… ط§ظ„ظ†ط¸ط§ظ…", "مشرف النظام العام"],
  ["ظ…ط´ط±ظپ ط§ظ„ظ†ط¸ط§ظ… ط§ظ„ط¹ط§ظ…", "مشرف النظام العام"],
  ["ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©", "الموارد البشرية"],
  ["ظ…ط¯ظٹط± ظپط±ط¹", "مدير فرع"],
  ["ط§ظ„ط¥ط¯ط§ط±ط© ط§ظ„ط¹ظ„ظٹط§", "الإدارة العليا"],
  ["ظ…ط³ط¤ظˆظ„ ط§ظ„ظ…ط®ط²ظˆظ†", "مسؤول المخزون"],
  ["ط§ظ„ظ…ظˆط¸ظپ", "الموظف"],
]);

export const isMojibakeText = (value = "") => {
  const text = String(value || "");
  return MOJIBAKE_PATTERNS.some((pattern) => text.includes(pattern));
};

export const normalizeRoleName = (value = "") => {
  const text = String(value || "").trim();
  if (!text) return null;
  if (cleanRoleAliases.has(text)) return cleanRoleAliases.get(text);
  if (VALID_ROLE_OPTIONS.includes(text)) return text;
  if (isMojibakeText(text)) return mojibakeRoleAliases.get(text) || null;
  return text;
};

export const displayRoleName = (value = "") => {
  const text = String(value || "").trim();
  if (!text) return "غير محدد";
  const normalized = normalizeRoleName(text);
  if (normalized) return normalized;
  return isMojibakeText(text) ? CORRUPTED_ROLE_LABEL : "غير محدد";
};

export const getCleanRoleOptions = (values = []) => {
  const extras = (values || [])
    .map((role) => normalizeRoleName(typeof role === "string" ? role : role?.role_name || role?.role || role?.name))
    .filter((role) => role && !isMojibakeText(role));
  return [...new Set([...VALID_ROLE_OPTIONS, ...extras])].filter((role) => role && !isMojibakeText(role));
};

export const getRoleOptions = getCleanRoleOptions;
