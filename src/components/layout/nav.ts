import {
  LayoutDashboard,
  Timer,
  CalendarDays,
  FolderKanban,
  Boxes,
  TrendingUp,
  LineChart,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/daily", label: "Daily", icon: CalendarDays },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/skills", label: "Skills", icon: Boxes },
  { href: "/business", label: "Business", icon: TrendingUp },
  { href: "/reviews", label: "Reviews", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings },
];