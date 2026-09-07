import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" {...props}>{children}</svg>;
}

export const HomeIcon = (props: IconProps) => <Icon {...props}><path d="M4 10.5 12 4l8 6.5V20H4Z"/><path d="M9 20v-6h6v6"/></Icon>;
export const ChartIcon = (props: IconProps) => <Icon {...props}><path d="M4 19V9m6 10V5m6 14v-7m4 7H2"/></Icon>;
export const ContentIcon = (props: IconProps) => <Icon {...props}><rect x="4" y="3" width="16" height="18" rx="3"/><path d="m10 9 5 3-5 3Z"/></Icon>;
export const DirectorIcon = (props: IconProps) => <Icon {...props}><path d="M5 5h14v11H9l-4 4Z"/><path d="M9 9h6m-6 3h4"/></Icon>;
export const VaultIcon = (props: IconProps) => <Icon {...props}><path d="M4 7h16v13H4Z"/><path d="M8 7V4h8v3m-5 5h2"/></Icon>;
export const CalendarIcon = (props: IconProps) => <Icon {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></Icon>;
export const BrandIcon = (props: IconProps) => <Icon {...props}><path d="M12 3 4 7v5c0 4.5 3.4 7.7 8 9 4.6-1.3 8-4.5 8-9V7Z"/><path d="M9 12h6"/></Icon>;
export const MenuIcon = (props: IconProps) => <Icon {...props}><path d="M4 7h16M4 12h16M4 17h16"/></Icon>;
export const CloseIcon = (props: IconProps) => <Icon {...props}><path d="m6 6 12 12M18 6 6 18"/></Icon>;
