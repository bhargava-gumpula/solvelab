import { Timer, ScanLine, Dumbbell, Layers3, BookOpen, ChartNoAxesCombined } from "lucide-react";
export const navigation = [
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/coach", label: "Coach", icon: ScanLine },
  { href: "/train", label: "Train", icon: Dumbbell },
  { href: "/algorithms", label: "Algorithms", icon: Layers3 },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/stats", label: "Stats", icon: ChartNoAxesCombined },
] as const;
