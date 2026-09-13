import { HeaderActions } from "./header-actions";
import { MobileNavigation } from "./mobile-navigation";

export function AppHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-mist bg-paper px-5 md:px-7">
      <MobileNavigation />
      <HeaderActions />
    </header>
  );
}
