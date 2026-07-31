import React, { useRef, useState } from "react";

const executiveSummary = "يهدف نظام التقييم والحوافز إلى ربط المكافآت الشهرية بنتائج فعلية قابلة للقياس، بما يضمن العدالة، ورفع الإنتاجية، وتحسين الانضباط، وتقليل الأخطاء، وتعزيز التنافس الإيجابي بين الموظفين والفروع.";
const types = [["حافز الأداء","تحقيق المستهدفات وجودة التنفيذ."],["حافز الانضباط","الالتزام بالحضور والسياسات."],["حافز التميز","المبادرات والتحسينات المؤثرة."]];
const criteria = [["الأداء والإنتاجية","40%",40],["الجودة وتقليل الأخطاء","25%",25],["الحضور والانضباط","20%",20],["السلوك والتعاون","15%",15]];
const cycle = ["تحديد المستهدفات واعتمادها","قياس النتائج والتحقق من البيانات","احتساب النقاط ومراجعة الاستحقاق","اعتماد الإدارة وصرف الحوافز"];
const rules = ["اعتماد المستهدفات قبل بداية الفترة.","الاعتماد على بيانات موثقة قابلة للمراجعة.","عدم وجود مخالفة جوهرية خلال فترة الاستحقاق.","مراجعة النتائج من الموارد البشرية والإدارة المعنية.","إتاحة الاعتراض خلال مدة محددة.","مراجعة الأوزان دوريًا وفق أولويات الشركة."];
const Section = ({n,title,children}) => <section className="p-sec"><div className="p-head"><b>{n}</b><h2>{title}</h2></div>{children}</section>;

export default function IncentiveProposalPage() {
  const reportRef = useRef(null);
  const [notice,setNotice] = useState("");

  const printPage = () => { try { window.print(); } catch (error) { console.error("تعذر طباعة تصور الحوافز",error); setNotice("تعذرت الطباعة."); } };
  const exportWord = () => {
    try {
      const body = reportRef.current?.innerHTML;
      if (!body) throw new Error("محتوى التقرير غير متاح");
      const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>body{direction:rtl;font-family:Tahoma,Arial,sans-serif;color:#172033;line-height:1.9;padding:30px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:10px;text-align:right}h1,h2{color:#312e81}.no-print{display:none}</style></head><body>${body}</body></html>`;
      const blob = new Blob(["\ufeff",html],{type:"application/msword;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href=url; link.download="تصور-نظام-التقييم-والحوافز.doc";
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      setNotice("تم تجهيز ملف Word بنجاح.");
    } catch (error) { console.error("تعذر تصدير ملف Word",error); setNotice("تعذر تصدير ملف Word."); }
  };
  const copySummary = () => {
    try {
      const fallback = () => {
        const area=document.createElement("textarea"); area.value=executiveSummary; area.style.cssText="position:fixed;opacity:0";
        document.body.appendChild(area); area.select();
        if(!document.execCommand("copy")) throw new Error("فشل النسخ البديل");
        area.remove(); setNotice("تم نسخ الملخص التنفيذي.");
      };
      if(navigator.clipboard?.writeText) navigator.clipboard.writeText(executiveSummary).then(()=>setNotice("تم نسخ الملخص التنفيذي.")).catch(error=>{console.error("تعذر النسخ المباشر",error);try{fallback()}catch(x){console.error("تعذر النسخ البديل",x);setNotice("تعذر نسخ الملخص التنفيذي.")}});
      else fallback();
    } catch (error) { console.error("تعذر نسخ الملخص التنفيذي",error); setNotice("تعذر نسخ الملخص التنفيذي."); }
  };

  return <div dir="rtl" className="proposal" style={{fontFamily:'"Tajawal","Cairo","IBM Plex Sans Arabic","Noto Kufi Arabic","Tahoma","Arial",sans-serif'}}>
    <style>{`
      .proposal{min-height:100%;padding:24px;background:linear-gradient(145deg,#0f172a,#241947 55%,#111827);color:#172033}.p-report{max-width:1160px;margin:auto;background:#f8fafc;border-radius:26px;overflow:hidden;box-shadow:0 30px 80px #02061770}.p-hero{padding:42px;background:linear-gradient(120deg,#17142f,#312e81 65%,#4f46e5);color:white}.p-hero small{color:#cbd5e1}.p-hero h1{font-size:clamp(28px,4vw,45px);font-weight:900;margin:12px 0}.p-hero p{color:#dbeafe;font-size:17px}.p-body{padding:28px}.p-actions{display:flex;gap:10px;flex-wrap:wrap}.p-btn{border:0;border-radius:12px;padding:11px 18px;background:#312e81;color:white;font-weight:800;cursor:pointer}.p-btn.alt{background:#e2e8f0;color:#1e293b}.p-notice{margin-top:14px;padding:10px 14px;background:#ecfdf5;color:#065f46;border-radius:10px}
      .p-sec{margin-top:22px;padding:22px;background:white;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 8px 22px #0f172a0d}.p-head{display:flex;align-items:center;gap:11px;margin-bottom:16px}.p-head b{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#312e81;color:white}.p-head h2{font-size:20px;font-weight:900;color:#1e1b4b}.p-summary{padding:23px;border:1px solid #c7d2fe;border-right:5px solid #4338ca;border-radius:16px;background:linear-gradient(135deg,#eef2ff,#fff);font-size:18px;line-height:2}
      .p-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:13px}.p-card,.p-kpi{padding:17px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px}.p-card h3{color:#312e81;font-weight:900;margin-bottom:7px}.p-kpis,.p-example{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.p-kpi strong{display:block;color:#312e81;font-size:25px}.p-kpi small{color:#64748b}.p-table{width:100%;border-collapse:collapse}.p-table th,.p-table td{padding:12px;border-bottom:1px solid #e2e8f0;text-align:right}.p-table th{background:#eef2ff;color:#312e81}.p-bar{height:9px;background:#e2e8f0;border-radius:9px;overflow:hidden}.p-bar i{display:block;height:100%;background:linear-gradient(90deg,#312e81,#818cf8)}
      .p-timeline{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.p-step{padding:17px;background:#f8fafc;border-top:4px solid #4338ca;border-radius:12px;font-weight:800}.p-rules{display:grid;grid-template-columns:1fr 1fr;gap:10px}.p-rule{padding:13px;background:#f8fafc;border-radius:11px}.p-rule:before{content:"✓";color:#4338ca;font-weight:900;margin-left:8px}.p-formula{padding:20px;background:#17142f;color:white;border-radius:15px;text-align:center;font-size:18px;font-weight:900}.p-example{margin-top:13px}.p-result{background:#312e81;color:white}.p-result strong,.p-result small{color:white}.p-approval{display:grid;grid-template-columns:1fr 1fr;gap:16px}.p-sign{min-height:120px;padding:16px;border:1px dashed #94a3b8;border-radius:13px}
      @media(max-width:800px){.p-grid,.p-kpis,.p-timeline,.p-example{grid-template-columns:1fr 1fr}.p-rules,.p-approval{grid-template-columns:1fr}.p-body{padding:16px}}@media(max-width:520px){.p-grid,.p-kpis,.p-timeline,.p-example{grid-template-columns:1fr}}@media print{.proposal{padding:0;background:white}.p-report{box-shadow:none}.no-print{display:none!important}.p-sec{break-inside:avoid}}
    `}</style>
    <div className="p-report" ref={reportRef}>
      <header className="p-hero"><small>وثيقة تنفيذية موجهة إلى المدير العام</small><h1>تصور نظام التقييم والحوافز</h1><p>إطار إداري يحوّل الأداء القابل للقياس إلى استحقاق عادل ومحفز.</p></header>
      <main className="p-body">
        <div className="p-actions no-print"><button className="p-btn" onClick={printPage}>طباعة</button><button className="p-btn" onClick={exportWord}>تصدير Word</button><button className="p-btn alt" onClick={copySummary}>نسخ الملخص التنفيذي</button></div>{notice&&<div className="p-notice no-print">{notice}</div>}
        <Section n="1" title="المقدمة"><div className="p-summary">{executiveSummary}</div></Section>
        <Section n="2" title="الهدف من نظام الحوافز"><div className="p-kpis">{[["عدالة","موحدة وشفافة"],["إنتاجية","مرتبطة بالنتائج"],["جودة","تقليل الأخطاء"],["استدامة","تحسين مستمر"]].map(([a,b])=><div className="p-kpi" key={a}><strong>{a}</strong><small>{b}</small></div>)}</div></Section>
        <Section n="3" title="أنواع الحوافز"><div className="p-grid">{types.map(([a,b])=><article className="p-card" key={a}><h3>{a}</h3><p>{b}</p></article>)}</div></Section>
        <Section n="4" title="معايير واستحقاق الحافز"><div className="overflow-x-auto"><table className="p-table"><thead><tr><th>المعيار</th><th>الوزن الاسترشادي</th><th>التوزيع</th></tr></thead><tbody>{criteria.map(([a,b,c])=><tr key={a}><td>{a}</td><td>{b}</td><td><div className="p-bar"><i style={{width:`${c}%`}}/></div></td></tr>)}</tbody></table></div><p className="mt-4 text-sm text-slate-600">يُشترط اعتماد النتائج وسلامة البيانات وعدم وجود مخالفة جوهرية.</p></Section>
        <Section n="5" title="آلية ودورة تطبيق النظام"><div className="p-timeline">{cycle.map((x,i)=><div className="p-step" key={x}>{i+1}. {x}</div>)}</div></Section>
        <Section n="6" title="الضوابط والشروط العامة"><div className="p-rules">{rules.map(x=><div className="p-rule" key={x}>{x}</div>)}</div></Section>
        <Section n="7" title="أثر الحافز على الموظفين والشركة"><div className="p-grid"><article className="p-card"><h3>على الموظفين</h3><p>وضوح التوقعات وعدالة التقدير وتعزيز الدافعية.</p></article><article className="p-card"><h3>على الفروع</h3><p>رفع التنافس الإيجابي وتبادل الممارسات الأفضل.</p></article><article className="p-card"><h3>على الشركة</h3><p>تحسين الإنتاجية والجودة والانضباط وربط التكلفة بعائد فعلي.</p></article></div></Section>
        <Section n="8" title="مثال تجريبي لحساب الحافز"><div className="p-formula">الحافز = إجمالي صندوق الحوافز × نقاط الموظف ÷ إجمالي نقاط المستحقين</div><div className="p-example"><div className="p-kpi"><small>إجمالي صندوق الحوافز</small><strong>500,000</strong></div><div className="p-kpi"><small>نقاط الموظف</small><strong>93</strong></div><div className="p-kpi"><small>إجمالي نقاط المستحقين</small><strong>1,000</strong></div><div className="p-kpi p-result"><small>الحافز المستحق</small><strong>46,500</strong></div></div></Section>
        <Section n="9" title="توصية الموارد البشرية"><p className="leading-8">توصي الموارد البشرية بتطبيق النظام بصورة تجريبية لمدة ثلاثة أشهر، مع مراجعة النتائج شهريًا وقياس أثره، ثم اعتماد النسخة النهائية بناءً على بيانات التجربة وملاحظات الإدارة.</p></Section>
        <Section n="10" title="اعتماد الإدارة"><div className="p-approval"><div className="p-sign"><strong>المدير العام</strong><br/>الاسم والتوقيع:<br/><br/>التاريخ:</div><div className="p-sign"><strong>مدير الموارد البشرية</strong><br/>الاسم والتوقيع:<br/><br/>التاريخ:</div></div></Section>
      </main>
    </div>
  </div>;
}
