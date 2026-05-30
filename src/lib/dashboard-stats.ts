import {
  calculateBalances,
  calculateMemberStats,
  categoryBreakdown,
  simplifyTransfers,
  getUserBalance,
  splitAmountEvenly,
} from "./balances";
import { toExpenseForBalance, filterExpensesByMonth } from "./expenses";
import type { ExpenseWithDetails } from "./types";

export function getDashboardStats(
  expenses: ExpenseWithDetails[],
  memberIds: string[],
  userId: string,
  year: number,
  month: number
) {
  const monthly = filterExpensesByMonth(expenses, year, month);
  const forBalance = monthly.map(toExpenseForBalance);

  const totalMinor = monthly.reduce((s, e) => s + e.amount_minor, 0);
  const userPaidMinor = monthly
    .filter((e) => e.paid_by === userId)
    .reduce((s, e) => s + e.amount_minor, 0);

  const balances = calculateBalances(forBalance);
  const userBalance = getUserBalance(balances, userId);

  const memberStats = calculateMemberStats(forBalance, memberIds);
  const transfers = simplifyTransfers(balances);
  const breakdown = categoryBreakdown(
    monthly.map((e) => ({ category: e.category, amountMinor: e.amount_minor }))
  );

  let userShareMinor = 0;
  for (const e of forBalance) {
    const idx = e.participantIds.indexOf(userId);
    if (idx >= 0) {
      const shares = splitAmountEvenly(
        e.amountMinor,
        e.participantIds.length
      );
      userShareMinor += shares[idx];
    }
  }

  return {
    monthly,
    totalMinor,
    userPaidMinor,
    userShareMinor,
    userBalance,
    balances,
    memberStats,
    transfers,
    breakdown,
  };
}
