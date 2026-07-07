"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import useMeasure from "react-use-measure";

import type { MobileNavTab } from "@/config/navigation";
import { lockAppScroll } from "@/lib/dom/scroll-lock";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const TAB_BAR_HEIGHT = "3.5rem";

function matchesHref(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function tabForPathname(tabs: MobileNavTab[], pathname: string): string | null {
  for (const tab of tabs) {
    if (tab.items.some((item) => matchesHref(pathname, item.href))) {
      return tab.label;
    }
  }
  return null;
}

export function MobileSubitemNavbar({ tabs }: { tabs: MobileNavTab[] }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const routeTab = useMemo(() => tabForPathname(tabs, pathname), [tabs, pathname]);

  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [subRef, { height: subHeight }] = useMeasure();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional close-on-navigate
    setActiveTab(null);
  }, [pathname]);

  useEffect(() => {
    if (!activeTab) return;
    return lockAppScroll();
  }, [activeTab]);

  useEffect(() => {
    if (!activeTab) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveTab(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTab]);

  const handleTabClick = (label: string) => {
    setActiveTab((current) => (current === label ? null : label));
  };

  const currentTab = tabs.find((entry) => entry.label === activeTab);

  const panelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: EASE_OUT };

  return (
    <>
      <AnimatePresence initial={false}>
        {activeTab ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => setActiveTab(null)}
            className="pointer-events-auto fixed inset-0 z-10"
            style={{
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              background: "rgba(10,10,14,0.45)",
              willChange: "opacity",
            }}
            aria-hidden
          />
        ) : null}
      </AnimatePresence>

      {/* Drop-up panel — anchored above the fixed tab bar */}
      <motion.div
        initial={false}
        animate={{ height: activeTab ? subHeight : 0 }}
        transition={panelTransition}
        className="pointer-events-auto fixed inset-x-0 z-20 overflow-hidden border-t border-white/[0.07] bg-[#0e0e0e]"
        style={{
          bottom: `calc(${TAB_BAR_HEIGHT} + env(safe-area-inset-bottom))`,
        }}
      >
        <div ref={subRef}>
          <AnimatePresence initial={false} mode="popLayout">
            {currentTab ? (
              <motion.div
                key={currentTab.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  transition: prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.1, ease: EASE_OUT },
                }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.18, ease: EASE_OUT }
                }
                className="px-3 pt-3 pb-3"
              >
                <div className="flex flex-wrap gap-2">
                  {currentTab.items.map((item) => {
                    const isSubActive = matchesHref(pathname, item.href);
                    const Icon = item.icon;

                    return (
                      <motion.div key={item.href} whileTap={{ scale: 0.96 }}>
                        <Link
                          href={item.href}
                          onClick={() => setActiveTab(null)}
                          className={cn(
                            "flex min-h-[38px] cursor-pointer touch-manipulation items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium antialiased transition-[background-color,color] duration-150 select-none",
                            isSubActive
                              ? "bg-white/[0.14] text-white"
                              : "bg-white/[0.05] text-white/70",
                          )}
                          aria-current={isSubActive ? "page" : undefined}
                        >
                          <Icon
                            className="size-3.5 shrink-0"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          <span>{item.shortLabel}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Tab bar — fixed size, never shifts */}
      <div
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.07] bg-[#0e0e0e]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-14 items-center">
          {tabs.map((tab) => {
            const isOpen = activeTab === tab.label;
            const isActive = isOpen || (!activeTab && routeTab === tab.label);
            const Icon = tab.icon;

            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => handleTabClick(tab.label)}
                aria-expanded={isOpen}
                className="relative flex h-14 flex-1 cursor-pointer touch-manipulation flex-col items-center justify-center gap-1 select-none"
              >
                <Icon
                  className={cn(
                    "size-[18px] shrink-0 transition-colors duration-150",
                    isActive ? "text-white" : "text-white/70",
                  )}
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span
                  className={cn(
                    "text-[10px] font-medium antialiased transition-colors duration-150",
                    isActive ? "text-white" : "text-white/70",
                  )}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
