import { SidebarContent } from "./sidebar-content";

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-ink/[0.07] bg-canvas px-3.5 py-4 md:flex">
      <SidebarContent />
    </aside>
  );
}
