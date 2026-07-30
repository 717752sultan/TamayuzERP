import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, MapPin, Plus, RefreshCw, Save, Smartphone, X } from "lucide-react";
import {
  defaultEmployeeAppSettings,
  defaultEmployeeRequestTypes,
  employeeAppAdminService,
  employeePortalPermissionModules,
} from "../../services/employeeAppAdmin";

const tabs = ["الإعدادات العامة", "صلاحيات بوابة الموظف", "مواقع الحضور", "أجهزة الموظفين", "الطلبات والنماذج", "معاينة بوابة الموظف"];
const permissionActions = [["can_view", "عرض"], ["can_create", "إنشاء"], ["can_upload", "رفع"], ["can_cancel", "إلغاء"], ["can_approve", "اعتماد"]];

function Head({ title, desc, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-extrabold">{title}</h3>
        {desc && <p className="mt-1 text-xs text-slate-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block text-sm font-bold">{label}{children}</label>;
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-bold">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

export default function EmployeeAppAdminSettingsPage({ currentCompany, currentUser, employees = [], can }) {
  const companyId = currentCompany?.company_id || currentUser?.company_id || "";
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [settings, setSettings] = useState({ ...defaultEmployeeAppSettings, company_id: companyId });
  const [permissions, setPermissions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [devices, setDevices] = useState([]);
  const [requestTypes, setRequestTypes] = useState([]);
  const [locationDialog, setLocationDialog] = useState(null);
  const [requestDialog, setRequestDialog] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const canManage = can?.("employee_app_settings", "can_configure") !== false || can?.("employee_app_settings", "can_edit") !== false;
  const employeeOptions = useMemo(() => employees.filter((employee) => !employee.company_id || employee.company_id === companyId), [employees, companyId]);

  const defaultPermissionRows = useCallback(() => employeePortalPermissionModules.map(([module_key]) => ({
    company_id: companyId,
    role_name: "الموظف",
    employee_id: "",
    module_key,
    can_view: true,
    can_create: module_key === "attendance_checkin" || module_key.startsWith("requests_"),
    can_upload: module_key === "documents_upload",
    can_cancel: module_key.startsWith("requests_"),
    can_approve: false,
    notes: "",
  })), [companyId]);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setMessage("");
    try {
      const [settingsRow, permissionRows, locationRows, deviceRows, requestRows] = await Promise.all([
        employeeAppAdminService.loadEmployeeAppSettings(companyId).catch(() => ({ ...defaultEmployeeAppSettings, company_id: companyId })),
        employeeAppAdminService.loadEmployeeAppPermissions(companyId).catch(() => []),
        employeeAppAdminService.loadAttendanceLocations(companyId).catch(() => []),
        employeeAppAdminService.loadEmployeeDevices(companyId).catch(() => []),
        employeeAppAdminService.loadEmployeeRequestTypes(companyId).catch(() => []),
      ]);
      setSettings(settingsRow);
      setPermissions(permissionRows.length ? permissionRows : defaultPermissionRows());
      setLocations(locationRows);
      setDevices(deviceRows);
      setRequestTypes(requestRows.length ? requestRows : defaultEmployeeRequestTypes.map(([request_key, request_label]) => ({
        company_id: companyId,
        request_key,
        request_label,
        is_enabled: true,
      })));
    } catch (error) {
      setMessage(error.message || "تعذر تحميل إعدادات تطبيق الموظف");
    } finally {
      setLoading(false);
    }
  }, [companyId, defaultPermissionRows]);

  useEffect(() => { load(); }, [load]);

  const updateSetting = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));
  const updatePermission = (index, key, value) => {
    setPermissions((rows) => rows.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      const next = { ...row, [key]: value };
      if (key !== "can_view" && value) next.can_view = true;
      if (key === "can_view" && !value) {
        next.can_create = false;
        next.can_upload = false;
        next.can_cancel = false;
        next.can_approve = false;
      }
      return next;
    }));
  };

  const saveSettings = async () => {
    try {
      const saved = await employeeAppAdminService.saveEmployeeAppSettings({ ...settings, company_id: companyId });
      setSettings(saved);
      setMessage("تم حفظ إعدادات تطبيق الموظف بنجاح");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const savePermissions = async () => {
    try {
      const saved = await employeeAppAdminService.saveEmployeeAppPermissions(companyId, permissions);
      setPermissions(saved);
      setMessage("تم حفظ صلاحيات بوابة الموظف بنجاح");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const saveLocation = async (event) => {
    event.preventDefault();
    try {
      const saved = await employeeAppAdminService.saveAttendanceLocation({ ...locationDialog, company_id: companyId });
      setLocations((rows) => [saved, ...rows.filter((row) => row.location_id !== saved.location_id)]);
      setLocationDialog(null);
      setMessage("تم حفظ موقع الحضور بنجاح");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const disableLocation = async (location) => {
    if (!confirm("هل تريد تعطيل موقع الحضور؟")) return;
    try {
      await employeeAppAdminService.deleteOrDisableAttendanceLocation(companyId, location.location_id);
      setLocations((rows) => rows.map((row) => row.location_id === location.location_id ? { ...row, is_active: false } : row));
    } catch (error) {
      setMessage(error.message);
    }
  };

  const useCurrentPosition = () => {
    if (!navigator.geolocation) return setMessage("المتصفح لا يدعم تحديد الموقع");
    navigator.geolocation.getCurrentPosition(
      (position) => setLocationDialog((draft) => ({ ...draft, latitude: position.coords.latitude, longitude: position.coords.longitude })),
      () => setMessage("تعذر قراءة الموقع الحالي"),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const saveRequestType = async (event) => {
    event.preventDefault();
    try {
      const saved = await employeeAppAdminService.saveEmployeeRequestType({ ...requestDialog, company_id: companyId });
      setRequestTypes((rows) => [saved, ...rows.filter((row) => row.request_type_id !== saved.request_type_id && row.request_key !== saved.request_key)]);
      setRequestDialog(null);
      setMessage("تم حفظ نوع الطلب بنجاح");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const disableDevice = async (device) => {
    try {
      await employeeAppAdminService.disableEmployeeDevice(companyId, device.device_id);
      setDevices((rows) => rows.map((row) => row.device_id === device.device_id ? { ...row, is_active: false } : row));
    } catch (error) {
      setMessage(error.message);
    }
  };

  const newLocation = () => setLocationDialog({
    location_id: crypto.randomUUID?.() || `LOC-${Date.now()}`,
    location_name: "موقع حضور",
    branch: "",
    employee_id: "",
    latitude: "",
    longitude: "",
    allowed_radius_meters: 100,
    is_active: true,
    notes: "",
  });

  const newRequestType = () => setRequestDialog({
    request_type_id: crypto.randomUUID?.() || `RT-${Date.now()}`,
    request_key: "",
    request_label: "",
    is_enabled: true,
    requires_attachment: false,
    requires_date_range: false,
    requires_time_range: false,
    approval_role: "",
    notes: "",
  });

  if (!companyId) return <div className="panel p-8 text-center font-bold text-slate-500">اختر شركة أولاً لإدارة تطبيق الموظف</div>;
  if (!canManage) return <div className="panel p-8 text-center font-bold text-red-700">لا تملك صلاحية إدارة تطبيق الموظف</div>;

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">إعدادات تطبيق الموظف</h2>
          <p className="mt-1 text-sm text-slate-500">مركز تحكم الإدارة في بوابة الموظف والصلاحيات والمواقع والأجهزة</p>
        </div>
        <button onClick={load} className="btn-secondary"><RefreshCw size={17} /> تحديث</button>
      </div>
      {message && <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">{message}</div>}
      <div className="panel flex flex-wrap gap-2 p-3">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-xl px-4 py-2 text-sm font-bold ${activeTab === tab ? "bg-brand-700 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
            {tab}
          </button>
        ))}
      </div>
      {loading && <div className="panel p-6 text-center text-sm font-bold text-slate-500">جاري تحميل البيانات...</div>}

      {activeTab === "الإعدادات العامة" && (
        <section className="panel p-5">
          <Head title="الإعدادات العامة" desc="هذه الإعدادات تتحكم بما يظهر ويعمل داخل بوابة الموظف." action={<button onClick={saveSettings} className="btn-primary"><Save size={17} /> حفظ</button>} />
          <div className="grid gap-3 md:grid-cols-3">
            <Toggle label="تفعيل بوابة الموظف" checked={settings.app_enabled !== false} onChange={(value) => updateSetting("app_enabled", value)} />
            <Toggle label="السماح بتسجيل دخول الموظفين" checked={settings.employee_login_enabled !== false} onChange={(value) => updateSetting("employee_login_enabled", value)} />
            <Toggle label="إلزام الموقع الجغرافي للحضور" checked={settings.geofence_required !== false} onChange={(value) => updateSetting("geofence_required", value)} />
            <Toggle label="السماح بالحضور بدون موقع إذا لم يتم تحديد موقع" checked={settings.allow_attendance_without_location === true} onChange={(value) => updateSetting("allow_attendance_without_location", value)} />
            <Toggle label="السماح بالخروج خارج النطاق" checked={settings.allow_checkout_outside_geofence === true} onChange={(value) => updateSetting("allow_checkout_outside_geofence", value)} />
            <Toggle label="السماح برفع المرفقات" checked={settings.allow_attachments !== false} onChange={(value) => updateSetting("allow_attachments", value)} />
            <Toggle label="السماح بعرض جدول الدوام" checked={settings.show_schedule !== false} onChange={(value) => updateSetting("show_schedule", value)} />
            <Toggle label="السماح بعرض سجل الحضور" checked={settings.show_attendance_history !== false} onChange={(value) => updateSetting("show_attendance_history", value)} />
            <Toggle label="السماح بعرض بيانات الراتب" checked={settings.show_salary === true} onChange={(value) => updateSetting("show_salary", value)} />
            <Toggle label="السماح بعرض رصيد الإجازات" checked={settings.show_leave_balance !== false} onChange={(value) => updateSetting("show_leave_balance", value)} />
            <Toggle label="السماح بالإشعارات" checked={settings.notifications_enabled !== false} onChange={(value) => updateSetting("notifications_enabled", value)} />
            <Toggle label="تفعيل تسجيل الأجهزة" checked={settings.device_registration_enabled === true} onChange={(value) => updateSetting("device_registration_enabled", value)} />
            <Toggle label="السماح بجهاز واحد فقط لكل موظف" checked={settings.single_device_only === true} onChange={(value) => updateSetting("single_device_only", value)} />
            <Field label="الحد الأقصى لدقة GPS بالمتر">
              <input type="number" min="10" value={settings.max_gps_accuracy_meters || 100} onChange={(event) => updateSetting("max_gps_accuracy_meters", Number(event.target.value || 100))} className="field mt-2" />
            </Field>
            <Field label="ملاحظات تنبيه تظهر للموظف">
              <textarea value={settings.employee_notice || ""} onChange={(event) => updateSetting("employee_notice", event.target.value)} className="field mt-2 !h-24 py-3" />
            </Field>
          </div>
        </section>
      )}

      {activeTab === "صلاحيات بوابة الموظف" && (
        <section className="panel p-5">
          <Head title="صلاحيات بوابة الموظف" desc="صلاحيات الدور تطبق على جميع الموظفين، وصلاحيات الموظف الخاصة تتجاوز صلاحيات الدور." action={<button onClick={savePermissions} className="btn-primary"><Save size={17} /> حفظ الصلاحيات</button>} />
          <div className="table-wrap">
            <table>
              <thead><tr><th>الموديول</th><th>الدور</th><th>موظف محدد</th>{permissionActions.map(([, label]) => <th key={label}>{label}</th>)}<th>ملاحظات</th></tr></thead>
              <tbody>
                {permissions.map((row, index) => (
                  <tr key={row.permission_id || `${row.module_key}-${index}`}>
                    <td>{employeePortalPermissionModules.find(([key]) => key === row.module_key)?.[1] || row.module_key}</td>
                    <td><input value={row.role_name || "الموظف"} onChange={(event) => updatePermission(index, "role_name", event.target.value)} className="field min-w-32" /></td>
                    <td><select value={row.employee_id || ""} onChange={(event) => updatePermission(index, "employee_id", event.target.value)} className="field min-w-40"><option value="">بدون تخصيص</option>{employeeOptions.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></td>
                    {permissionActions.map(([key]) => <td key={key} className="text-center"><input type="checkbox" checked={row[key] === true} onChange={(event) => updatePermission(index, key, event.target.checked)} /></td>)}
                    <td><input value={row.notes || ""} onChange={(event) => updatePermission(index, "notes", event.target.value)} className="field min-w-40" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs font-bold text-slate-500">إظهار الراتب يحتاج تفعيلًا من الإعدادات والصلاحيات معًا.</p>
        </section>
      )}

      {activeTab === "مواقع الحضور" && (
        <section className="panel p-5">
          <Head title="مواقع الحضور" desc="موقع الموظف الخاص له الأولوية، ثم موقع الفرع، ثم الموقع العام للشركة." action={<button onClick={newLocation} className="btn-primary"><Plus size={17} /> إضافة موقع</button>} />
          <div className="table-wrap">
            <table>
              <thead><tr><th>الموقع</th><th>الفرع</th><th>الموظف</th><th>الإحداثيات</th><th>النطاق</th><th>الحالة</th><th>إجراءات</th></tr></thead>
              <tbody>
                {locations.map((location) => (
                  <tr key={location.location_id}>
                    <td>{location.location_name}</td>
                    <td>{location.branch || "كل الفروع"}</td>
                    <td>{employeeOptions.find((employee) => employee.id === location.employee_id)?.name || location.employee_id || "كل الموظفين"}</td>
                    <td>{location.latitude}, {location.longitude}</td>
                    <td>{location.allowed_radius_meters} م</td>
                    <td>{location.is_active ? "نشط" : "معطل"}</td>
                    <td><button onClick={() => setLocationDialog(location)} className="p-2 text-blue-700">تعديل</button><button onClick={() => disableLocation(location)} className="p-2 text-red-700">تعطيل</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "أجهزة الموظفين" && (
        <section className="panel p-5">
          <Head title="أجهزة الموظفين" desc="لا يتم فرض قفل الأجهزة إلا إذا كان تسجيل الأجهزة مفعلاً من الإعدادات." />
          <div className="table-wrap">
            <table>
              <thead><tr><th>الجهاز</th><th>الموظف</th><th>آخر دخول</th><th>معلومات الجهاز</th><th>الحالة</th><th></th></tr></thead>
              <tbody>
                {devices.length ? devices.map((device) => (
                  <tr key={device.device_id}>
                    <td><Smartphone size={16} className="inline" /> {device.device_name || device.device_id}</td>
                    <td>{employeeOptions.find((employee) => employee.id === device.employee_id)?.name || device.employee_id}</td>
                    <td>{device.last_login_at || device.last_seen_at || "—"}</td>
                    <td className="max-w-md truncate">{device.device_info || device.user_agent || "—"}</td>
                    <td>{device.is_active === false ? "معطل" : "نشط"}</td>
                    <td><button onClick={() => disableDevice(device)} className="btn-secondary !h-8">تعطيل</button></td>
                  </tr>
                )) : <tr><td colSpan={6} className="py-8 text-center text-slate-400">لا توجد أجهزة مسجلة</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "الطلبات والنماذج" && (
        <section className="panel p-5">
          <Head title="الطلبات والنماذج" desc="أنواع الطلبات المفعلة فقط تظهر للموظف داخل البوابة." action={<button onClick={newRequestType} className="btn-primary"><Plus size={17} /> نوع طلب</button>} />
          <div className="grid gap-3 md:grid-cols-2">
            {requestTypes.map((type) => (
              <div key={type.request_type_id || type.request_key} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex justify-between gap-2"><b>{type.request_label}</b><span className={type.is_enabled !== false ? "text-green-700" : "text-red-700"}>{type.is_enabled !== false ? "مفعل" : "معطل"}</span></div>
                <p className="mt-2 text-xs text-slate-500">الموافق: {type.approval_role || "غير محدد"}</p>
                <button onClick={() => setRequestDialog(type)} className="mt-3 text-sm font-bold text-brand-700">تعديل</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "معاينة بوابة الموظف" && (
        <section className="panel p-5">
          <Head title="معاينة بوابة الموظف" desc="عرض سريع لما سيتم تفعيله للموظفين." />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl bg-violet-50 p-5"><Eye className="mb-2 text-violet-700" /><b>الرئيسية والملف</b><p className="mt-2 text-sm text-slate-500">الراتب: {settings.show_salary ? "ظاهر عند توفر الصلاحية" : "مخفي"}</p></div>
            <div className="rounded-3xl bg-amber-50 p-5"><MapPin className="mb-2 text-amber-700" /><b>الحضور بالموقع</b><p className="mt-2 text-sm text-slate-500">النطاق: {settings.geofence_required ? "إلزامي" : "اختياري"}</p></div>
            <div className="rounded-3xl bg-slate-50 p-5"><Smartphone className="mb-2 text-slate-700" /><b>الأجهزة</b><p className="mt-2 text-sm text-slate-500">تسجيل الأجهزة: {settings.device_registration_enabled ? "مفعل" : "غير مفعل"}</p></div>
          </div>
        </section>
      )}

      {locationDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form onSubmit={saveLocation} className="panel w-full max-w-4xl p-6">
            <div className="mb-4 flex items-center"><h3 className="text-xl font-extrabold">موقع حضور</h3><button type="button" onClick={() => setLocationDialog(null)} className="mr-auto p-2"><X /></button></div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="اسم الموقع"><input required value={locationDialog.location_name || ""} onChange={(event) => setLocationDialog({ ...locationDialog, location_name: event.target.value })} className="field mt-2" /></Field>
              <Field label="الفرع"><input value={locationDialog.branch || ""} onChange={(event) => setLocationDialog({ ...locationDialog, branch: event.target.value })} className="field mt-2" placeholder="كل الفروع" /></Field>
              <Field label="الموظف"><select value={locationDialog.employee_id || ""} onChange={(event) => setLocationDialog({ ...locationDialog, employee_id: event.target.value })} className="field mt-2"><option value="">كل الموظفين</option>{employeeOptions.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></Field>
              <Field label="خط العرض"><input required type="number" step="any" value={locationDialog.latitude || ""} onChange={(event) => setLocationDialog({ ...locationDialog, latitude: event.target.value })} className="field mt-2" /></Field>
              <Field label="خط الطول"><input required type="number" step="any" value={locationDialog.longitude || ""} onChange={(event) => setLocationDialog({ ...locationDialog, longitude: event.target.value })} className="field mt-2" /></Field>
              <Field label="النطاق بالمتر"><input type="number" min="10" value={locationDialog.allowed_radius_meters || 100} onChange={(event) => setLocationDialog({ ...locationDialog, allowed_radius_meters: event.target.value })} className="field mt-2" /></Field>
              <Toggle label="نشط" checked={locationDialog.is_active !== false} onChange={(value) => setLocationDialog({ ...locationDialog, is_active: value })} />
              <Field label="ملاحظات"><textarea value={locationDialog.notes || ""} onChange={(event) => setLocationDialog({ ...locationDialog, notes: event.target.value })} className="field mt-2 !h-24 py-3" /></Field>
              <div className="flex items-end"><button type="button" onClick={useCurrentPosition} className="btn-secondary"><MapPin size={17} /> استخدام موقعي الحالي</button></div>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setLocationDialog(null)} className="btn-secondary">إلغاء</button><button className="btn-primary">حفظ</button></div>
          </form>
        </div>
      )}

      {requestDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form onSubmit={saveRequestType} className="panel w-full max-w-3xl p-6">
            <div className="mb-4 flex items-center"><h3 className="text-xl font-extrabold">نوع طلب</h3><button type="button" onClick={() => setRequestDialog(null)} className="mr-auto p-2"><X /></button></div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="المفتاح"><input required value={requestDialog.request_key || ""} onChange={(event) => setRequestDialog({ ...requestDialog, request_key: event.target.value })} className="field mt-2" /></Field>
              <Field label="اسم الطلب"><input required value={requestDialog.request_label || ""} onChange={(event) => setRequestDialog({ ...requestDialog, request_label: event.target.value })} className="field mt-2" /></Field>
              <Toggle label="مفعل" checked={requestDialog.is_enabled !== false} onChange={(value) => setRequestDialog({ ...requestDialog, is_enabled: value })} />
              <Toggle label="يتطلب مرفق" checked={requestDialog.requires_attachment === true} onChange={(value) => setRequestDialog({ ...requestDialog, requires_attachment: value })} />
              <Toggle label="يتطلب نطاق تاريخ" checked={requestDialog.requires_date_range === true} onChange={(value) => setRequestDialog({ ...requestDialog, requires_date_range: value })} />
              <Toggle label="يتطلب نطاق وقت" checked={requestDialog.requires_time_range === true} onChange={(value) => setRequestDialog({ ...requestDialog, requires_time_range: value })} />
              <Field label="دور الاعتماد"><input value={requestDialog.approval_role || ""} onChange={(event) => setRequestDialog({ ...requestDialog, approval_role: event.target.value })} className="field mt-2" /></Field>
              <Field label="ملاحظات"><textarea value={requestDialog.notes || ""} onChange={(event) => setRequestDialog({ ...requestDialog, notes: event.target.value })} className="field mt-2 !h-24 py-3" /></Field>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setRequestDialog(null)} className="btn-secondary">إلغاء</button><button className="btn-primary">حفظ</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
