"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  mapExpensesWithParticipants,
  filterExpensesByMonth,
  type ExpenseSort,
  filterExpenses,
  sortExpenses,
} from "@/lib/expenses";
import type { ExpenseWithDetails } from "@/lib/types";

export function useGroupExpenses(groupId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!groupId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: expenseRows } = await supabase
      .from("expenses")
      .select("*")
      .eq("group_id", groupId)
      .order("expense_date", { ascending: false });

    if (!expenseRows?.length) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const expenseIds = expenseRows.map((e) => e.id);

    const { data: participantRows } = await supabase
      .from("expense_participants")
      .select("*")
      .in("expense_id", expenseIds);

    const userIds = new Set<string>();
    expenseRows.forEach((e) => userIds.add(e.paid_by));
    participantRows?.forEach((p) => userIds.add(p.user_id));

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", Array.from(userIds));

    const mapped = mapExpensesWithParticipants(
      expenseRows,
      participantRows ?? [],
      profiles ?? []
    );

    setExpenses(mapped);
    setLoading(false);
  }, [groupId, supabase]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!groupId) {
        if (!cancelled) {
          setExpenses([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      const { data: expenseRows } = await supabase
        .from("expenses")
        .select("*")
        .eq("group_id", groupId)
        .order("expense_date", { ascending: false });

      if (cancelled) return;

      if (!expenseRows?.length) {
        setExpenses([]);
        setLoading(false);
        return;
      }

      const expenseIds = expenseRows.map((e) => e.id);
      const { data: participantRows } = await supabase
        .from("expense_participants")
        .select("*")
        .in("expense_id", expenseIds);

      const userIds = new Set<string>();
      expenseRows.forEach((e) => userIds.add(e.paid_by));
      participantRows?.forEach((p) => userIds.add(p.user_id));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(userIds));

      if (cancelled) return;

      const mapped = mapExpensesWithParticipants(
        expenseRows,
        participantRows ?? [],
        profiles ?? []
      );
      setExpenses(mapped);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId, supabase]);

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`expenses-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `group_id=eq.${groupId}`,
        },
        () => fetchExpenses()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expense_participants",
        },
        () => fetchExpenses()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, supabase, fetchExpenses]);

  const setExpensesOptimistic = useCallback(
    (updater: (prev: ExpenseWithDetails[]) => ExpenseWithDetails[]) => {
      setExpenses(updater);
    },
    []
  );

  return {
    expenses,
    loading,
    refresh: fetchExpenses,
    setExpensesOptimistic,
  };
}

export function useFilteredExpenses(
  expenses: ExpenseWithDetails[],
  year: number,
  month: number,
  filters: {
    category?: string;
    search?: string;
    sort?: ExpenseSort;
  }
) {
  return useMemo(() => {
    const monthly = filterExpensesByMonth(expenses, year, month);
    const filtered = filterExpenses(monthly, {
      category: filters.category,
      search: filters.search,
    });
    return sortExpenses(filtered, filters.sort ?? "newest");
  }, [expenses, year, month, filters]);
}
