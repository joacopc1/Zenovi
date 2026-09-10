import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>;
}

export const HomeIcon = (props: IconProps) => <Icon {...props}><path d="m3.5 10.75 7.2-6.1a2 2 0 0 1 2.6 0l7.2 6.1"/><path d="M5.5 9.75V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9.75"/><path d="M9.5 21v-5.5a2.5 2.5 0 0 1 5 0V21"/></Icon>;
export const ChartIcon = (props: IconProps) => <Icon {...props}><path d="M4 4v16h16"/><path d="m7 15 4-4 3 3 5-7"/></Icon>;
export const ContentIcon = (props: IconProps) => <Icon {...props}><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="m10 8.5 5 3.5-5 3.5Z"/></Icon>;
export const DirectorIcon = (props: IconProps) => <Icon {...props}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M8 8h8M8 12h5"/></Icon>;
export const VaultIcon = (props: IconProps) => <Icon {...props}><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M9 13h6"/></Icon>;
export const CalendarIcon = (props: IconProps) => <Icon {...props}><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M7 3v4m10-4v4M3 10h18"/></Icon>;
export const BrandIcon = (props: IconProps) => <Icon {...props}><path d="M12 3 20 6.5v5.75c0 4.1-2.7 7.1-8 8.75-5.3-1.65-8-4.65-8-8.75V6.5Z"/><path d="m9 12 2 2 4-4"/></Icon>;
export const MenuIcon = (props: IconProps) => <Icon {...props}><path d="M4 7h16M4 12h16M4 17h16"/></Icon>;
export const CloseIcon = (props: IconProps) => <Icon {...props}><path d="m6 6 12 12M18 6 6 18"/></Icon>;
