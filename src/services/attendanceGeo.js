import { supabase } from "./supabase";

const clean = (value) => String(value ?? "").trim();
const numberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const pad = (value) => String(value).padStart(2, "0");
export const getTodayDateOnly = () => {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const normalizeLocation = (row = {}) => ({
  location_id: row.location_id || row.id || `LOC-${Date.now()}`,
  company_id: row.company_id || row.companyId || "",
  branch: row.branch || "",
  employee_id: row.employee_id || row.employeeId || "",
  location_name: row.location_name || row.locationName || "موقع حضور",
  latitude: Number(row.latitude || 0),
  longitude: Number(row.longitude || 0),
  allowed_radius_meters: Number(row.allowed_radius_meters || row.allowedRadiusMeters || 100),
  location_purpose: row.location_purpose || row.locationPurpose || "both",
  allow_check_in: row.allow_check_in !== false,
  allow_check_out: row.allow_check_out !== false,
  block_check_in_here: row.block_check_in_here === true,
  block_check_out_here: row.block_check_out_here === true,
  priority: Number(row.priority || 1),
  is_active: row.is_active !== false,
  notes: row.notes || "",
  created_at: row.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const normalizeEvent = (row = {}) => ({
  event_id: row.event_id || row.id || `EVT-${Date.now()}`,
  company_id: row.company_id || row.companyId || "",
  employee_id: row.employee_id || row.employeeId || "",
  employee_name: row.employee_name || row.employeeName || "",
  branch: row.branch || "",
  attendance_date: row.attendance_date || getTodayDateOnly(),
  event_type: row.event_type || row.eventType || "check_in",
  event_time: row.event_time || new Date().toISOString(),
  latitude: numberOrNull(row.latitude),
  longitude: numberOrNull(row.longitude),
  accuracy: numberOrNull(row.accuracy),
  allowed_latitude: numberOrNull(row.allowed_latitude),
  allowed_longitude: numberOrNull(row.allowed_longitude),
  allowed_radius_meters: Number(row.allowed_radius_meters || 0),
  distance_from_allowed_location: numberOrNull(row.distance_from_allowed_location),
  geofence_status: row.geofence_status || "unavailable",
  matched_location_id: row.matched_location_id || "",
  matched_location_name: row.matched_location_name || "",
  matched_location_purpose: row.matched_location_purpose || "",
  event_status: row.event_status || "accepted",
  rejection_reason: row.rejection_reason || "",
  is_late: row.is_late === true,
  late_minutes: Number(row.late_minutes || 0),
  source: row.source || "employee_app",
  device_info: row.device_info || "",
  notes: row.notes || "",
  created_at: row.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const validateEmployeeLocation = (currentLocation = {}, allowedLocation = null) => {
  if (!allowedLocation?.latitude || !allowedLocation?.longitude) {
    return { status: "unavailable", allowed: true, distance: null, message: "لم يتم تحديد موقع حضور لهذا الموظف أو الفرع" };
  }
  const distance = calculateDistanceMeters(
    Number(currentLocation.latitude),
    Number(currentLocation.longitude),
    Number(allowedLocation.latitude),
    Number(allowedLocation.longitude),
  );
  const radius = Number(allowedLocation.allowed_radius_meters || 100);
  const inside = distance <= radius;
  return {
    status: inside ? "inside" : "outside",
    allowed: inside,
    distance,
    message: inside ? "الموظف داخل نطاق موقع العمل" : "أنت خارج نطاق موقع العمل المسموح",
  };
};

const purposeLabel = (purpose = "both") => purpose === "check_in" ? "دخول فقط" : purpose === "check_out" ? "خروج فقط" : "دخول وخروج";

const isLocationAllowedForEvent = (location = {}, eventType = "check_in") => {
  if (eventType === "check_in") return location.allow_check_in !== false && location.block_check_in_here !== true && location.location_purpose !== "check_out";
  return location.allow_check_out !== false && location.block_check_out_here !== true && location.location_purpose !== "check_in";
};

export const findNearestAttendanceLocation = (currentLocation = {}, locations = []) => {
  return [...(locations || [])]
    .filter((location) => location?.latitude && location?.longitude && location.is_active !== false)
    .map((location) => ({
      ...location,
      distance: calculateDistanceMeters(Number(currentLocation.latitude), Number(currentLocation.longitude), Number(location.latitude), Number(location.longitude)),
    }))
    .sort((a, b) => Number(a.priority || 1) - Number(b.priority || 1) || a.distance - b.distance)[0] || null;
};

export const validateEmployeeLocationForEvent = (currentLocation = {}, candidateLocations = [], eventType = "check_in", options = {}) => {
  const active = (candidateLocations || []).filter((location) => location.is_active !== false);
  if (!active.length) {
    return options.allowWithoutLocation
      ? { status: "unavailable", allowed: true, distance: null, matchedLocation: null, message: "لم يتم تحديد موقع حضور لهذا الموظف أو الفرع" }
      : { status: "unavailable", allowed: false, distance: null, matchedLocation: null, message: "لم يتم تحديد موقع حضور لهذا الموظف أو الفرع" };
  }
  const nearestAny = findNearestAttendanceLocation(currentLocation, active);
  if (nearestAny && nearestAny.distance <= Number(nearestAny.allowed_radius_meters || 100) && !isLocationAllowedForEvent(nearestAny, eventType)) {
    return {
      status: "blocked",
      allowed: false,
      distance: nearestAny.distance,
      matchedLocation: nearestAny,
      message: eventType === "check_in"
        ? "هذا الموقع مخصص للخروج ولا يسمح بتسجيل الدخول منه."
        : "هذا الموقع مخصص للدخول ولا يسمح بتسجيل الخروج منه.",
    };
  }
  const allowedLocations = active.filter((location) => isLocationAllowedForEvent(location, eventType));
  const nearest = findNearestAttendanceLocation(currentLocation, allowedLocations);
  if (!nearest) {
    return { status: "blocked", allowed: false, distance: null, matchedLocation: nearestAny, message: eventType === "check_in" ? "هذا الموقع مخصص للخروج ولا يسمح بتسجيل الدخول منه." : "هذا الموقع مخصص للدخول ولا يسمح بتسجيل الخروج منه." };
  }
  const radius = Number(nearest.allowed_radius_meters || 100);
  const inside = nearest.distance <= radius;
  return {
    status: inside ? "inside" : "outside",
    allowed: inside,
    distance: nearest.distance,
    matchedLocation: nearest,
    message: inside ? `الموظف داخل نطاق موقع ${purposeLabel(nearest.location_purpose)}` : eventType === "check_in" ? "أنت خارج نطاق موقع الدخول المسموح." : "أنت خارج نطاق موقع الخروج المسموح.",
  };
};

export const attendanceGeoService = {
  calculateDistanceMeters,
  validateEmployeeLocation,
  validateEmployeeLocationForEvent,
  findNearestAttendanceLocation,
  getTodayDateOnly,

  async loadAttendanceLocations(companyId) {
    try {
      const rows = await supabase.select("attendance_locations", `select=*&company_id=eq.${encodeURIComponent(companyId || "")}&order=location_name.asc`);
      return (rows || []).map(normalizeLocation);
    } catch (error) {
      console.error("Supabase attendance_locations load error:", error);
      throw new Error("تعذر تحميل مواقع الحضور: " + error.message);
    }
  },

  async saveAttendanceLocation(location) {
    const payload = normalizeLocation(location);
    const { data, error } = await supabase.from("attendance_locations").upsert(payload, { onConflict: "location_id" }).select().single();
    if (error) {
      console.error("Supabase attendance_locations save error:", error);
      throw new Error("تعذر حفظ موقع الحضور: " + error.message);
    }
    return normalizeLocation(data);
  },

  async deleteAttendanceLocation(locationId) {
    try {
      await supabase.request(`/rest/v1/attendance_locations?location_id=eq.${encodeURIComponent(locationId)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
    } catch (error) {
      console.error("Supabase attendance_locations delete error:", error);
      throw new Error("تعذر حذف موقع الحضور: " + error.message);
    }
    return true;
  },

  async getEmployeeAllowedLocation(companyId, employeeId, branch = "") {
    const locations = await this.loadAttendanceLocations(companyId);
    return locations.find((item) => item.is_active && item.employee_id === employeeId)
      || locations.find((item) => item.is_active && item.branch && item.branch === branch && !item.employee_id)
      || locations.find((item) => item.is_active && !item.branch && !item.employee_id)
      || null;
  },

  async getEmployeeAllowedLocations(companyId, employeeId, branch = "") {
    const locations = await this.loadAttendanceLocations(companyId);
    const employeeLocations = locations.filter((item) => item.is_active && item.employee_id === employeeId);
    if (employeeLocations.length) return employeeLocations;
    const branchLocations = locations.filter((item) => item.is_active && item.branch && item.branch === branch && !item.employee_id);
    if (branchLocations.length) return branchLocations;
    return locations.filter((item) => item.is_active && !item.branch && !item.employee_id);
  },

  async saveEmployeeAttendanceEvent(payload) {
    const row = normalizeEvent(payload);
    const { data, error } = await supabase.from("employee_attendance_events").upsert(row, { onConflict: "event_id" }).select().single();
    if (error) {
      console.error("Supabase employee_attendance_events save error:", error);
      throw new Error("تعذر حفظ حدث الحضور الذاتي: " + error.message);
    }
    return normalizeEvent(data);
  },

  async loadEmployeeAttendanceEvents(filters = {}) {
    try {
      const params = ["select=*"];
      if (filters.companyId) params.push(`company_id=eq.${encodeURIComponent(filters.companyId)}`);
      if (filters.employeeId) params.push(`employee_id=eq.${encodeURIComponent(filters.employeeId)}`);
      if (filters.from) params.push(`attendance_date=gte.${encodeURIComponent(filters.from)}`);
      if (filters.to) params.push(`attendance_date=lte.${encodeURIComponent(filters.to)}`);
      if (filters.date) params.push(`attendance_date=eq.${encodeURIComponent(filters.date)}`);
      const rows = await supabase.select("employee_attendance_events", `${params.join("&")}&order=event_time.desc`);
      return (rows || []).map(normalizeEvent);
    } catch (error) {
      console.error("Supabase employee_attendance_events load error:", error);
      throw new Error("تعذر تحميل أحداث الحضور الذاتي: " + error.message);
    }
  },

  async getTodayEmployeeAttendanceStatus(companyId, employeeId) {
    const today = getTodayDateOnly();
    const rows = await this.loadEmployeeAttendanceEvents({ companyId, employeeId, date: today });
    const hasCheckIn = rows.some((row) => row.event_type === "check_in");
    const hasCheckOut = rows.some((row) => row.event_type === "check_out");
    return { attendance_date: today, hasCheckIn, hasCheckOut, events: rows };
  },
};
