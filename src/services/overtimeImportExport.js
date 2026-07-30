import * as XLSX from "xlsx";
import { overtimeService, calculateOvertimeHours } from "./overtime";
import { parseOperationDate } from "./dailyOperationsImportExport";
import { exportWorkbook } from "./reportExport";

const templateHeaders = ["رقم الموظف", "اسم الموظف", "الفرع", "التاريخ", "من الساعة", "إلى الساعة", "عدد الساعات", "نوع التكليف", "سبب التكليف", "الحالة", "ملاحظات"];
const value = (row, keys) => keys.map((k) => row[k]).find((v) => v !== undefined && v !== null && String(v).trim() !== "") || "";
const timeOnly = (input) => {
  if (typeof input === "number") {
    const minutes = Math.round(input * 24 * 60);
    return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  }
  const match = String(input || "").match(/(\d{1,2}):(\d{2})/);
  return match ? `${String(match[1]).padStart(2, "0")}:${match[2]}` : "";
};

export const downloadOvertimeTemplate = () => exportWorkbook([{ name: "تكليفات العمل الإضافي", rows: [Object.fromEntries(templateHeaders.map((h) => [h, ""]))] }], "overtime-template.xlsx");

export const parseOvertimeExcel = async (file, employees = []) => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "", blankrows: false, raw: true });
  return rawRows.map((raw, index) => {
    const employeeId = String(value(raw, ["رقم الموظف", "employee_id", "id"])).trim();
    const employee = employees.find((e) => String(e.id) === employeeId || String(e.name) === String(value(raw, ["اسم الموظف", "employee_name", "name"])).trim());
    const date = parseOperationDate(value(raw, ["التاريخ", "overtime_date", "assignment_date", "date"]));
    const start = timeOnly(value(raw, ["من الساعة", "start_time"]));
    const end = timeOnly(value(raw, ["إلى الساعة", "end_time"]));
    const row = {
      rowNumber: index + 2,
      employee_id: employeeId || employee?.id || "",
      employee_name: String(value(raw, ["اسم الموظف", "employee_name", "name"]) || employee?.name || ""),
      branch: String(value(raw, ["الفرع", "branch"]) || employee?.branch || ""),
      assignment_date: date,
      start_time: start,
      end_time: end,
      total_hours: Number(value(raw, ["عدد الساعات", "hours"]) || calculateOvertimeHours(start, end)),
      overtime_type: String(value(raw, ["نوع التكليف", "overtime_type"]) || "تكليف إضافي"),
      reason: String(value(raw, ["سبب التكليف", "reason"])),
      status: String(value(raw, ["الحالة", "status"]) || "مكلف"),
      notes: String(value(raw, ["ملاحظات", "notes"])),
    };
    const errors = [];
    if (!row.assignment_date) errors.push("التاريخ مطلوب أو غير صحيح");
    if (!row.employee_id && !row.employee_name) errors.push("رقم الموظف أو اسم الموظف مطلوب");
    if (!employee) errors.push("لم يتم العثور على الموظف داخل الشركة الحالية");
    return { ...row, employee_name: employee?.name || row.employee_name, branch: row.branch || employee?.branch || "", valid: errors.length === 0, errors };
  });
};

export const saveOvertimeImportRows = async (rows = [], currentUser, duplicateMode = "update") => {
  const validRows = rows.filter((r) => r.valid);
  let inserted = 0;
  let updated = 0;
  for (const row of validRows) {
    const assignmentId = `OT-${row.assignment_date}-${row.branch || "ALL"}-${row.start_time || "00"}-${row.end_time || "00"}`.replace(/\s+/g, "-");
    const employeeRowId = `${assignmentId}-${row.employee_id}`;
    if (duplicateMode === "skip") {
      const existing = await overtimeService.listAssignmentEmployees().then((list) => list.find((x) => x.id === employeeRowId)).catch(() => null);
      if (existing) continue;
    }
    await overtimeService.createAssignment({
      assignment_id: duplicateMode === "new" ? `${assignmentId}-${Date.now()}` : assignmentId,
      assignment_date: row.assignment_date,
      branch: row.branch,
      start_time: row.start_time,
      end_time: row.end_time,
      reason: row.reason,
      notes: row.notes,
      created_by: currentUser?.username || currentUser?.id || "system",
      employees: [{ id: employeeRowId, ...row }],
    }, [{ id: employeeRowId, ...row }]);
    if (duplicateMode === "update") updated += 1; else inserted += 1;
  }
  return { totalRows: rows.length, validRows: validRows.length, invalidRows: rows.length - validRows.length, insertedRows: inserted, updatedRows: updated || validRows.length };
};

export const exportOvertimeRows = (rows = []) => exportWorkbook([{ name: "العمل الإضافي", rows }], "overtime-records.xlsx");
