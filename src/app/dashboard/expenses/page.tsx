"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useGroup } from "@/contexts/group-context";
import { useGroupExpenses, useFilteredExpenses } from "@/hooks/use-group-expenses";
import { useMonth } from "@/hooks/use-month";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { ExpenseListItem } from "@/components/expenses/expense-list-item";
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import type { ExpenseSort } from "@/lib/expenses";
import type { ExpenseWithDetails } from "@/lib/types";

export default function ExpensesPage() {
  const { activeGroup, members, userId } = useGroup();
  const { expenses, loading, refresh } = useGroupExpenses(
    activeGroup?.id ?? null
  );
  const { year, month, label, goPrev, goNext, goToday } = useMonth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<ExpenseSort>("newest");
  const [editExpense, setEditExpense] = useState<ExpenseWithDetails | null>(
    null
  );

  const filtered = useFilteredExpenses(expenses, year, month, {
    category,
    search,
    sort,
  });

  const memberProfiles = useMemo(
    () =>
      members.map((m) => m.profile).filter((p): p is NonNullable<typeof p> => !!p),
    [members]
  );

  if (!activeGroup || !userId) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Expenses</h2>
          <p className="text-sm text-muted-foreground">
            All shared expenses for {label}
          </p>
        </div>
        <MonthSelector
          label={label}
          onPrev={goPrev}
          onNext={goNext}
          onToday={goToday}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search title or notes..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {EXPENSE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as ExpenseSort)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="amount_desc">Highest amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center">
          <p className="font-medium">No expenses found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try another month, category, or search term—or add a new expense.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((expense) => (
            <ExpenseListItem
              key={expense.id}
              expense={expense}
              currentUserId={userId}
              onEdit={setEditExpense}
              onDeleted={refresh}
            />
          ))}
        </div>
      )}

      <ExpenseFormDialog
        open={!!editExpense}
        onOpenChange={(open) => !open && setEditExpense(null)}
        groupId={activeGroup.id}
        members={memberProfiles}
        expense={editExpense}
        onSuccess={refresh}
      />
    </div>
  );
}
