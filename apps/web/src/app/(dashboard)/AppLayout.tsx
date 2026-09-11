"use client";

import { useState } from "react";
import Header from "../../components/header/Header";
import Sidebar from "../../components/sidebar/Sidebar";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isMobileOpen={isMobileOpen} onMobileClose={setIsMobileOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMobileMenuClick={() => setIsMobileOpen(true)} />

        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
