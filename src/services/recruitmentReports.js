export const generateRecruitmentReports = ({ jobPostings = [], applications = [], evaluations = [], offers = [], contracts = [], plans = [], probationEmployees = [] }) => ({
  applications: { title: "تقرير طلبات التوظيف", rows: applications },
  jobPostings: { title: "تقرير الوظائف الشاغرة", rows: jobPostings },
  candidatesByStatus: { title: "تقرير المرشحين حسب الحالة", rows: applications },
  evaluations: { title: "تقرير تقييم المرشحين", rows: evaluations },
  offers: { title: "تقرير عروض العمل", rows: offers },
  contracts: { title: "تقرير العقود", rows: contracts },
  probation: { title: "تقرير الموظفين تحت التجربة", rows: probationEmployees },
  manpower: { title: "تقرير الاحتياجات الوظيفية", rows: plans },
  sources: { title: "تقرير مصادر التوظيف", rows: applications },
});

