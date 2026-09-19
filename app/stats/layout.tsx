import { StatsTabs } from "@/components/stats/stats-tabs";

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StatsTabs />
      {children}
    </>
  );
}
