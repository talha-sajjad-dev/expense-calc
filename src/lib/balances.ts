export type BalanceMap = Record<string, number>;

export interface ExpenseForBalance {
  amountMinor: number;
  payerId: string;
  participantIds: string[];
}

export interface Transfer {
  fromId: string;
  toId: string;
  amountMinor: number;
}

/** Distribute amount evenly; remainder paisa go to first participants. */
export function splitAmountEvenly(
  amountMinor: number,
  count: number
): number[] {
  if (count <= 0) return [];
  const base = Math.floor(amountMinor / count);
  const remainder = amountMinor % count;
  return Array.from({ length: count }, (_, i) =>
    i < remainder ? base + 1 : base
  );
}

/**
 * Net balance per user (minor units).
 * Positive = should receive; negative = owes; zero = settled.
 */
export function calculateBalances(
  expenses: ExpenseForBalance[]
): BalanceMap {
  const balance: BalanceMap = {};

  const ensure = (id: string) => {
    if (balance[id] === undefined) balance[id] = 0;
  };

  for (const expense of expenses) {
    const { amountMinor, payerId, participantIds } = expense;
    if (participantIds.length === 0 || amountMinor <= 0) continue;

    const shares = splitAmountEvenly(amountMinor, participantIds.length);

    ensure(payerId);
    balance[payerId] += amountMinor;

    participantIds.forEach((participantId, index) => {
      ensure(participantId);
      balance[participantId] -= shares[index];
    });
  }

  return balance;
}

/** Greedy min-cash-flow settlement between debtors and creditors. */
export function simplifyTransfers(balances: BalanceMap): Transfer[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, amount] of Object.entries(balances)) {
    if (amount > 0) creditors.push({ id, amount });
    else if (amount < 0) debtors.push({ id, amount: -amount });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0) {
      transfers.push({
        fromId: debtors[i].id,
        toId: creditors[j].id,
        amountMinor: amount,
      });
    }
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount === 0) i++;
    if (creditors[j].amount === 0) j++;
  }

  return transfers;
}

export function getUserBalance(balances: BalanceMap, userId: string): number {
  return balances[userId] ?? 0;
}

export interface MemberStats {
  userId: string;
  totalPaidMinor: number;
  totalShareMinor: number;
  netBalanceMinor: number;
}

export function calculateMemberStats(
  expenses: ExpenseForBalance[],
  memberIds: string[]
): MemberStats[] {
  const balances = calculateBalances(expenses);
  const paid: BalanceMap = Object.fromEntries(memberIds.map((id) => [id, 0]));
  const share: BalanceMap = Object.fromEntries(memberIds.map((id) => [id, 0]));

  for (const expense of expenses) {
    const { amountMinor, payerId, participantIds } = expense;
    if (participantIds.length === 0) continue;
    const shares = splitAmountEvenly(amountMinor, participantIds.length);
    if (paid[payerId] !== undefined) paid[payerId] += amountMinor;
    participantIds.forEach((pid, idx) => {
      if (share[pid] !== undefined) share[pid] += shares[idx];
    });
  }

  return memberIds.map((userId) => ({
    userId,
    totalPaidMinor: paid[userId] ?? 0,
    totalShareMinor: share[userId] ?? 0,
    netBalanceMinor: balances[userId] ?? 0,
  }));
}

export function categoryBreakdown(
  expenses: Array<{ category: string; amountMinor: number }>
): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const e of expenses) {
    breakdown[e.category] = (breakdown[e.category] ?? 0) + e.amountMinor;
  }
  return breakdown;
}
