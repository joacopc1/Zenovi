import { AppHeader } from "@/components/shell/app-header";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <AppHeader />
      <div className="w-full px-5 py-8 md:px-8 md:py-10 lg:px-10">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Ajustes</h1>
        <div className="mt-6">
          <SettingsTabs />
        </div>
        <div className="mx-auto mt-6 max-w-3xl space-y-5">{children}</div>
      </div>
    </>
  );
}
