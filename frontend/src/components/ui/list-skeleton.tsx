import * as React from "react";
import { cn } from "@/lib/utils";

export function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div
      role="status"
      className={cn(
        "w-full max-w-full p-4 border border-slate-200 divide-y divide-slate-100 rounded-xl shadow-xs animate-pulse md:p-6 bg-white",
        className
      )}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={`flex items-center justify-between ${index === 0 ? "pb-4" : "py-4"}`}
        >
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 rounded-full w-28 md:w-36"></div>
            <div className="w-40 md:w-56 h-2 bg-slate-200/60 rounded-full"></div>
          </div>
          <div className="h-3 bg-slate-200 rounded-full w-16 md:w-20"></div>
        </div>
      ))}
      <span className="sr-only">Loading data...</span>
    </div>
  );
}
