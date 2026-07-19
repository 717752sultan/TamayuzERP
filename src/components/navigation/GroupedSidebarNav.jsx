import React, { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, ChevronDown, ChevronLeft } from "lucide-react";

const findPage = (groups, predicate) => {
  for (const group of groups) {
    const page = group.pages.find(predicate);
    if (page) return { group, page };
  }
  return null;
};

export default function GroupedSidebarNav({ groups = [], activePage = "", moduleKey = "", icons = {}, onNavigate }) {
  const signature = useMemo(
    () => groups.map((group) => `${group.key}:${group.pages.map((page) => `${page.key}:${page.routeKey}`).join(",")}`).join("|"),
    [groups],
  );
  const activeMatch = findPage(groups, (page) => page.key === activePage)
    || findPage(groups, (page) => page.routeKey === activePage);
  const [openGroupKey, setOpenGroupKey] = useState(activeMatch?.group.key || groups[0]?.key || "");
  const [selectedItemKey, setSelectedItemKey] = useState(activeMatch?.page.key || "");

  useEffect(() => {
    const exactMatch = findPage(groups, (page) => page.key === activePage);
    const routeMatch = findPage(groups, (page) => page.routeKey === activePage);
    const match = exactMatch || routeMatch;
    if (!match) return;

    setSelectedItemKey((currentKey) => {
      const currentMatch = findPage(groups, (page) => page.key === currentKey);
      if (currentMatch && (currentMatch.page.key === activePage || currentMatch.page.routeKey === activePage)) return currentKey;
      return match.page.key;
    });
    setOpenGroupKey(match.group.key);
  }, [activePage, moduleKey, signature]);

  if (!groups.length) return null;

  return (
    <div className="space-y-1">
      {groups.map((group) => {
        const isOpen = openGroupKey === group.key;
        const containsSelectedPage = group.pages.some((page) => page.key === selectedItemKey);
        return (
          <section key={group.key} className="min-w-0 overflow-hidden rounded-xl">
            <button
              type="button"
              onClick={() => setOpenGroupKey((current) => current === group.key ? "" : group.key)}
              aria-expanded={isOpen}
              aria-controls={`sidebar-group-${group.key}`}
              className={`flex w-full min-w-0 items-center gap-2.5 rounded-xl border border-transparent px-3 py-3 text-right text-[14px] font-extrabold leading-5 transition-colors duration-150 ${containsSelectedPage ? "bg-white/[0.07] text-white" : "text-slate-300 hover:bg-white/[0.05] hover:text-white"}`}
            >
              <span className="min-w-0 flex-1 whitespace-normal break-words">{group.label}</span>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg transition-colors ${isOpen ? "bg-white/10 text-white" : "bg-white/[0.04] text-slate-400"}`}>
                <ChevronDown
                  size={17}
                  className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </span>
            </button>

            <div
              id={`sidebar-group-${group.key}`}
              aria-hidden={!isOpen}
              className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${isOpen ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-70"}`}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="mr-5 space-y-1 border-r border-white/[0.08] py-1.5 pr-3">
                  {group.pages.map((page) => {
                    const targetPage = page.routeKey || page.key;
                    const Icon = icons[targetPage] || icons[page.key] || BriefcaseBusiness;
                    const isActive = selectedItemKey === page.key;
                    return (
                      <button
                        key={page.key}
                        type="button"
                        onClick={() => {
                          setSelectedItemKey(page.key);
                          onNavigate?.(page);
                        }}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative flex w-full min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-right text-[12.5px] font-semibold leading-5 transition-colors duration-150 ${isActive ? "company-sidebar-active-page" : "border-transparent text-slate-400 hover:bg-white/[0.055] hover:text-slate-100"}`}
                      >
                        {isActive && <span aria-hidden="true" className="absolute inset-y-2 right-0 w-1 rounded-l-full bg-white/80" />}
                        <Icon size={16} className="shrink-0" />
                        <span className="min-w-0 flex-1 whitespace-normal break-words">{page.navLabel || page.label}</span>
                        {page.status === "placeholder" && <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-slate-300">قريبًا</span>}
                        {isActive && <ChevronLeft className="shrink-0" size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
