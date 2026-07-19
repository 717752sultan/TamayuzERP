# هندسة المرحلتين 1 و2 — إعدادات الموارد البشرية والأدوار والصلاحيات

تاريخ الاكتشاف: 2026-07-19
حالة الوثيقة: تصميم معماري فقط؛ لا تتضمن تنفيذًا أو SQL أو تغييرًا لقاعدة البيانات.
نطاقها: المرحلة 1 «الإعدادات العامة وإعدادات الموارد البشرية» والمرحلة 2 «الأدوار والصلاحيات ونطاقات الوصول» من خارطة HR المعتمدة ذات 25 مرحلة.

## 1. الملخص التنفيذي

المشروع يملك أساسًا صالحًا لإعادة الاستخدام، لكنه لم يصل بعد إلى نموذج موحد للإعدادات أو التفويض. توجد واجهات فعلية للإعدادات والمستخدمين، وعميل Supabase موحد، وعزل مستأجر جزئي، وخدمات للفروع والعملات، وثلاث طبقات للصلاحيات. المقابل هو وجود تداخل بين `company_settings` و`hrms_settings`، وتخزين الوظائف والمدير والفروع كنصوص في مواضع تشغيلية، واعتماد الصلاحيات على أسماء الأدوار في أجزاء حساسة.

القرار المعماري المقترح هو:

1. إبقاء `companies` لهوية الشركة والاشتراك والهوية البصرية، واستخدام `company_settings` مصدرًا واحدًا للإعدادات العامة الخاصة بالشركة، مع إبقاء `hrms_settings` لنطاق HR المتخصص والتوافق المرحلي فقط.
2. إعادة استخدام `currencies` باعتبارها عملات خاصة بكل شركة، وتوسيع معناها لاحقًا بدل إنشاء مصدر عملات منافس. لا يُستخدم `inventory_currency_settings` كمصدر عام للنظام.
3. إنشاء مصادر مرجعية واحدة للمسميات الوظيفية ومواقع العمل بعد التحقق من المخطط المنشور، ثم تحويل الحقول النصية تدريجيًا دون كسر التوافق.
4. إبقاء نموذج «دور واحد نشط لكل مستخدم» مؤقتًا لأنه النموذج الذي يدعمه `app_users.role` حاليًا. لا يُفرض تعدد الأدوار قبل توفير ربط آمن بمعرف الدور والشركة.
5. جعل `pageRegistry` المصدر الرسمي لمفاتيح الصفحات، وفصل استحقاق الشركة من صلاحية الدور ومن نطاق البيانات.
6. اعتماد `company_id` حدًا إلزاميًا لا يمكن لأي نطاق وصول تجاوزه، واستخدام المعرفات لا الأسماء للفروع والأقسام والمديرين.
7. عدم تنفيذ أي migration قبل فحص مخطط Supabase المنشور ومراجعة RLS والسياسات والقيود الفعلية.

نقطة التوقف: الاكتشاف والتصميم موثقان فقط. أول دفعة تنفيذ مقترحة بعد الموافقة هي **Batch 1A: الإعدادات العامة، الإعدادات المخصصة، والعملات**، وتبدأ بفحص مخطط Supabase قراءةً فقط ثم عقد بيانات ومخطط migration للمراجعة، وليس بالتنفيذ المباشر.

## 2. نتائج الحالة الحالية

### 2.1 الملاحة والصفحات

- `src/App.jsx` يحتوي واجهات `SettingsPage` و`UsersPermissionsPage` و`CompaniesAdminPage` و`AuditLogsPage` و`RoleManagementPanel` و`TreePermissionsPanel`.
- `HRFoundationPage` مستخدم حاليًا مع `hr_home` و`hr_org_chart` و`hr_settings`، ويخزن الأقسام والوظائف والمسميات ضمن JSON إعدادات HR.
- `pageRegistry.js` يحتوي `hr_settings` بالمفتاح `hr.settings`، و`users_permissions`، كما يحتوي alias قديمًا باسم `settings`.
- في النسخة المفحوصة لا يوجد إدخال رسمي ظاهر باسم `system_settings` داخل `pageRegistry.js`، ولا يوجد module باسم `system` في `moduleRegistry.js`. هذا تعارض مع تعليمات المشروع التي تعتبر `system_settings` المفتاح الرسمي، ويجب تسويته في دفعة تنفيذ مستقلة بعد الموافقة دون إنشاء صفحة بديلة.
- `moduleRegistry.js` يقصر صفحات HR على قائمة `CANONICAL_HR_PAGE_KEYS`، لذلك إضافة سجل إلى registry وحده لا تضمن ظهوره ما لم يدخل مسار الملاحة الفعلي.
- توجد نصوص عربية فاسدة ترميزيًا في ملفات متعددة، ومنها خدمات الإعدادات والـregistries. لم تُصلح ضمن هذه المهمة لأن نطاقها توثيقي فقط.

### 2.2 الإعدادات

- `systemSettingsService` يقرأ ويكتب صفًا لكل شركة في `company_settings`، وحقل الإعدادات الفعلي هو JSON باسم `settings`.
- القيم الحالية المعروفة: اسم العرض، اللغة، العملة الافتراضية، تنسيق التاريخ، المنطقة الزمنية، رأس وذيل التقرير، الشعار، اللونان الرئيس والثانوي، وتفعيل الإشعارات.
- `settingsService` يقرأ ويكتب صفًا ثابت المعرف `default` في `hrms_settings`، ويخزن كائن JSON كاملًا. هذا المعرف غير مربوط صراحة بالشركة في payload، مع أن `hrms_settings` مصنف كجدول tenant-aware؛ يلزم التحقق من سلوك العميل والمخطط الفعلي.
- `HRFoundationPage` يخزن `departments` و`jobs` و`jobTitles` داخل JSON إعدادات HR، ويحافظ كذلك على `settings.jobs` كقائمة نصية للتوافق.
- لا يوجد نموذج مثبت للقيم ذات النوع، مخطط التحقق، إصدار الإعدادات، أو سجل تغييرات الإعدادات.

### 2.3 الموظفون والهيكل التنظيمي

- عقد الموظف الحالي في `employeesService` هو: `id`, `name`, `branch`, `job`, `hire_date`, `salary`, `phone`, `status`, `manager`.
- الفرع والوظيفة والمدير نصوص، ولا توجد في العقد الحالي مفاتيح `branch_id`, `department_id`, `job_title_id`, `position_id`, `work_location_id`, أو `manager_id`.
- التوظيف يستخدم `job_title`, `department`, و`branch` كنصوص في migrations المحلية.
- لا توجد بنية migration محلية مؤكدة لجداول `job_titles` أو `work_locations` أو الحقول المخصصة للموظف.

### 2.4 الفروع والعملات والمستخدمون

- `settingsBranchesService` يدير `branches` بحسب `company_id` ويستخدم `company_id,branch_code` للتعارض المنطقي، ويعطّل الفرع بدل الحذف الفعلي.
- بيانات الفرع المعروفة من الخدمة: الكود، الاسم، النوع، اسم المدير، الهاتف، العنوان، المدينة، الحالة، الملاحظات.
- `settingsCurrenciesService` يدير `currencies` بحسب `company_id`، ويستخدم `company_id,currency_code`، ويملك `is_default`, `is_active`, `exchange_rate`.
- نموذج العملات الحالي لا يميز عملة النظام من عملة الراتب الأساسية ومن عملة المعاملة الافتراضية، ولا يثبت الدقة العشرية أو مصدر السعر أو تاريخ سريانه.
- `settingsUsersService` يدير `app_users` للشركة ويستبعد مشرف المنصة، لكنه يخزن الدور كنص واحد في `role` ويقرأ/يكتب كلمة مرور ضمن جدول التطبيق.

### 2.5 الصلاحيات

توجد ثلاث طبقات يجب عدم دمجها عشوائيًا:

1. `company_permissions`: استحقاقات الشركة للصفحات والوظائف، وليست صلاحيات المستخدم النهائية.
2. `app_permissions`: نموذج قديم يربط اسم الدور بمفتاح الصفحة وبأفعال أساسية.
3. `app_permission_nodes` و`app_role_node_permissions`: شجرة صفحات/تبويبات وصلاحيات تفصيلية ونطاق بيانات.

النموذج الشجري الحالي يستخدم `role_name` و`node_key`، ويخزن `allowed_branches` و`allowed_departments` كـJSON. لا توجد في migrations المفحوصة علاقات FK مثبتة بين هذه الجداول، كما أن القيد الفريد هو `(role_name,node_key)` بلا `company_id`.

### 2.6 LocalStorage وTODO

- لم تظهر علامات `TODO`, `FIXME`, `HACK`, أو `XXX` في البحث المنفذ.
- استخدام LocalStorage الظاهر محصور في أعلام جلسة الدخول (`ep_logged`, `ep_role`, `ep_employee_id`) ورمز وصول Supabase الاختياري. لم يظهر استخدام LocalStorage لبيانات إعدادات أو صلاحيات تشغيلية.
- `sessionStorage` مستخدم لحفظ سياق المستأجر مؤقتًا.

## 3. المكونات والخدمات القابلة لإعادة الاستخدام

| المجال | الموجود | قرار إعادة الاستخدام |
|---|---|---|
| الإعدادات العامة | `SettingsPage`, `systemSettingsService` | إعادة استخدام وتفكيك التبويبات تدريجيًا، مع تثبيت `company_settings` كمصدر الشركة |
| إعدادات HR | `HRFoundationPage`, `settingsService` | إعادة استخدام كطبقة توافق، وحصره في إعدادات HR فقط |
| الفروع | `settingsBranchesService` | إعادة استخدام بعد التحقق من PK/FK/unique/RLS |
| العملات | `settingsCurrenciesService` | إعادة استخدام وتمديد العقد؛ عدم إنشاء مصدر ثانٍ |
| المستخدمون | `settingsUsersService`, `UsersPermissionsPage` | إعادة استخدام الواجهة بحذر؛ فصل ملف المستخدم عن المصادقة مستقبلًا |
| الأدوار | `RoleManagementPanel`, وظائف `adminService` | إعادة استخدام سلوك الواجهة، مع استبدال الاعتماد على الاسم بمعرف لاحقًا |
| شجرة الصلاحيات | `TreePermissionsPanel`, `treePermissionsService` | إعادة استخدام العرض والأفعال، وإعادة تصميم مفتاح الربط والنطاق بعد التحقق |
| استحقاقات الشركة | `companyPermissionsService` | يبقى طبقة entitlements قبل صلاحية الدور |
| التدقيق | `auditService`, `AuditLogsPage`, جدول `audit_logs` | إعادة الاستخدام مع توسيع حمولة أحداث الصلاحيات |
| الشركة والثيم | `companiesService`, `themeService` | إعادة الاستخدام لهوية الشركة، لا لتفضيلات المستخدم |
| الموظفون | `employeesService` | إعادة الاستخدام خلال التحويل التدريجي للمعرفات المرجعية |
| Supabase | `src/services/supabase.js`, `tenant.js` | عميل موحد وسياق tenant؛ يحتاجان مراجعة حدود تجاوز مشرف المنصة |
| التقارير والطباعة | `reportBranding` ومكونات التقارير | مصدر تصميم شهادة الراتب لاحقًا، دون بناء مولد في المرحلة 1 |

لا توجد خدمة وثائق شركة أو خدمة مواقع عمل أو خدمة حقول موظف مخصصة مثبتة يمكن اعتمادها حاليًا.

## 4. نتائج مخطط Supabase

### 4.1 ما ثبت من migrations المحلية

- `companies`: معرف وكود شركة، بيانات هوية واتصال واشتراك وحد مستخدمين وحالة وألوان.
- `app_users`: معرف مستخدم، `company_id`, `company_code`, اسم مستخدم، كلمة مرور تطبيق، دور نصي، رابط موظف، بيانات اتصال، حالة، وعلم مشرف المنصة.
- `app_roles`: `role_id`, `role_name`, وصف، علم دور نظام، حالة. أضيف `company_id` في migration تعدد الشركات إن كان الجدول موجودًا.
- `app_permissions`: صلاحيات صفحة حسب اسم الدور، ثم توسعت ببعض الأفعال.
- `app_permission_nodes`: عقد الشجرة ومفاتيح module/page/tab.
- `app_role_node_permissions`: أفعال تفصيلية، `data_scope`, والفروع/الأقسام المسموحة.
- `company_permissions`: استحقاقات الشركة بمفتاح `(company_id,permission_key)` وحقول الصفحة والأفعال.
- `audit_logs`: الفاعل، الإجراء، الوحدة، السجل، القيم السابقة والجديدة، والتاريخ.
- `approval_logs`, `notifications`, `system_backups` موجودة في migrations ذات الصلة.

### 4.2 قيود معروفة من الملفات

- migration مبكر لـ`app_roles` يضع `role_name` فريدًا عالميًا. migration لاحق ينشئ `role_id` كمفتاح أساسي لكنه يبقي `role_name` فريدًا عالميًا. هذا لا يلائم أدوارًا مخصصة متكررة الاسم بين الشركات.
- القيد الفريد للصلاحيات الشجرية هو `(role_name,node_key)` وليس `(company_id,role_id,node_key)`.
- عقد permission node لا يحتوي FK معلنًا إلى parent، وعقد role permission لا تحتوي FK معلنًا إلى role/node في الملف المفحوص.
- `company_permissions` يملك قيدًا فريدًا مناسبًا `(company_id,permission_key)`.
- لا توجد migrations محلية منشئة لـ`company_settings`, `currencies`, `branches`, `employees`; الخدمات تفترض وجودها، وmigration تعدد الشركات يعدلها فقط إذا كانت موجودة.

### 4.3 محاولة الفحص القرائي المباشر

تمت محاولة قراءة واجهة مخطط Supabase باستخدام URL والمفتاح المجهول المحملين داخليًا دون طباعتهما. فشل الاتصال في البيئة الحالية قبل الحصول على استجابة مخطط. لم تُنفذ أي كتابة أو SQL أو RPC تغييري.

بالتالي العناصر التالية كلها **غير متحققة حتى فحص مخطط Supabase**:

- وجود الجداول المنشورة فعليًا ومطابقة أعمدتها للمigrations المحلية.
- PK وFK والقيود الفريدة والفهارس الفعلية للجداول التي تفترضها الخدمات.
- حالة RLS والسياسات لكل جدول.
- الدوال وviews المنشورة.
- Storage buckets وسياسات الملفات.
- الأعداد البنيوية للسجلات.
- تطبيق جميع migrations وترتيبها في البيئة المنشورة.

لم يُعثر محليًا على تعريفات `CREATE POLICY` أو `ENABLE ROW LEVEL SECURITY` أو bucket خاص بوثائق الشركة. وجودها المنشور غير مستبعد لكنه غير مثبت.

## 5. هندسة المرحلة 1

### 5.1 حدود مستويات الإعدادات

| المستوى | ما ينتمي إليه | ما لا ينتمي إليه | المصدر المقترح |
|---|---|---|---|
| المنصة | هوية المنتج الافتراضية، خطط الاشتراك، حدود قصوى أمنية لا يمكن للشركة تجاوزها، سياسات مشرف المنصة | العملة والفرع وخطابات شركة بعينها | إعدادات نشر/منصة منفصلة؛ لا تُخزن في صف شركة |
| الشركة | الاسم القانوني والعرض، الشعار، الألوان، المنطقة الزمنية، تنسيقات المستندات، العملات المفعلة، وثائق الشركة، overrides الأمنية | تفضيلات مستخدم فردي | `companies` للهوية الثابتة و`company_settings` للإعدادات |
| HR | بنية الموظفين، سياسات الموارد البشرية، التصنيفات، إعدادات الحضور والأداء والرواتب | إعدادات المنصة العامة | `hrms_settings` ضمن namespace واضح أو كيانات مرجعية متخصصة |
| المستخدم | اللغة، طريقة العرض، حجم الصفحة، تفضيلات التنبيه | صلاحيات أو حدود أمان | كيان تفضيلات مستخدم مستقبلي بعد التحقق؛ لا يخلط مع `app_users.role` |

قاعدة الملكية: كل مفتاح يجب أن يملك مصدرًا رسميًا واحدًا. `companies` لا يكرر قيم `company_settings`، و`company_settings` لا يكرر إعداد HR داخل `hrms_settings`.

### 5.2 الإعدادات العامة والمخصصة

- الصفحة الرسمية العليا تبقى `system_settings` وفق تعليمات المشروع.
- `company_settings` هو المصدر المرشح للإعدادات العامة، بصف واحد لكل `company_id` وكائن `settings` منظم.
- البنية المنطقية المقترحة داخل JSON:
  - `schema_version`
  - `general`: اللغة، المنطقة الزمنية، التاريخ، الرؤوس والتذييلات.
  - `currency`: مراجع العملات المحددة للأدوار الثلاثة.
  - `security_overrides`: قيم الشركة التي لا تتجاوز سقف المنصة.
  - `custom`: قائمة إعدادات مخصصة معرفة بنوعها ومجموعتها.
- كل إعداد مخصص يحتاج: `key`, `group`, `value_type`, `value`, `default_value`, `validation`, `is_overridden`, `version`.
- لا يُنشأ جدول إعدادات ثالث قبل تقييم حجم الاستعلام والتدقيق. إذا أثبتت الحاجة إلى استعلام مستقل لكل مفتاح، يقدم migration لاحق للمراجعة بدل الازدواج.
- التحقق يكون بعقد schema في الخدمة، وليس بقبول JSON حر من الواجهة.

### 5.3 الوظيفة والمسمى والمنصب

العلاقة المستهدفة:

`department -> job -> job_title -> position -> employee assignment`

- **Job**: عائلة أو وظيفة تنظيمية، مثل تقنية المعلومات.
- **Job title**: المسمى الذي يظهر للموظف، مثل أخصائي دعم فني.
- **Position**: مقعد وظيفي فعلي داخل قسم/فرع وله مدير وحالة وشاغل.
- **Employee assignment**: علاقة زمنية بين الموظف والمنصب/الموقع.

المصدر الحالي `settings.jobs/jobTitles` والنصوص في الموظفين والتوظيف يجب أن تعتبر بيانات legacy. لا يُنشأ مصدر جديد ثم يترك القديم نشطًا. خطة التحويل المستقبلية: جرد القيم، إزالة التكرار، إنشاء معرفات، ربط السجلات تدريجيًا، ثم إبقاء النص للعرض/التوافق إلى حين اكتمال التحويل.

### 5.4 مواقع العمل

`work_location` كيان مستقل عن الفرع، لأن الفرع وحدة تنظيمية/مالية بينما موقع العمل مكان حضور فعلي أو افتراضي.

الحقول المقترحة: المعرف، الكود، الاسم العربي والإنجليزي، النوع (`branch_office`, `office`, `remote`, `field`, `biometric`)، `branch_id` الاختياري، وصف جغرافي، عنوان، إحداثيات اختيارية، معرف جهاز/منطقة حضور، قابلية تطبيق الحضور، الحالة، تواريخ السريان، و`company_id`.

العلاقات:

- قد يملك الفرع عدة مواقع عمل.
- قد يخدم الموقع عدة أقسام.
- تعيين الموظف للموقع يجب أن يكون زمنيا في سجل تعيين، لا حقلاً نصيًا دائمًا فقط.
- الموقع البعيد يمكن أن يكون بلا فرع، لكنه لا يكون بلا `company_id`.

### 5.5 العملات

القرار المقترح: `currencies` الحالية عملات tenant-specific بسبب وجود `company_id`. يُعاد استخدامها وتمدد بدل إنشاء `company_currencies` منفصل.

الحقول الإضافية المطلوبة منطقيًا: `decimal_precision`, `is_system_currency`, `is_base_salary_currency`, `is_default_transaction_currency`, `exchange_rate_source`, `exchange_rate_effective_at`, `is_active`.

القواعد:

- unique منطقي: `(company_id,currency_code)`.
- عملة نظام واحدة، وعملة راتب أساسية واحدة، وعملة معاملة افتراضية واحدة لكل شركة.
- العملة المختارة لأي دور يجب أن تكون مفعلة.
- لا تنفذ عمليات جلب أسعار أو إعادة تقييم في هذه المرحلة.
- `inventory_currency_settings` يبقى إعداد مخزون متخصصًا ويشير لاحقًا إلى العملة الرسمية، ولا يصبح مصدر العملة العام.

### 5.6 الحقول المخصصة للموظف

لا تُضاف أعمدة جديدة إلى `employees` لكل حقل. يستخدم نموذج تعريف/قيمة:

- التعريف: المفتاح، الملصقان العربي والإنجليزي، النوع، الإلزام، الافتراضي، الخيارات، قواعد التحقق، ترتيب العرض، فئات الموظفين المنطبقة، الحالة، `company_id`.
- القيمة: `company_id`, `employee_id`, `field_definition_id`, `value_json`, قيمة عرض مفهرسة اختيارية، وتدقيق التغيير.
- الأنواع المستقبلية: text, number, date, boolean, select, multi-select, textarea, attachment, phone, email.
- unique للقيمة: `(company_id,employee_id,field_definition_id)`.
- المرفقات تخزن path فقط في القيمة، مع bucket وسياسة لم يتم التحقق منهما.

### 5.7 إعداد خطاب التعريف بالراتب

إعداد واحد فعال لكل شركة/لغة أو إصدار، ويشمل:

- شعار الشركة والرأس والعنوان والنص الموجه.
- مكونات الراتب المسموح إظهارها، والعملة وطريقة تنسيقها.
- النص العربي، والنص الإنجليزي عند التفعيل.
- المفوض بالتوقيع بمعرف مستخدم/موظف، وصورة توقيع وختم كمسارات تخزين.
- التذييل، صيغة رقم المستند، تاريخ الإصدار، مرجع/رمز تحقق.
- إعدادات PDF والطباعة.
- سياسة أرشفة النسخة الناتجة في ملف الموظف.

لا يبنى مولد المستند في Batch 1C؛ يُثبت عقد الإعداد ومصادر البيانات أولًا. توليد الشهادة حدث حساس يتطلب `can_generate_salary_certificate`, `can_view_salary`, `can_print`, و`can_download` مع audit.

### 5.8 الإعدادات الأمنية

التقسيم الإلزامي:

**Supabase Auth أو طبقة مصادقة خادمية:** تجزئة كلمات المرور، سياسة التعقيد، انتهاء كلمة المرور عند الدعم، عدد المحاولات، القفل، MFA، إدارة refresh tokens والجلسات.

**التطبيق:** صلاحية عرض الراتب، تنزيل الوثائق، التصدير والطباعة، نطاق السجلات، انتهاء جلسة واجهة ضمن الحدود، أحداث التدقيق، وقيود مشرف الشركة.

الوضع الحالي يستعلم `app_users` باسم المستخدم وكلمة المرور ويحتفظ بحقل password؛ وهذه مخاطرة أمنية حرجة. لا تُعالج في هذه المرحلة لأن تغيير login ممنوع، لكنها تمنع اعتبار سياسة كلمة المرور في الواجهة وحدها حماية كافية.

مشرف المنصة لا ينبغي أن يصل تلقائيًا إلى بيانات شركة دون اختيار سياق شركة وتسجيل سبب للأفعال الحساسة. مدير الشركة لا يمكنه منح صلاحية تتجاوز استحقاقات `company_permissions` أو سقف المنصة.

### 5.9 وثائق الشركة

الكيان المقترح يدعم: النوع، الرقم، الجهة المصدرة، تاريخ الإصدار والانتهاء، path المرفق، الحالة، الملاحظات، أيام التنبيه، الإصدار، رابط الإصدار السابق، التصنيف الحساس، و`company_id`.

- لا يخزن URL عام دائم لمستند حساس؛ يفضل path خاص ورابط موقع مؤقت.
- يلزم فصل `view metadata`, `download`, `upload`, `replace/version`, `archive`.
- كل رفع أو تنزيل أو تبديل إصدار أو تغيير حالة يسجل في audit.
- لا يوجد bucket مثبت في الملفات؛ اسم bucket وRLS وسياسة signed URLs أسئلة معلقة.

## 6. هندسة المرحلة 2

### 6.1 الأدوار

العقد المستهدف للدور: `role_id`, `company_id`, `role_code`, `role_name`, `description`, `role_type`, `is_system_role`, `is_active`, `created_by`, `created_at`, `updated_by`, `updated_at`.

- الدور النظامي لا يحذف ولا يتغير كوده، ويمكن فقط ضبط ما تسمح به سياسة المنصة.
- الدور المخصص للشركة لا يظهر خارجها.
- uniqueness الصحيح هو `(company_id,role_code)` ويفضل `(company_id,normalized_role_name)` للأسماء.
- النسخ ينشئ role جديدًا ويستنسخ الصلاحيات والنطاقات داخل الشركة نفسها، مع audit مستقل.
- التعطيل soft state، ويمنع إذا ترك مستخدمين بلا دور صالح إلا بعد إعادة تعيينهم.

### 6.2 صلاحيات الصفحات

- `pageRegistry` هو المصدر الرسمي للمفاتيح، بعد تسوية غياب `system_settings` وتلف بعض التسميات في دفعة مستقلة.
- alias مثل `settings`, `hr_settings_full`, أو أي مسار قديم لا يظهر كسجل صلاحية مستقل.
- المفتاح الرسمي يخزن مرة واحدة لكل دور، و`view` هو الحد الأدنى.
- `company_permissions` يقرر إن كانت الشركة تملك الصفحة أصلًا؛ ثم يقرر الدور الوصول؛ ثم يطبق نطاق البيانات.

### 6.3 صلاحيات الإجراءات

الأفعال القياسية المقترحة:

`view`, `create`, `edit`, `deactivate`, `archive`, `delete`, `approve`, `reject`, `export`, `print`, `download`, `upload`, `manage_settings`, `manage_permissions`.

يتم ربطها بالمفاتيح الحالية حيث أمكن (`can_view`, `can_create`, ...)، مع عدم مساواة `deactivate/archive` بالحذف الفعلي. الإخفاء في sidebar ليس تفويضًا؛ يجب فحص الإجراء في المكون والخدمة وRLS/API.

### 6.4 تعيين الدور

الوضع الحالي يدعم دورًا واحدًا كنص في `app_users.role`. النموذج الأكثر أمانًا الآن:

1. إبقاء دور واحد نشط لكل مستخدم خلال أول تنفيذ.
2. ربطه مستقبلًا بـ`role_id` داخل الشركة، مع إبقاء `role` كنص توافق مؤقت.
3. عدم إدخال تعدد الأدوار المؤقتة قبل أن يدعم المخطط effective dates وحل التعارض وتدقيق كل تعيين.

كيان `user_role_assignments` منطقي محتمل للتطبيع لاحقًا، لكنه لا ينفذ آليًا في Batch 2A. يحتاج قرارًا صريحًا بعد فحص المخطط.

### 6.5 نطاقات الوصول

الأنواع المستهدفة: `company`, `branch`, `department`, `direct_reports`, `self`, `explicit_employees`.

- `company_id` حد أول يطبق دائمًا ولا يمكن لاتحاد النطاقات تجاوزه.
- الشركة المختارة context فقط وليست تغييرًا لـ`currentUser`.
- الفروع والأقسام تخزن بمعرفات، لا أسماء.
- `direct_reports` يعتمد على `manager_id` رسمي وفعال، لا على نص `manager`.
- `self` يتطلب ربط `currentUser.employee_id` بموظف في الشركة نفسها.
- `explicit_employees` يتطلب قائمة معرفات مع company validation.
- عند وجود تعيين دور واحد يكون نطاق الدور هو الفعال. إذا دعم تعدد الأدوار مستقبلًا، يلزم تعريف واضح لاتحاد grant ومنع تضخيم النطاق؛ التصميم المبدئي يقترح اتحاد الصلاحيات داخل الشركة ثم تقاطعها مع القيود الإلزامية والحساسية.

### 6.6 سلوك المدير ومخاطره الحالية

التحقق الحالي غير موحد:

- `isSystemAdministratorRole` يستخدم مقارنة دقيقة لعدة أسماء إدارية.
- `isAdminLikeRole` يستخدم `includes` لأسماء تشمل «مدير النظام» و«مدير عام النظام» و«الإدارة العليا»، ثم يمنح bypass في `canByPermission` و`hasTreePermission`.
- `isPlatformAdminUser` يعتمد على العلم أو اسم دور المنصة.
- `adminService.isAdminRole` يستخدم مقارنات نصية واسعة.
- يوجد عدم اتساق بين تسمية `platformSuperAdminRole` وبين أسماء «مدير عام النظام» و«مشرف النظام العام» المستخدمة في مواضع أخرى.

المخاطر:

- دور عادي يحتوي اسمه عبارة إدارية قد يرث bypass.
- «الإدارة العليا» قد تحصل على صلاحيات تعديل لا يفترض أن تتجاوزها.
- اختيار شركة لمشرف المنصة قد يؤدي لاستعلام بلا tenant filter إذا اعتبر العميل كل platform admin متجاوزًا للعزل.

التصميم المستقبلي: `is_platform_admin` علم مستقل، وأكواد أدوار ثابتة، و`role_id` دقيق، ومقيّم سياسة مركزي. لا يعتمد أي تفويض على substring أو الملصق العربي.

### 6.7 تدقيق تغييرات الصلاحيات

الأحداث الإلزامية: إنشاء/تعديل/نسخ/تعطيل دور، منح/إزالة صلاحية، تغيير نطاق، تعيين/إلغاء تعيين دور، واستخدام تجاوز إداري.

حمولة الحد الأدنى: `company_id`, `actor_user_id`, `actor_role_id`, `target_user_id`, `target_role_id`, `action`, `entity_type`, `entity_id`, `previous_value`, `new_value`, `reason`, `request_id`, `created_at`.

`audit_logs` قابل لإعادة الاستخدام مبدئيًا عبر `old_data/new_data`، لكنه يحتاج التحقق من `company_id` وRLS وعدم قابلية التعديل وسياسة الاحتفاظ. لا تسجل كلمات المرور أو الرموز أو محتوى ملفات حساسة.

## 7. نموذج البيانات المنطقي

الأسماء التالية منطقية وليست قرارًا بإنشاء جداول فعلية.

### 7.1 `company_settings` — Existing but requires verification

- الغرض: إعدادات الشركة العامة والمخصصة المنظمة.
- الموجود: خدمة نشطة تفترض صفًا لكل `company_id`; لا توجد migration محلية منشئة.
- إعادة الاستخدام: نعم، بعد التحقق.
- الحقول: `company_id`, `settings`, `schema_version`, `updated_by`, `updated_at`.
- PK/unique: `company_id`.
- العلاقات: `companies.company_id`.
- الحذف: لا يحذف؛ إصدار/استعادة من audit.
- التدقيق: snapshot قبل/بعد لكل مجموعة.
- RLS: الشركة الحالية؛ مدير الإعدادات كتابة؛ مشرف المنصة بسياق محدد.
- خطر الازدواج: مرتفع مع `hrms_settings` إذا لم تحدد الملكية.

### 7.2 `currencies` — Existing but requires extension

- الغرض: العملات المفعلة وأدوار العملة وسعر العرض لكل شركة.
- الموجود: خدمة CRUD على `currencies`; المخطط غير متحقق.
- الحقول: الموجود إضافة إلى `decimal_precision`, أعلام أدوار العملات، مصدر السعر، تاريخ السريان، audit fields.
- PK: معرف عملة؛ unique `(company_id,currency_code)`.
- العلاقات: الشركة، ومراجع اختيارية من إعداد الراتب والمعاملات.
- الحذف: تعطيل فقط.
- RLS: قراءة للمصرح لهم وكتابة `system.settings.currencies.manage`.
- الخطر: متوسط بسبب `inventory_currency_settings`.

### 7.3 `company_currencies` — Not recommended because an equivalent structure exists

- الغرض المحتمل: تفعيل عملة عالمية لشركة.
- القرار: لا ينشأ ما دامت `currencies` tenant-specific وتستوعب الحاجة.
- الاستثناء: يعاد تقييمه فقط إذا كشف المخطط جدول عملات عالميًا فعليًا.

### 7.4 `job_titles` — Missing and potentially required

- الغرض: مصدر رسمي للمسميات الوظيفية.
- الموجود: قوائم JSON ونصوص فقط.
- الحقول: `job_title_id`, `company_id`, `job_id`, code, Arabic/English names, grade/category, description, status, audit fields.
- PK: `job_title_id`; unique `(company_id,code)`.
- العلاقات: job/department افتراضي، positions، employees/recruitment تدريجيًا.
- الحذف: تعطيل.
- RLS: الشركة.
- الخطر: مرتفع إذا أنشئ دون خطة تحويل للقيم النصية.

### 7.5 `work_locations` — Missing and potentially required

- الغرض: مواقع العمل والحضور الفعلية/البعيدة.
- الحقول والعلاقات: كما في 5.4؛ PK `work_location_id`; unique `(company_id,code)`؛ FK اختياري للفرع.
- الحذف: تعطيل وتواريخ سريان.
- RLS: الشركة مع نطاق فرع عند الحاجة.
- الخطر: متوسط بسبب الخلط الحالي بين الفرع والموقع.

### 7.6 `employee_custom_field_definitions` — Missing and potentially required

- الغرض: تعريف حقول مرنة دون تغيير جدول الموظف.
- PK: `field_definition_id`; unique `(company_id,field_key)`.
- الحقول: labels, type, required, default, options JSON, validation JSON, applicability JSON, display_order, active, audit.
- العلاقات: الشركة والقيم.
- الحذف: تعطيل؛ يمنع حذف تعريف له قيم.
- RLS: مدير HR/الإعدادات.
- الخطر: متوسط؛ يلزم whitelist للأنواع والتحقق.

### 7.7 `employee_custom_field_values` — Missing and potentially required

- الغرض: قيمة كل تعريف لكل موظف.
- PK: `field_value_id`; unique `(company_id,employee_id,field_definition_id)`.
- الحقول: `value_json`, `display_value`, audit fields.
- FK: employee, definition, company.
- الحذف: soft/archive مع سجل تاريخي.
- RLS: يتبع نطاق الموظف وحساسية التعريف.
- الخطر: عالٍ للحقول الحساسة والمرفقات.

### 7.8 `salary_certificate_settings` — Missing and potentially required

- الغرض: إعداد قالب خطاب الراتب وإصداراته.
- PK: `setting_id`; unique فعال `(company_id,locale,is_active)` أو نموذج versioned.
- الحقول: مكونات 5.7، `version`, `effective_from/to`, audit.
- FK: company, signatory user/employee, currency.
- الحذف: أرشفة إصدار.
- RLS: HR/رواتب/إعدادات حساسة.
- الخطر: عالٍ بسبب بيانات الراتب والتوقيع.

### 7.9 `company_documents` — Missing and potentially required

- الغرض: وثائق الشركة وإصداراتها وتنبيهاتها.
- PK: `company_document_id`; unique اختياري `(company_id,document_type,document_number,version)`.
- الحقول: مكونات 5.9، storage path، hash اختياري، audit.
- FK: company، previous_version، uploader.
- الحذف: archive فقط.
- RLS: metadata/download منفصلان؛ bucket خاص.
- الخطر: عالٍ؛ التخزين والسياسات غير متحققين.

### 7.10 `roles` / `app_roles` — Existing but requires extension

- الغرض: أدوار النظام والشركة.
- الموجود: `app_roles`.
- الحقول المطلوبة: 6.1؛ خصوصًا company-scoped code وcreated/updated by.
- PK: `role_id`; uniques داخل الشركة لا عالميًا.
- الحذف: تعطيل؛ النظامي محمي.
- RLS: أدوار الشركة فقط، ومشرف المنصة ضمن السياق.
- الخطر: حرج بسبب unique عالمي واسم الدور المستخدم كمفتاح.

### 7.11 `permissions` / `app_permission_nodes` — Existing but requires extension

- الغرض: سجل رسمي لعقد الصفحات والإجراءات.
- الموجود: nodes شجرية و`pageRegistry` في الكود.
- التوصية: registry مصدر تعريف، والجدول مرآة/حالة تشغيل؛ لا alias.
- PK: node/permission key ثابت؛ parent FK مطلوب منطقيًا.
- company_id: التعريف العام لا يحتاجه؛ التفعيل والgrant يحتاجانه.
- الحذف: تعطيل فقط.
- RLS: قراءة مضبوطة، إدارة منصة/ترحيل.
- الخطر: متوسط بسبب drift بين الكود والجدول.

### 7.12 `role_permissions` / `app_role_node_permissions` — Existing but requires extension

- الغرض: أفعال الدور على الصفحة/العقدة.
- المطلوب: `company_id`, `role_id`, canonical key، أفعال، audit fields.
- PK: معرف؛ unique `(company_id,role_id,permission_key)`.
- FK: role، permission، company.
- الحذف: إزالة grant مع audit أو soft state.
- RLS: مدير صلاحيات الشركة، ولا يتجاوز entitlements.
- الخطر: حرج بسبب الربط الحالي بالاسم.

### 7.13 `user_role_assignments` — Missing and potentially required

- الغرض: تطبيع تعيين الدور ودعم السريان لاحقًا.
- القرار: لا ينفذ قبل قرار تعدد الأدوار؛ الدور الواحد هو الوضع الآمن الحالي.
- الحقول: assignment id, company/user/role IDs, effective dates, active, assigned_by, reason.
- unique: دور نشط واحد لكل مستخدم في النموذج الأول.
- RLS: الشركة؛ منع تعيين دور شركة أخرى.
- الخطر: عالٍ إذا شُغل بالتوازي مع `app_users.role` بلا مصدر رسمي.

### 7.14 `role_access_scopes` — Missing and potentially required

- الغرض: نطاقات الشركة/الفرع/القسم/المدير/self/موظفين محددين.
- الموجود القريب: `data_scope`, `allowed_branches`, `allowed_departments` داخل role-node permissions.
- التوصية: التحقق أولًا؛ يمكن توسيع الموجود بدل جدول جديد إن كانت الحاجة موحدة لكل permission.
- الحقول المنطقية: company, role/assignment, permission optional, scope_type, target_type/id, active, dates, audit.
- RLS: عزل صارم بالشركة.
- الخطر: عالٍ بسبب احتمال تكرار النطاق في موضعين.

### 7.15 `permission_audit_logs` — Not recommended because an equivalent structure exists

- الغرض: تدقيق الصلاحيات.
- الموجود: `audit_logs` قابل للتوسيع.
- القرار: لا ينشأ جدول مستقل قبل إثبات قصور `audit_logs`.
- متطلبات reuse: company_id، actor/target IDs، old/new، reason، append-only/RLS.
- الخطر: متوسط إذا ظل audit قابلاً للتعديل أو بلا company_id فعلي.

## 8. نموذج الصلاحيات

قرار السماح النهائي يجب أن يكون تقاطعًا مرتبًا:

1. هوية المستخدم والجلسة صالحة.
2. `currentUser.company_id` أو سياق الشركة المختار لمشرف المنصة صالح.
3. `company_permissions` يتيح الصفحة/الميزة للشركة.
4. الدور الفعال يملك الصفحة الرسمية والفعل المطلوب.
5. نطاق البيانات يشمل السجل المستهدف داخل الشركة.
6. قيود الحساسية/الفصل بين الواجبات لا تمنع الفعل.
7. تسجل العملية إن كانت حساسة.

الـaliases تحول للمفتاح الرسمي قبل التقييم، ولا تُخزن grants منفصلة لها. مدير الشركة لا يتجاوز استحقاقات الشركة. مشرف المنصة لا يستخدم substring لدوره ولا يغير `currentUser` عند اختيار الشركة.

## 9. نموذج نطاقات الوصول

| النطاق | شرط الاختيار | متطلب البيانات | ملاحظات |
|---|---|---|---|
| الشركة | record.company_id = selected company | `company_id` | أعلى نطاق داخل مستأجر واحد فقط |
| فروع محددة | branch_id ضمن القائمة | branch IDs | يمنع الأسماء النصية |
| أقسام محددة | department_id ضمن القائمة | department IDs | يتقاطع مع الشركة والفرع عند اللزوم |
| التقارير المباشرة | employee.manager_id = current employee | manager_id رسمي | يحتاج سجل تعيين فعال |
| السجل الذاتي | employee_id = currentUser.employee_id | رابط مستخدم/موظف | لا يتيح سجلات موظفين آخرين |
| موظفون محددون | employee_id ضمن assignments | employee IDs | لكل إدخال company validation |

إذا كان السجل لا يحتوي معرفات النطاق المطلوبة، لا يُوسع الوصول اعتمادًا على الاسم؛ إما تحويل آمن أو رفض حتى توافر المعرف.

## 10. الحدود الأمنية

- المصادقة ليست هي التفويض. نجاح login لا يمنح الصفحة أو البيانات.
- selected company ليس المستخدم الحالي ولا يغير دوره.
- لا يعتمد منع البيانات الحساسة على إخفاء عنصر UI.
- كل استعلام بيانات شركة يحمل `company_id` في الخدمة ويدعم RLS مقابلًا.
- bypass المنصة يجب أن يكون صريحًا ومحدودًا ومسجلًا، لا تعطيلًا عامًا للـtenant filter.
- كلمات المرور والرموز لا تدخل `audit_logs` أو export.
- تنزيل مستند أو شهادة راتب يحتاج signed URL قصير العمر وصلاحية مستقلة.
- سياسات Auth لا يمكن فرضها بأمان عبر إعداد JSON في الواجهة فقط.

## 11. تصميم الصفحات والملاحة

لا تعدل registries في هذه المهمة. التصميم يحافظ على صفحتين رسميتين عليا ويتجنب تكرار المسارات.

### 11.1 موديول النظام/الإعدادات

المفتاح الرسمي الأعلى: `system_settings`، والموديول: `system`. التبويبات التالية subroutes داخل الصفحة، وليست صفحات registry مستقلة في المرحلة الأولى.

| canonical/subroute key | routeKey | الملصق | المكون | الموجود القابل لإعادة الاستخدام | permission key | الأفعال | الاعتماد | الأولوية |
|---|---|---|---|---|---|---|---|---|
| `system_settings` / `general` | `system_settings` | الإعدادات العامة | `SystemSettingsPage` | `SettingsPage` | `system.settings` | view/edit/manage_settings | companies, company_settings | 1A |
| `system_settings.custom` | `system_settings?tab=custom` | الإعدادات المخصصة | تبويب مقترح | `SettingsPage` | `system.settings.custom` | view/create/edit/archive | company_settings | 1A |
| `system_settings.job_titles` | `system_settings?tab=job_titles` | المسميات الوظيفية | تبويب مقترح | `HRFoundationPage` جزئيًا | `system.settings.job_titles` | view/create/edit/deactivate | jobs/departments | 1B |
| `system_settings.work_locations` | `system_settings?tab=work_locations` | مواقع العمل | تبويب مقترح | لا يوجد | `system.settings.work_locations` | view/create/edit/deactivate | branches | 1B |
| `system_settings.currencies` | `system_settings?tab=currencies` | العملات | تبويب مقترح | `SettingsPage`/currency tab | `system.settings.currencies` | view/create/edit/deactivate/manage_settings | currencies | 1A |
| `system_settings.employee_custom_fields` | `system_settings?tab=employee_custom_fields` | الحقول المخصصة للموظف | تبويب مقترح | لا يوجد | `system.settings.employee_custom_fields` | view/create/edit/deactivate | employee categories | 1B |
| `system_settings.salary_certificate` | `system_settings?tab=salary_certificate` | إعداد خطاب التعريف بالراتب | تبويب مقترح | report branding جزئيًا | `system.settings.salary_certificate` | view/edit/manage_settings/print | payroll, currency, signatory | 1C |
| `system_settings.security` | `system_settings?tab=security` | الإعدادات الأمنية | تبويب مقترح | لا يوجد آمن بالكامل | `system.settings.security` | view/edit/manage_settings | auth capabilities | 1C |
| `system_settings.company_documents` | `system_settings?tab=company_documents` | وثائق الشركة | تبويب مقترح | لا يوجد | `system.settings.company_documents` | view/upload/download/edit/archive | storage, audit | 1C |

`hr_settings` يبقى صفحة إعدادات الموارد البشرية المنفصلة، ولا يصبح alias لـ`system_settings`.

### 11.2 المستخدمون والصلاحيات

المفتاح الرسمي الأعلى: `users_permissions`. الإضافة والتحرير والنسخ إجراءات داخل صفحة الأدوار وليست صفحات registry منفصلة.

| canonical/subroute key | routeKey | الملصق | الموجود/المقترح | permission key | الأفعال | الاعتماد | الأولوية |
|---|---|---|---|---|---|---|---|
| `users_permissions.roles` | `users_permissions?tab=roles` | قائمة الأدوار | `RoleManagementPanel` | `users_permissions.roles` | view/create/edit/clone/deactivate | app_roles | 2A |
| `users_permissions.role_editor` | نفس المسار مع role id | إضافة/تعديل دور | `RoleManagementPanel` | `users_permissions.roles` | create/edit/clone | app_roles | 2A |
| `users_permissions.page_permissions` | `users_permissions?tab=page_permissions` | صلاحيات الصفحات | `TreePermissionsPanel` | `users_permissions.page_permissions` | view/edit/manage_permissions | pageRegistry/nodes | 2B |
| `users_permissions.action_permissions` | `users_permissions?tab=action_permissions` | صلاحيات الإجراءات | `TreePermissionsPanel` موسع | `users_permissions.action_permissions` | view/edit/manage_permissions | role permissions | 2B |
| `users_permissions.access_scopes` | `users_permissions?tab=access_scopes` | نطاقات الوصول | مكون مقترح | `users_permissions.access_scopes` | view/edit/manage_permissions | branches/departments/managers | 2C |
| `users_permissions.user_roles` | `users_permissions?tab=user_roles` | تعيين الأدوار للمستخدمين | `UsersPermissionsPage` جزئيًا | `users_permissions.user_roles` | view/edit/manage_permissions | app_users/app_roles | 2C |
| `users_permissions.permission_audit` | `users_permissions?tab=audit` | سجل تغييرات الصلاحيات | `AuditLogsPage` مفلتر | `users_permissions.audit` | view/export/print/view_sensitive | audit_logs | 2C |

## 12. مصفوفة الاعتماد

| المجال | يعتمد على | يفتح لاحقًا |
|---|---|---|
| الإعدادات العامة | company context، company_settings | جميع إعدادات الشركة |
| العملات | الإعدادات العامة | الرواتب، المعاملات، التقارير |
| المسميات الوظيفية | الأقسام/jobs | المنصب، التوظيف، ملف الموظف |
| مواقع العمل | الفروع | الحضور، الشفتات، تعيين الموظف |
| الحقول المخصصة | الموظف والفئات | ملف الموظف والتقارير |
| خطاب الراتب | العملات، الراتب، الموقّع | توليد/أرشفة الشهادات |
| الأمن | auth capabilities والصلاحيات | سياسات الجلسة والحساسية |
| وثائق الشركة | storage وaudit | التنبيهات والأرشفة |
| الأدوار | company context | page/action permissions |
| page permissions | pageRegistry الرسمي | الملاحة والتفويض |
| action permissions | role + canonical page | CRUD/approval/export enforcement |
| user-role | users + roles | effective authorization |
| access scopes | org IDs + manager_id | self-service/manager-service |
| permission audit | audit + كل ما سبق | امتثال ومراجعة |

## 13. تحليل الفجوات

| الفجوة | الحالي | المطلوب | الشدة |
|---|---|---|---|
| مصدر الإعدادات | مصدران JSON بملكية متداخلة | ملكية مفاتيح واضحة وإصدار schema | عالٍ |
| `system_settings` | غير موجود رسميًا في registry المفحوص | صفحة رسمية واحدة تحت النظام | عالٍ للملاحة |
| الوظائف | نصوص وقوائم JSON | معرفات مرجعية وخطة تحويل | عالٍ |
| مواقع العمل | غير موجودة | كيان مرتبط بالفرع والحضور | متوسط |
| العملات | default واحد | ثلاثة أدوار ودقة/مصدر/سريان | متوسط |
| حقول الموظف | غير موجودة | تعريف/قيمة مرنة | متوسط |
| شهادة الراتب | لا عقد إعداد متخصص | إعداد versioned وصلاحيات | عالٍ |
| الوثائق | لا bucket/service مثبت | metadata + private storage + audit | حرج |
| الأدوار | اسم فريد عالمي ونصي | role_id/code داخل الشركة | حرج |
| الصلاحيات | 3 طبقات متداخلة | تسلسل entitlement/role/scope | حرج |
| النطاق | names + own/branch/dept/all | IDs + manager/self/explicit | حرج |
| admin checks | exact وincludes مختلطة | أكواد/IDs ومقيّم مركزي | حرج |
| RLS | غير مثبت | سياسات لكل جدول ونطاق | حرج |
| المصادقة | password ضمن app_users | Auth خادمي آمن مستقبلًا | حرج، خارج النطاق الحالي |
| audit | عام وجزئي | أحداث صلاحيات كاملة append-only | عالٍ |

## 14. سجل المخاطر

| الخطر | الاحتمال/الأثر | المعالجة التصميمية |
|---|---|---|
| كلمات مرور تطبيق قابلة للاستعلام | عالٍ/حرج | مشروع أمني مستقل لـSupabase Auth؛ لا تغير login ضمن هذه الدفعة |
| substring يمنح إدارة | عالٍ/حرج | role IDs/codes ومقارنات دقيقة |
| دور فريد عالميًا | عالٍ/عالٍ | unique داخل company بعد migration مدروس |
| permissions مرتبطة باسم الدور | عالٍ/حرج | role_id + company_id |
| bypass مشرف المنصة يتجاوز tenant | متوسط/حرج | selected context + RLS + audit |
| غياب RLS مثبت | غير معلوم/حرج | فحص schema والسياسات قبل CRUD |
| ازدواج company/hr settings | عالٍ/عالٍ | مصفوفة ملكية ومحول legacy |
| حقول org نصية | عالٍ/عالٍ | تحويل مرحلي إلى IDs |
| alias كصلاحية مستقلة | متوسط/عالٍ | canonicalization قبل الحفظ |
| Storage غير معروف | عالٍ/حرج | bucket خاص وsigned URLs بعد الموافقة |
| حذف الأدوار | متوسط/عالٍ | deactivate فقط مع reassignment check |
| audit قابل للتعديل أو غير معزول | غير معلوم/عالٍ | append-only policy وcompany_id |
| نصوص عربية فاسدة | عالٍ/متوسط | دفعة UTF-8 منفصلة دون تغيير identifiers |

## 15. دفعات التنفيذ الموصى بها

### Batch 1A — الإعدادات العامة والمخصصة والعملات

- الاعتماد: فحص `companies`, `company_settings`, `hrms_settings`, `currencies` وRLS.
- الملفات المرجح تغييرها: Settings/SystemSettings UI، `systemSettings.js`, `settings.js`, `settingsCurrencies.js`, registries والصلاحيات بعد إقرار المفاتيح.
- إعادة الاستخدام: الخدمات الحالية.
- مخاطر: ازدواج الإعدادات، تفعيل عملات متعددة كافتراضية، ملاحة `system_settings`.
- التحقق: عقد schema، tenant tests، unique currency roles، Realtime عند الحاجة، build واختبار RTL.
- شرط التوقف: لا يبدأ CRUD قبل اعتماد مخطط البيانات/migration؛ بعد التنفيذ تقرير وتوقف.

### Batch 1B — المسميات ومواقع العمل والحقول المخصصة

- الاعتماد: Batch 1A، جرد قيم jobs/departments/branches والموظفين والتوظيف.
- الملفات: HRFoundation/Settings components، employee/recruitment adapters، خدمات جديدة فقط إن لم يوجد مكافئ.
- DB للتحقق: employees, branches, departments/jobs الفعلية وأي جداول مشابهة.
- مخاطر: مصادر مكررة وكسر النصوص القديمة.
- التحقق: migration mapping dry-run، uniqueness، active references، tenant/RLS.
- التوقف: قبل تحويل أي بيانات وبعد كل كيان مرجعي.

### Batch 1C — خطاب الراتب والأمن ووثائق الشركة

- الاعتماد: العملات، users/employees، storage/RLS/audit inspection.
- الملفات: إعدادات النظام، report branding، auth capability adapter، document metadata service لاحقًا.
- مخاطر: رواتب وتوقيعات ووثائق حساسة؛ auth خارج التطبيق.
- التحقق: permission matrix، signed URL، عدم تسريب الحقول، PDF contract دون مولد كامل.
- التوقف: إذا لم يثبت bucket خاص أو لا يمكن تطبيق RLS.

### Batch 2A — قائمة الأدوار والتفاصيل والإضافة/التعديل/النسخ/التعطيل

- الاعتماد: فحص `app_roles`, `app_users`, uniques وRLS؛ اعتماد نموذج الدور الواحد.
- الملفات: `UsersPermissionsPage`, `RoleManagementPanel`, `admin.js`, audit integration.
- مخاطر: unique عالمي، أسماء الأدوار، تعيينات قائمة.
- التحقق: شركة لا ترى أدوار الأخرى، حماية system roles، clone داخل الشركة، reassignment guard.
- التوقف: قبل migration `role_id/company_id` وبعد تقرير batch.

### Batch 2B — صلاحيات الصفحات الرسمية والإجراءات

- الاعتماد: 2A، تنظيف registry/aliases، قرار علاقة طبقات الصلاحيات.
- الملفات: pageRegistry، treePermissions، companyPermissions، evaluator ومكونات permission tree.
- مخاطر: فقد صلاحيات legacy أو مضاعفة grants.
- التحقق: canonical uniqueness، action denial في service لا UI فقط، admin exact checks، regression لكل دور.
- التوقف: عند أي مفتاح alias غير قابل للتحويل آليًا.

### Batch 2C — تعيين الدور والنطاقات وتدقيق الصلاحيات

- الاعتماد: 1B للـIDs و2A/2B، manager_id رسمي، audit/RLS.
- الملفات: user assignment UI/service، scope evaluator، audit.
- مخاطر: cross-tenant، نطاق مدير غير دقيق، تضارب الدور النصي/ID.
- التحقق: اختبارات company/branch/department/direct reports/self/explicit، negative cross-company، audit old/new.
- التوقف: إذا بقي manager/branch/department نصيًا فقط أو لم تثبت RLS.

## 16. استراتيجية التحقق

لكل دفعة مستقبلية:

1. snapshot قرائي للمخطط والقيود والسياسات قبل التصميم النهائي.
2. عقد بيانات موحد واختبارات normalization/validation.
3. مراجعة migration يدويًا قبل التنفيذ، بلا destructive SQL.
4. اختبارات multi-tenant سلبية بين شركتين، بما فيها platform selected context.
5. اختبارات أدوار: مدير منصة، مدير نظام، HR، مدير فرع، مدير مباشر، موظف.
6. اختبارات كل action في UI والخدمة وRLS/API.
7. اختبار Realtime إن كان مطلوبًا مع عدم تسريب صفوف شركة أخرى.
8. اختبار RTL وUTF-8 وعدم ظهور mojibake.
9. `npm run build` بعد كل دفعة مصدرية فقط.
10. تقرير ملفات/جداول/مخاطر ثم توقف للموافقة.

تحقق هذه المهمة التوثيقية: لا build مطلوب لأن المصدر لم يتغير؛ يكتفى بـgit status، مقارنة الملفات، وفحص UTF-8/mojibake للوثيقتين.

## 17. أسئلة غير محسومة تتطلب فحص Supabase

1. هل `company_settings`, `hrms_settings`, `currencies`, `branches`, و`employees` موجودة فعليًا، وما عقودها الدقيقة؟
2. هل `hrms_settings.id=default` صف عالمي أم يوجد قيد/سياسة تحوله إلى صف لكل شركة؟
3. هل `app_roles.role_name` ما زال فريدًا عالميًا في الإنتاج؟ وهل `role_id` PK فعلي؟
4. هل `app_users.username` فريد عالميًا أم داخل الشركة؟
5. هل تمت إضافة `company_id` إلى كل جداول الصلاحيات والتدقيق فعليًا؟
6. ما RLS والسياسات على `app_users`, `app_roles`, `app_permissions`, nodes, role permissions, company permissions, audit logs؟
7. هل توجد functions للتحقق من login أو الصلاحيات، وما `search_path` وsecurity mode لها؟
8. هل توجد views أو materialized views ذات صلة؟
9. هل يوجد bucket خاص للوثائق؟ وما سياسات `storage.objects`؟
10. هل توجد جداول jobs/departments/job_titles/work_locations مخفية عن migrations المحلية؟
11. هل توجد بنية حالية للحقول المخصصة أو خطاب الراتب أو وثائق الشركة؟
12. هل `audit_logs` append-only ويملك retention وcompany isolation؟
13. هل tenant wrapper يضيف `company_id` بأمان لكل عمليات REST، خصوصًا لمشرف المنصة مع شركة مختارة؟
14. ما أحجام السجلات الحالية لتقدير خطة تحويل النصوص إلى IDs دون قراءة بيانات حساسة؟

حتى الإجابة عن هذه الأسئلة، تبقى كل بنية غير مثبتة من migration محلية موسومة: **غير متحققة حتى فحص مخطط Supabase**.

---

## ملحق التنفيذ — نتيجة Batch 1A في 2026-07-19

### الحالة

تم تنفيذ Batch 1A فقط. أصبحت `system_settings` صفحة رسمية واحدة داخل موديول `system`، وتحتوي على تبويبات الإعدادات العامة والإعدادات المخصصة والعملات. بقيت `hr_settings` منفصلة، ولم يبدأ أي كيان من Batch 1B أو 1C أو المرحلة 2.

### قرارات التنفيذ الفعلية

1. أعيد استخدام `company_settings.settings` كعقد JSON للإعدادات العامة والمخصصة ومراجع أدوار العملات.
2. الحفظ مقسم إلى `saveGeneralSettings`, `saveCustomSettings`, و`saveCurrencyRoles` حتى لا ترسل الواجهة مفاتيح غير مصرح بها.
3. custom settings مقيدة بخمسة تعريفات metadata-driven في الكود، ولا تقبل إنشاء مفاتيح حرة.
4. أعيد استخدام جدول `currencies` للحقول المثبتة من الخدمة فقط: code, Arabic name, symbol, exchange rate, default, active, notes.
5. أدوار العملة الثلاثة تخزن كمراجع code داخل `company_settings.currency_roles`، مع مزامنة عملة المعاملات إلى `currencies.is_default`.
6. لم تُضف أعمدة `currency_name_en` أو `decimal_precision`، ولم تُنشأ migration؛ بقيتا فجوة معلنة في الواجهة.
7. أضيف `company_settings` و`currencies` إلى `tenantAwareTables` مع استمرار الفلاتر الصريحة بـ`company_id` في الخدمات.

### سلوك الصلاحيات المنفذ

- `system.settings/can_view`: فتح الصفحة.
- `can_edit`: إدارة الإعدادات العامة وتعديل العملات.
- `can_configure`: إدارة الإعدادات المخصصة وضبط أدوار العملات.
- `can_create`: إضافة عملة.
- `can_delete`: تعطيل عملة، وليس حذفًا فعليًا.

هذا تمييز آمن باستخدام أفعال النظام الحالية. التفصيل المستقل بمفاتيح مثل `system.settings.custom.manage` يبقى ضمن Batch 2B، ولم يجر توسيع bypass الإداري أو إعادة تصميم الأدوار.

### حالات الواجهة

كل تبويب يملك loading/error/empty/save state ورسائل نجاح وفشل. يوجد تحذير `beforeunload` ونقطة تأكيد عند ترك تبويب به تعديلات غير محفوظة. لا تستخدم الصفحة LocalStorage، ولا تتظاهر بالحفظ إذا فشل Supabase.

### حماية البيانات

- كود الشركة والاسم القانوني معروضان للقراءة فقط، ولا يتغير `company_code`.
- لا تغير عمليات الحفظ `currentUser` أو selected-company context.
- تعطيل عملة مستخدمة كعملة نظام أو راتب أو معاملات ممنوع حتى اختيار بديل.
- لا توجد عمليات حذف بيانات أو تغيير لسجلات الرواتب أو السجلات المالية.
- لا توجد كتابة اختبارية إلى Supabase ضمن التحقق.

### نتيجة التحقق

- Build ناجح عبر `cmd /c npm run build`.
- خادم Vite يعمل على `http://127.0.0.1:5174/` ويعيد HTTP 200.
- تسجيل الدخول ظهر دون أخطاء console، لكن اختبار الصفحات بعد المصادقة لم يُنفذ لعدم توفر جلسة دخول في منفذ الاختبار وعدم جواز تخمين بيانات الاعتماد.
- RLS والسياسات والمخطط المنشور ما زالت **Unverified until Supabase schema inspection**.

### الملفات

- `src/components/settings/SystemSettingsPage.jsx`
- `src/services/systemSettings.js`
- `src/services/settingsCurrencies.js`
- `src/services/tenant.js`
- ربط محدود في `src/App.jsx`, `src/constants/pageRegistry.js`, و`src/constants/moduleRegistry.js`
- وثيقتا الحالة والهندسة

### التوقف

الدفعة التالية المعتمدة في الخارطة، ولم تبدأ، هي **Batch 1B — المسميات الوظيفية، مواقع العمل، والحقول المخصصة للموظف**. يلزم اعتماد نتيجة Batch 1A قبل تنفيذها.

---

## ملحق التحقق التشغيلي المتحكم به — 2026-07-19

### حالة التحقق

التصنيف الحالي هو **Blocked by authentication**. تم التحقق من الربط الثابت، العزل الصريح في الخدمات، غياب LocalStorage التشغيلي في Batch 1A، وسلامة build وشاشة الدخول. لم تُعتمد الكتابة الفعلية أو الاستمرارية بعد reload أو عزل شركتين أو منع مستخدم العرض فقط لأن جلسة الاختبار لم تُصادق بعد.

### نتيجة فحص العقد المنشور

استُخدم عميل `src/services/supabase.js` لمحاولة استعلامين صفريين محددين بـ`company_id` وهمي على `company_settings` و`currencies`، دون قراءة سجلات فعلية ودون كتابة. أعادت بيئة الطرفية `fetch failed` بسبب حجب الشبكة؛ لذلك تبقى الأعمدة والقيود الفريدة وRLS والسياسات **Unverified until authenticated Supabase/runtime validation**.

### نتائج المراجعة الثابتة

- `system_settings` هو المفتاح الرسمي الوحيد، وتبويبات العامة والمخصصة والعملات داخل مكون واحد.
- `company_settings` و`currencies` tenant-aware، واستعلامات الخدمة مقيدة صراحةً بـ`company_id`.
- payload الإعدادات لا يرسل `company_code` أو الاسم القانوني، وpayload العملة لا يرسل أعمدة غير مثبتة مثل `currency_name_en` أو `decimal_precision`.
- أفعال UI المستخدمة: `can_view`, `can_create`, `can_edit`, `can_delete`, و`can_configure`.
- توجد فجوة أمان عامة سابقة: `canByPermission` يتصرف fail-open لبعض الإجراءات غير العرض عند غياب صف legacy؛ يلزم اختبار الدور العادي وعدم اعتماد أمان الإجراءات قبل معالجتها في نطاق مصرح به.
- اختيار شركة مشرف المنصة لا يستبدل الهوية بمستخدم آخر، لكنه يعدّل كائن `currentUserState` ببيانات سياق الشركة؛ هذا لا يحقق فصل context الصارم بالكامل ويحتاج معالجة منفصلة مصرحًا بها.

### التحقق والبناء

- شاشة الدخول على `http://127.0.0.1:5174/` سليمة وconsole خالٍ من الأخطاء.
- `git diff --check` سليم عدا تحذيرات LF/CRLF.
- `cmd /c npm run build` ناجح، مع تحذير حجم bundle فقط.
- لا SQL ولا migration ولا commit ولا push، ولم يبدأ Batch 1B.

### شرط الإغلاق

لا يغلق Batch 1A كـfully validated إلا بعد تسجيل دخول يدوي ثم اختبار save/reload واستعادة القيم الأصلية، واختبار شركتين، واختبار مستخدم عرض فقط، وتوثيق رسائل الخطأ الفعلية إن ظهرت.

---

## ملحق أمني — fail-closed وفصل سياق الشركة

- أصبحت `canByPermission` fail-closed عند غياب قائمة legacy أو صف الصفحة. لا تُمنح create/edit/delete/configure أو أي action آخر دون قيمة `true` صريحة، بينما بقيت التجاوزات الإدارية الموجودة خارج الدالة دون توسيع.
- لم يعد اختيار شركة مشرف المنصة ينسخ بيانات الشركة إلى `currentUserState`. تُحفظ الهوية منفصلة، وتبقى الشركة المختارة في `currentCompany` وtenant context.
- يمنع `normalizeTenantUser` توريث selected-company fields إلى مستخدم المنصة، ولا يغير سلوك المستخدم العادي داخل شركته.
- نجح build والاختبار الثابت للإصلاحين.
- التحقق الكتابي لـ`company_settings` و`currencies` لم يُنفذ لأن التبويب المستلم عاد إلى شاشة تسجيل الدخول بعد reload؛ التصنيف ما زال **Blocked by authentication** ولا يبدأ Batch 1B.

### استمرارية tenant auth context

كشف التحقق اللاحق حالة دخول نشطة بلا `currentUser/currentCompany`: كانت علامة الدخول في LocalStorage، بينما tenant context في `sessionStorage` فقط. عُدل مخزن الجلسة ليكتب سياق المصادقة في LocalStorage وsessionStorage ويقرأه بتوافق رجعي. هذا استثناء جلسة مصادقة مسموح، وليس تخزينًا تشغيليًا لبيانات HR. يلزم تسجيل دخول جديد واحد لتكوين السياق بعد فقده؛ وبعده تستأنف اختبارات Batch 1A الكتابية.
