"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPKR } from "@/lib/currency";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

interface CategoryBreakdownProps {
  breakdown: Record<string, number>;
  totalMinor: number;
}

export function CategoryBreakdown({
  breakdown,
  totalMinor,
}: CategoryBreakdownProps) {
  const entries = EXPENSE_CATEGORIES.map((cat) => ({
    category: cat,
    amount: breakdown[cat] ?? 0,
  })).filter((e) => e.amount > 0);

  if (entries.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Spending by category</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No expenses this month yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Spending by category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map(({ category, amount }) => {
          const pct = totalMinor > 0 ? (amount / totalMinor) * 100 : 0;
          return (
            <div key={category}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">{category}</span>
                <span className="text-muted-foreground">
                  {formatPKR(amount)} ({pct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
