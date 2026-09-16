import {
  BookOpen,
  ChartNoAxesCombined,
  Dumbbell,
  Layers3,
  ScanLine,
  Settings2,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { features, upcoming } from "@/lib/config/features";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When false, the item stays in nav but opens a coming-soon / preview page. */
  enabled: boolean;
  /** Release label shown when `enabled` is false. */
  comingIn?: string;
}

export const navigation: readonly NavigationItem[] = [
  { href: "/timer", label: "Timer", icon: Timer, enabled: true },
  { href: "/coach", label: "Coach", icon: ScanLine, enabled: true },
  {
    href: "/train",
    label: "Train",
    icon: Dumbbell,
    enabled: features.train,
    comingIn: upcoming.train,
  },
  {
    href: "/algorithms",
    label: "Algorithms",
    icon: Layers3,
    enabled: features.algorithms,
    comingIn: upcoming.algorithms,
  },
  {
    href: "/learn",
    label: "Learn",
    icon: BookOpen,
    enabled: features.learn,
    comingIn: upcoming.learn,
  },
  { href: "/stats", label: "Stats", icon: ChartNoAxesCombined, enabled: true },
];

export const settingsNavigation: NavigationItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings2,
  enabled: true,
};

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
