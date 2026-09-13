import { statsConfig } from "@/lib/config/stats";
import { getAverage, type SessionStatistics } from "@/lib/stats";
import { formatAverage, formatTime } from "@/lib/timer/format";

interface StatsSummaryProps {
  stats: SessionStatistics;
}

/** Current vs. best for the averages that matter while solving. */
export function StatsSummary({ stats }: StatsSummaryProps) {
  const rows = [
    {
      label: "Single",
      current: formatTime(stats.latest),
      best: formatTime(stats.bestSingle?.value ?? null),
    },
    ...statsConfig.timerSummarySizes.map((size) => {
      const average = getAverage(stats, size);
      return {
        label: `Ao${size}`,
        current: formatAverage(average?.current ?? null),
        best: formatAverage(average?.best?.value ?? null),
      };
    }),
  ];

  return (
    <section aria-label="Session statistics" className="rounded-xl border bg-card">
      <table className="w-full text-sm">
        <caption className="sr-only">Current and best times for this session</caption>
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="px-4 pt-3 pb-2 text-left font-normal">
              <span className="sr-only">Statistic</span>
            </th>
            <th scope="col" className="px-4 pt-3 pb-2 text-right font-normal">
              Current
            </th>
            <th scope="col" className="px-4 pt-3 pb-2 text-right font-normal">
              Best
            </th>
          </tr>
        </thead>
        <tbody className="font-mono tabular">
          {rows.map((row) => (
            <tr key={row.label} className="border-t">
              <th scope="row" className="px-4 py-2 text-left font-sans font-medium">
                {row.label}
              </th>
              <td
                className="px-4 py-2 text-right"
                data-testid={`current-${row.label.toLowerCase()}`}
              >
                {row.current}
              </td>
              <td
                className="px-4 py-2 text-right text-primary"
                data-testid={`best-${row.label.toLowerCase()}`}
              >
                {row.best}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="grid grid-cols-3 border-t text-center text-xs">
        <div className="px-2 py-3">
          <dt className="text-muted-foreground">Mean</dt>
          <dd className="mt-1 font-mono tabular text-sm" data-testid="session-mean">
            {formatAverage(stats.mean)}
          </dd>
        </div>
        <div className="border-x px-2 py-3">
          <dt className="text-muted-foreground">Solves</dt>
          <dd className="mt-1 font-mono tabular text-sm" data-testid="solve-count">
            {stats.completedCount}/{stats.count}
          </dd>
        </div>
        <div className="px-2 py-3">
          <dt className="text-muted-foreground">σ</dt>
          <dd className="mt-1 font-mono tabular text-sm">
            {formatAverage(stats.standardDeviation)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
