export const EXPENSE_CATEGORIES = [
  "Rent",
  "Groceries",
  "Utilities",
  "Internet",
  "Gas",
  "Transport",
  "Household",
  "Food",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const INVITE_CODE_LENGTH = 8;
