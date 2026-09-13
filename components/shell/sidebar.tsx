"use client";

import { useState } from "react";
import { SidebarContent } from "./sidebar-content";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-mist bg-canvas py-4 transition-[width] duration-200 md:flex ${collapsed ? "w-[68px] px-2.5" : "w-56 px-3.5"}`}
    >
      <SidebarContent
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((current) => !current)}
      />
    </aside>
  );
}
