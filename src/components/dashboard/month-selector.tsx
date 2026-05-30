"use client";

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthSelectorProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function MonthSelector({
  label,
  onPrev,
  onNext,
  onToday,
}: MonthSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-lg border bg-card shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onPrev}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex min-w-[140px] items-center justify-center gap-2 px-2 text-sm font-medium">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {label}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onNext}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onToday}>
        This month
      </Button>
    </div>
  );
}
