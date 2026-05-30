"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/currency";
import type { ExpenseWithDetails } from "@/lib/types";

interface RecentExpensesProps {
  expenses: ExpenseWithDetails[];
  limit?: number;
}

export function RecentExpenses({ expenses, limit = 5 }: RecentExpensesProps) {
  const recent = expenses.slice(0, limit);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Recent expenses</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/expenses">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No expenses this month. Add your first one!
          </p>
        ) : (
          <ul className="divide-y">
            {recent.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(e.expense_date), "MMM d")} ·{" "}
                    {e.payer?.full_name}
                  </p>
                </div>
                <span className="font-semibold shrink-0 ml-2">
                  {formatPKR(e.amount_minor)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
