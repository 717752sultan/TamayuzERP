# تعليمات دائمة للعمل على هذا المشروع

هذه التعليمات موجهة لأي وكيل Codex أو مطور يكمل العمل على مشروع:

```text
Tamyuz ERP / نظام تقييم وتحفيز الموظفين
```

## قواعد أساسية صارمة

- لا تعيد كتابة `src/App.jsx` من الصفر.
- لا تغيّر تسجيل الدخول إلا بطلب صريح.
- لا تغيّر `company_id` أو `company_code` أو منطق تعدد الشركات.
- لا تحذف بيانات.
- لا تنشئ SQL migrations إلا عند الحاجة الواضحة وبعد أن تكون migration آمنة.
- لا تستخدم `drop`, `truncate`, أو destructive reset.
- لا تحذف صفحات HR أو الإعدادات العامة أو عناصر السايدبار الموجودة.
- لا تكسر دعم اللغة العربية RTL.
- حافظ على التصميم الحالي والألوان والهوية.
- لا تعرض أسرار `.env.local`.
- لا تستخدم LocalStorage كقاعدة بيانات تشغيلية. Supabase هو مصدر البيانات، باستثناء حالة جلسة الدخول عند الحاجة.

## طريقة العمل المفضلة

1. افحص الملفات الموجودة أولًا باستخدام `rg`.
2. عدّل بأقل نطاق ممكن.
3. حافظ على التوافق مع البنية الحالية بدل إنشاء مسارات مكررة.
4. عند إضافة صفحة جديدة، اربطها في:
   - `src/constants/pageRegistry.js`
   - `src/constants/moduleRegistry.js` عند الحاجة
   - منطق render في `src/App.jsx`
   - الصلاحيات المناسبة في services
5. عند تعديل Supabase CRUD:
   - وحّد شكل الكائنات قبل bulk insert/upsert.
   - أضف `company_id` للجداول متعددة الشركات.
   - أظهر رسائل خطأ عربية واضحة.
   - استخدم try/catch و `console.error` باسم الجدول.
6. شغّل `npm run build` فقط إذا طلب المستخدم أو إذا كانت المهمة تتطلب تحقق build.

## أوامر المشروع

```bash
npm run dev
npm run build
npm run preview
```

على Windows إذا فشل `npm` بسبب PowerShell execution policy:

```bash
cmd /c npm run build
cmd /c npm run dev
```

## البيئة

يحتاج المشروع إلى:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

هذه القيم توجد محليًا في `.env.local`، ويجب ضبطها أيضًا في Vercel أو أي بيئة نشر.

## Supabase و Multi-Tenant

- `src/services/supabase.js` هو عميل Supabase الموحّد.
- `src/services/tenant.js` يحتوي `tenantAwareTables`.
- أي جدول يحتوي بيانات شركة يجب أن يكون ضمن `tenantAwareTables`.
- لا تجعل مشرف المنصة يبدّل المستخدم الحالي عند اختيار شركة؛ الشركة المختارة context فقط.
- المستخدم الحالي يجب أن يبقى `currentUser`.

## الصلاحيات

النظام يستخدم أكثر من طبقة صلاحيات:

- صلاحيات الشركة: `company_permissions`
- صلاحيات قديمة: `app_permissions`
- صلاحيات شجرية: `app_permission_nodes`, `app_role_node_permissions`
- أدوار النظام: `app_roles`

أدوار الإدارة التي غالبًا يجب أن تتجاوز نقص صفوف الصلاحيات:

- `مدير النظام`
- `مدير عام النظام`
- `مشرف النظام العام`
- `is_platform_admin === true`

لا تجعل صفحة إدارية تختفي عن المدير لمجرد أن جدول صلاحيات لم يحتوي صفًا لها بعد.

## المخزون

موديول المخزون هو:

```text
moduleKey: inventory
label: المخازن والمخزون
```

عند الضغط على الموديول العلوي يجب دائمًا:

```js
setActiveModuleKey("inventory");
setPage("inventory_dashboard");
setSidebar(false);
```

صفحات المخزون الرسمية هي:

- `inventory_dashboard`
- `inventory_items`
- `inventory_categories`
- `inventory_units`
- `inventory_warehouses`
- `inventory_suppliers`
- `inventory_purchase_requests`
- `inventory_purchase_orders`
- `inventory_receipts`
- `inventory_purchase_invoices`
- `inventory_issue_vouchers`
- `inventory_returns`
- `inventory_transfers`
- `inventory_adjustments`
- `inventory_stocktakes`
- `inventory_balances`
- `inventory_movements`
- `inventory_alerts`
- `inventory_reports`
- `inventory_settings`

لا تستخدم `inventory_invoices` أو `inventory_forecast` كصفحات ملاحة رسمية جديدة، فهي أسماء قديمة/خارج القائمة المطلوبة.

صفحة `inventory` القديمة يجب أن تبقى للتوافق فقط ولا تظهر كعنصر السايدبار الوحيد.

## الإعدادات العامة

صفحة الإعدادات العامة الرسمية:

```text
system_settings
```

وتظهر تحت موديول:

```text
النظام
```

لا تنشئ صفحة بديلة بأسماء مثل:

- `general_settings`
- `settings_general`
- `system_admin_settings`

## العلامة التجارية

استخدم الثوابت من:

```text
src/constants/branding.js
```

الاسم الحالي:

```text
التميز للأنظمة الذكية
```

لا تغيّر `company_code = PUREMONEY` إن كان مستخدمًا كمعرّف أو login context. تغيير النصوص المرئية فقط يتم عند طلب branding.

## العربية والترميز

- الملفات يجب أن تبقى UTF-8.
- لا تستبدل مفاتيح JavaScript أو أسماء الجداول أو route keys بنص عربي.
- أصلح النصوص الظاهرة فقط عند mojibake.
- PowerShell قد يعرض العربية بشكل فاسد؛ لا تعتمد عليه وحده لتأكيد تلف الترميز.

## Supabase CRUD

عند bulk upsert يجب أن تكون جميع الكائنات بنفس المفاتيح تمامًا. مثال الموظفين:

```js
{
  id,
  name,
  branch,
  job,
  hire_date,
  salary,
  phone,
  status,
  manager
}
```

لا ترسل صفوف Excel الخام مباشرة إلى Supabase. طبّع البيانات أولًا.

## ملفات لا يجب كسرها

- `src/App.jsx`
- `src/services/supabase.js`
- `src/services/tenant.js`
- `src/services/auth.js`
- `src/constants/pageRegistry.js`
- `src/constants/moduleRegistry.js`
- `src/constants/branding.js`
- `src/services/companyPermissions.js`
- `src/services/treePermissions.js`

## عند تسليم أي تعديل

اذكر:

- الملفات المعدلة.
- ما تم إصلاحه.
- هل تم تشغيل build أم لا.
- أي تحذيرات باقية.
- إن كان هناك migration مطلوبة أم لا.
