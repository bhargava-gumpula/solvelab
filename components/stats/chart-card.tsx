"use client";

import { useState } from "react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
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
    <section
      aria-labelledby={headingId}
      className={`relative rounded-2xl p-4 glass md:p-5 ${className ?? ""}`}
    >
      <GlowingEffect spread={32} proximity={32} />
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={headingId} className="text-sm font-semibold">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        <Tabs value={view} onValueChange={(value) => setView(value as "chart" | "table")}>
          <TabsList aria-label={`${title} view`} className="h-8">
            <TabsTrigger value="chart" className="text-xs">
              Chart
            </TabsTrigger>
            <TabsTrigger value="table" className="text-xs">
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
      <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
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
      <tbody className="font-mono tabular">
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-t">
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
