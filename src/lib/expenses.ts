import type { Expense, ExpenseParticipant, ExpenseWithDetails, Profile } from "./types";
import type { ExpenseForBalance } from "./balances";

export function toExpenseForBalance(
  expense: ExpenseWithDetails
): ExpenseForBalance {
  return {
    amountMinor: expense.amount_minor,
    payerId: expense.paid_by,
    participantIds: expense.participants.map((p) => p.user_id),
  };
}

export function mapExpensesWithParticipants(
  expenses: Expense[],
  participants: ExpenseParticipant[],
  profiles: Profile[]
): ExpenseWithDetails[] {
  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

  return expenses.map((expense) => {
    const eps = participants.filter((p) => p.expense_id === expense.id);
    return {
      ...expense,
      participants: eps,
      payer: profileMap[expense.paid_by],
      participant_profiles: eps
        .map((p) => profileMap[p.user_id])
        .filter(Boolean),
    };
  });
}

export function filterExpensesByMonth(
  expenses: ExpenseWithDetails[],
  year: number,
  month: number
): ExpenseWithDetails[] {
  return expenses.filter((e) => {
    const d = new Date(e.expense_date + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export type ExpenseSort = "newest" | "oldest" | "amount_desc";

export function sortExpenses(
  expenses: ExpenseWithDetails[],
  sort: ExpenseSort
): ExpenseWithDetails[] {
  const copy = [...expenses];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) =>
          new Date(a.expense_date).getTime() -
            new Date(b.expense_date).getTime() ||
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    case "amount_desc":
      return copy.sort((a, b) => b.amount_minor - a.amount_minor);
    case "newest":
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.expense_date).getTime() -
            new Date(a.expense_date).getTime() ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

export function filterExpenses(
  expenses: ExpenseWithDetails[],
  opts: {
    category?: string;
    search?: string;
  }
): ExpenseWithDetails[] {
  let result = expenses;
  if (opts.category && opts.category !== "all") {
    result = result.filter((e) => e.category === opts.category);
  }
  if (opts.search?.trim()) {
    const q = opts.search.trim().toLowerCase();
    result = result.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.notes?.toLowerCase().includes(q) ?? false)
    );
  }
  return result;
}
