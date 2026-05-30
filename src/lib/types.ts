import type { ExpenseCategory } from "./constants";

export interface Profile {
  id: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export interface Expense {
  id: string;
  group_id: string;
  paid_by: string;
  title: string;
  notes: string | null;
  category: ExpenseCategory;
  amount_minor: number;
  expense_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseParticipant {
  expense_id: string;
  user_id: string;
}

export interface ExpenseWithDetails extends Expense {
  participants: ExpenseParticipant[];
  payer?: Profile;
  participant_profiles?: Profile[];
}

export interface GroupWithMembers extends Group {
  members: GroupMember[];
}
