"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChartCardProps {
  title: string;
  description?: string;
  chart: React.ReactNode;
  table: React.ReactNode;
  className?: string;
}

/** A chart with an equivalent, accessible table view. */
export function ChartCard({ title, description, chart, table, className }: ChartCardProps) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const headingId = `${title.toLowerCase().replace(/\W+/g, "-")}-heading`;
  return (
    <section aria-labelledby={headingId} className={`tile min-w-0 p-5 md:p-6 ${className ?? ""}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="font-display text-[1.75rem] leading-none">
            {title}
          </h2>
          {description && (
            <p className="mt-2 max-w-xl text-xs text-pretty text-muted-foreground">{description}</p>
          )}
        </div>
        <Tabs
          value={view}
          onValueChange={(value) => setView(value as "chart" | "table")}
          className="shrink-0"
        >
          <TabsList aria-label={`${title} view`} className="h-8 rounded-full">
            <TabsTrigger value="chart" className="rounded-full text-xs">
              Chart
            </TabsTrigger>
            <TabsTrigger value="table" className="rounded-full text-xs">
              Table
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {view === "chart" ? chart : <div className="max-h-80 overflow-auto">{table}</div>}
    </section>
  );
}

interface DataTableProps {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}

export function DataTable({ caption, columns, rows }: DataTableProps) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="sticky top-0 bg-[var(--tile-strong)] text-[12px] text-muted-foreground">
        <tr>
          {columns.map((column, index) => (
            <th
              key={column}
              scope="col"
              className={`py-2 font-normal ${index === 0 ? "text-left" : "text-right"}`}
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="font-figures tabular">
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-t border-[var(--hairline)]">
            {row.map((cell, index) => (
              <td
                key={index}
                className={`py-1.5 ${index === 0 ? "text-left font-sans" : "text-right"}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
