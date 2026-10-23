"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "../../components/header/Header";
import Sidebar from "../../components/sidebar/Sidebar";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const currentPathRef = useRef(pathname);
  const scrollPositionsRef = useRef(new Map<string, number>());
  const popstatePathRef = useRef<string | null>(null);

  useEffect(() => {
    const onPopState = () => {
      const main = mainRef.current;
      if (main && currentPathRef.current) {
        scrollPositionsRef.current.set(currentPathRef.current, main.scrollTop);
      }
      popstatePathRef.current = window.location.pathname;
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!pathname || pathname === currentPathRef.current) return;

    const main = mainRef.current;
    const previousPath = currentPathRef.current;
    const isHistoryNavigation = popstatePathRef.current === pathname;
    popstatePathRef.current = null;

    if (main && previousPath) {
      if (!isHistoryNavigation) {
        scrollPositionsRef.current.set(previousPath, main.scrollTop);
      }
      currentPathRef.current = pathname;

      // Leave hash destinations to the browser and Next.js scroll handling.
      if (window.location.hash) return;

      const top = isHistoryNavigation
        ? scrollPositionsRef.current.get(pathname) ?? 0
        : 0;
      main.scrollTo({ top, behavior: "auto" });
      return;
    }

    currentPathRef.current = pathname;
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isMobileOpen={isMobileOpen} onMobileClose={setIsMobileOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMobileMenuClick={() => setIsMobileOpen(true)} />

        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
