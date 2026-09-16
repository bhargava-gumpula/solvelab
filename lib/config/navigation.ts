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
import { features } from "@/lib/config/features";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const allNavigation: readonly NavigationItem[] = [
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/coach", label: "Coach", icon: ScanLine },
  { href: "/train", label: "Train", icon: Dumbbell },
  { href: "/algorithms", label: "Algorithms", icon: Layers3 },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/stats", label: "Stats", icon: ChartNoAxesCombined },
];

export const navigation: readonly NavigationItem[] = allNavigation.filter((item) => {
  if (item.href === "/train") return features.train;
  if (item.href === "/learn") return features.learn;
  if (item.href === "/algorithms") return features.algorithms;
  return true;
});

export const settingsNavigation: NavigationItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings2,
};

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
