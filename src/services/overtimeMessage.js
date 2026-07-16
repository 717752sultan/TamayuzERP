import { supabase } from "./supabase";

const arabicDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const preferredBranchOrder = [
  "الإدارة",
  "فرع شارع صنعاء",
  "فرع الشبواني",
  "فرع الروضة",
  "المركز الرئيسي",
  "الصمدة",
];

export const formatDateDMY = (date) => {
  if (!date) return "";
  const [year, month, day] = String(date).slice(0, 10).split("-");
  if (!year || !month || !day) return String(date);
  return `${day}-${month}-${year}`;
};

export const getArabicDayName = (date) => {
  if (!date) return "";
  const parsed = new Date(`${String(date).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return arabicDays[parsed.getDay()] || "";
};

export const buildMessageTitle = (date, messageType = "tomorrow", customTitle = "") => {
  const dayName = getArabicDayName(date);
  const formattedDate = formatDateDMY(date);

  if (messageType === "custom") {
    const template = customTitle || "✨ جدول الدوام الإضافي {dayName} ({date}) ✨";
    return template.replaceAll("{dayName}", dayName).replaceAll("{date}", formattedDate);
  }

  if (messageType === "today") {
    return `✨ جدول العمل لهذا اليوم ${dayName} (${formattedDate}) ✨`;
  }

  return `✨ جدول العمل ليوم غدٍ ${dayName} (${formattedDate}) ✨`;
};

export const normalizeBranchName = (branch = "") => {
  const value = String(branch || "").trim();
  if (!value) return "غير محدد";
  if (["الإدارة", "الادارة", "Administration"].some((item) => value.includes(item))) return "الإدارة";
  if (value.includes("شارع صنعاء")) return "فرع شارع صنعاء";
  if (value.includes("الشبواني")) return "فرع الشبواني";
  if (value.includes("الروضة")) return "فرع الروضة";
  if (value.includes("المركز") || value.includes("الرئيسي")) return "المركز الرئيسي";
  if (value.includes("الصمدة")) return "الصمدة";
  return value;
};

const dateOf = (row = {}) =>
  String(row.assignment_date || row.overtime_date || row.work_date || row.date || row.start_date || "").slice(0, 10);

const assignmentIdOf = (row = {}) => row.assignment_id || row.assignmentId || row.id || "";

const findEmployee = (employees = [], employeeId = "") =>
  employees.find((employee) => String(employee.id || employee.employee_id || "") === String(employeeId || ""));

const calculateHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = String(startTime).split(":").map(Number);
  const [eh, em] = String(endTime).split(":").map(Number);
  if ([sh, sm, eh, em].some((value) => Number.isNaN(value))) return 0;
  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end <= start) end += 24 * 60;
  return Number(((end - start) / 60).toFixed(2));
};

export const normalizeOvertimeEmployeeRow = (row = {}, employeeRecord = {}, assignment = {}) => {
  const start = row.start_time || row.startTime || assignment.start_time || "";
  const end = row.end_time || row.endTime || assignment.end_time || "";
  const hours = Number(row.total_hours || row.hours || assignment.total_hours || calculateHours(start, end) || 0);

  return {
    id: row.id || `${assignment.assignment_id || row.assignment_id || "OT"}-${row.employee_id || employeeRecord.id || Date.now()}`,
    assignment_id: row.assignment_id || assignment.assignment_id || "",
    employee_id: row.employee_id || row.employeeId || employeeRecord.id || employeeRecord.employee_id || "",
    employee_name: row.employee_name || row.employeeName || employeeRecord.name || employeeRecord.employee_name || "غير محدد",
    branch: normalizeBranchName(row.branch || assignment.branch || employeeRecord.branch || ""),
    job: row.job || employeeRecord.job || "",
    assignment_date: dateOf(row) || dateOf(assignment),
    start_time: start,
    end_time: end,
    total_hours: hours,
    status: row.status || assignment.approval_status || "مكلف",
  };
};

export async function loadOvertimeEmployeesByDate(companyId, assignmentDate, filters = {}) {
  if (!companyId) throw new Error("لم يتم تحديد الشركة الحالية");
  if (!assignmentDate) return [];

  try {
    const [assignmentsRaw, assignmentEmployeesRaw, employeesRaw] = await Promise.all([
      supabase.select("overtime_assignments", `select=*&company_id=eq.${encodeURIComponent(companyId)}`).catch((error) => {
        console.error("Overtime message generator error:", error);
        return [];
      }),
      supabase.select("overtime_assignment_employees", `select=*&company_id=eq.${encodeURIComponent(companyId)}`).catch((error) => {
        console.error("Overtime message generator error:", error);
        return [];
      }),
      supabase.select("employees", `select=id,name,branch,job,phone,status&company_id=eq.${encodeURIComponent(companyId)}`).catch((error) => {
        console.error("Overtime message generator employees fallback error:", error);
        return [];
      }),
    ]);

    const assignments = (Array.isArray(assignmentsRaw) ? assignmentsRaw : []).filter((row) => dateOf(row) === assignmentDate);
    const assignmentIds = new Set(assignments.map(assignmentIdOf).filter(Boolean));
    const assignmentsById = new Map(assignments.map((row) => [assignmentIdOf(row), row]));
    const assignmentEmployees = Array.isArray(assignmentEmployeesRaw) ? assignmentEmployeesRaw : [];
    const directDateRows = assignmentEmployees.filter((row) => dateOf(row) === assignmentDate);
    const linkedRows = assignmentEmployees.filter((row) => assignmentIds.has(row.assignment_id || row.assignmentId));
    const employees = Array.isArray(employeesRaw) ? employeesRaw : [];

    const normalized = [...directDateRows, ...linkedRows]
      .map((row) => {
        const assignment = assignmentsById.get(row.assignment_id || row.assignmentId) || {};
        const employee = findEmployee(employees, row.employee_id || row.employeeId);
        return normalizeOvertimeEmployeeRow(row, employee, assignment);
      })
      .filter((row) => row.assignment_date === assignmentDate);

    const approvedOnly = filters.approvedOnly === true;
    const showCanceled = filters.showCanceled === true;
    const filtered = normalized.filter((row) => {
      const status = String(row.status || "");
      if (!showCanceled && (status.includes("ملغي") || status.includes("مرفوض"))) return false;
      if (approvedOnly && !(status.includes("معتمد") || status.includes("تم الإرسال") || status.includes("مكلف"))) return false;
      return true;
    });

    const uniqueRows = new Map();
    filtered.forEach((row) => {
      const key = `${row.assignment_id}-${row.employee_id}-${row.start_time}-${row.end_time}`;
      if (!uniqueRows.has(key)) uniqueRows.set(key, row);
    });

    return Array.from(uniqueRows.values());
  } catch (error) {
    console.error("Overtime message generator error:", error);
    throw new Error("تعذر تحميل موظفي الدوام الإضافي");
  }
}

export const groupOvertimeEmployeesByBranch = (rows = []) =>
  (Array.isArray(rows) ? rows : []).reduce((acc, row) => {
    const branch = normalizeBranchName(row.branch);
    acc[branch] = acc[branch] || [];
    acc[branch].push(row);
    return acc;
  }, {});

export const sortBranches = (branchGroups = {}) => {
  const entries = Object.entries(branchGroups || {});
  return entries.sort(([a], [b]) => {
    const ai = preferredBranchOrder.indexOf(a);
    const bi = preferredBranchOrder.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b, "ar");
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
};

const branchIcon = (branch) => {
  if (branch === "الإدارة") return "🏢";
  if (branch === "المركز الرئيسي") return "🏛";
  return "📌";
};

const employeeLine = (row, index, showTimes = false) => {
  const name = row.employee_name || "غير محدد";
  if (!showTimes || (!row.start_time && !row.end_time)) return `${index + 1}. *${name}*`;

  const time = `${row.start_time || ""}${row.start_time || row.end_time ? " إلى " : ""}${row.end_time || ""}`.trim();
  const hours = Number(row.total_hours || 0) > 0 ? ` (${row.total_hours} ساعات)` : "";
  return `${index + 1}. *${name}* — ${time}${hours}`;
};

export function generateOvertimeWhatsAppMessage({
  assignmentDate,
  rows,
  messageType = "tomorrow",
  customTitle = "",
  companyName = "",
  showTimes = false,
} = {}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) {
    return "لا يوجد موظفون مكلفون بدوام إضافي في هذا التاريخ.";
  }

  const groups = sortBranches(groupOvertimeEmployeesByBranch(safeRows));
  const title = buildMessageTitle(assignmentDate, messageType, customTitle);
  const sections = groups
    .map(([branch, branchRows]) => {
      const deduped = [];
      const seen = new Set();

      for (const row of branchRows || []) {
        const key = showTimes ? `${row.employee_id}-${row.start_time}-${row.end_time}` : `${row.employee_id || row.employee_name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(row);
      }

      if (!deduped.length) return "";
      return `${branchIcon(branch)} *${branch}* :\n${deduped.map((row, index) => employeeLine(row, index, showTimes)).join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return `_*السلام عليكم ورحمة الله وبركاته*_ .\n${title}${companyName ? `\n${companyName}` : ""}\n\n${sections}`;
}

export async function copyTextToClipboard(text) {
  if (!navigator?.clipboard?.writeText) throw new Error("clipboard unavailable");
  await navigator.clipboard.writeText(text || "");
  return true;
}
