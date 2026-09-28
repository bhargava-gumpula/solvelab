import {
  BookMarked,
  ChartNoAxesCombined,
  Dumbbell,
  GraduationCap,
  Layers3,
  Map as MapIcon,
  Settings2,
  Timer,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When false, the item stays in nav but opens a coming-soon / preview page. */
  enabled: boolean;
  /** Release label shown when `enabled` is false. */
  comingIn?: string;
  /** Other paths that count as this item, so it stays lit on pages it owns. */
  matches?: readonly string[];
  /** Only this exact path, not the pages under it. */
  exact?: boolean;
}

export type TabId = "timer" | "hub";

export interface NavigationTab extends NavigationItem {
  id: TabId;
  /** The pages inside this tab, shown as the second row of navigation. */
  sections: readonly NavigationItem[];
}

/**
 * The site has two places: the timer, and the Learning Hub where everything
 * about getting faster lives. Every page belongs to one of them.
 */
export const TABS: readonly NavigationTab[] = [
  {
    id: "timer",
    href: "/timer",
    label: "Timer",
    icon: Timer,
    enabled: true,
    matches: ["/stats"],
    sections: [
      { href: "/timer", label: "Timer", icon: Timer, enabled: true },
      { href: "/stats", label: "Stats", icon: ChartNoAxesCombined, enabled: true },
    ],
  },
  {
    id: "hub",
    href: "/hub",
    label: "Learning Hub",
    icon: GraduationCap,
    enabled: true,
    matches: ["/coach", "/learn", "/train", "/algorithms"],
    sections: [
      {
        href: "/hub",
        label: "Path",
        icon: MapIcon,
        enabled: true,
        exact: true,
        matches: ["/hub/start", "/hub/course", "/hub/unit", "/hub/lesson", "/hub/recognise"],
      },
      {
        href: "/hub/profile",
        label: "Profile",
        icon: UserRound,
        enabled: true,
        matches: ["/coach", "/hub/ask"],
      },
      { href: "/train", label: "Practice", icon: Dumbbell, enabled: true },
      { href: "/algorithms", label: "Algorithms", icon: Layers3, enabled: true },
      {
        href: "/hub/library",
        label: "Library",
        icon: BookMarked,
        enabled: true,
        matches: ["/learn"],
      },
    ],
  },
];

/** The top-level navigation: the two tabs. */
export const navigation: readonly NavigationItem[] = TABS;

export const settingsNavigation: NavigationItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings2,
  enabled: true,
};

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Whether a nav item should be lit on this page. */
export function isActiveItem(pathname: string, item: NavigationItem): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  const own = item.exact ? path === item.href : isActivePath(path, item.href);
  return own || (item.matches ?? []).some((href) => isActivePath(path, href));
}

/** The tab a page belongs to; settings and the public pages belong to neither. */
export function tabOf(pathname: string): NavigationTab | null {
  return TABS.find((tab) => isActiveItem(pathname, tab)) ?? null;
}

/** Where the site opens: the tab you were last on, on this device. */
export const LAST_TAB_KEY = "solvelab.lastTab";

/** The solve profile, which lives in the Learning Hub. */
export const PROFILE_HREF = "/hub/profile/";
